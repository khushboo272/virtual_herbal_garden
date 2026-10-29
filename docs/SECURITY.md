# Security & Governance Architecture — Virtual Herbal Garden

This document details the security posture, authentication protocols, privilege elevation controls, and auditing guarantees implemented in the Virtual Herbal Garden platform.

---

## 1. Role-Based Access Control (RBAC) & Hierarchy

The platform implements a strict 5-tier role hierarchy:

```
GUEST (0) → USER (1) → BOTANIST (2) → ADMIN (3) → SUPER_ADMIN (4)
```

- **Inheritance Invariant:** Higher roles inherit all capabilities of lower roles.
- **Enforcement Middleware:** `requireRole(minimumRole)` enforces this hierarchy on all protected backend routes.
- **Super Admin Isolation:** All system governance endpoints (`/api/v1/system/*`) and frontend routes (`/dashboard/system/*`) are restricted strictly to `SUPER_ADMIN` (level 4). Any request with role `ADMIN` (level 3) or lower receives a `403 Forbidden` response or a client-side redirect.

---

## 2. Step-Up Re-Authentication Architecture

To defend against unauthorized actions from unattended or compromised active sessions, sensitive governance and security operations require secondary **step-up re-authentication**.

### 2.1 Reauth Token Protocol
1. **Challenge Endpoint:** `POST /api/v1/auth/reauth`
   - Accepts either the user's current account `password` OR a valid 6-digit TOTP / backup code.
   - Rate limited to **5 attempts per minute per IP address**.
   - Failures trigger an immediate `REAUTH_FAILED` audit log entry with severity `WARN` (never logging passwords or token strings).
2. **Token Issuance:** Upon successful verification, the server issues a scoped JWT:
   - **Lifetime:** Exactly 5 minutes (300 seconds).
   - **Scope / Purpose:** `{ purpose: "reauth", userId: user._id }`.
   - Distinct signing payload separating it from standard authentication access tokens.
3. **Protected Endpoints & `requireRecentAuth` Middleware:**
   The `requireRecentAuth` middleware checks for the `X-Reauth-Token` header:
   - Validates JWT signature, expiration, and verifies `payload.purpose === 'reauth'`.
   - Asserts that `payload.userId === req.user.sub` (preventing token forwarding between accounts).
   - Protects:
     - `PATCH /api/v1/system/users/:id/role` (Promoting / demoting admin roles)
     - `DELETE /api/v1/system/users/:id/sessions/:sessionId` (Revoking another admin's session)
     - `GET /api/v1/system/audit-logs/export.csv` (Streaming sensitive audit records)
     - `POST /api/v1/auth/2fa/regenerate-backup-codes` (Generating fresh emergency access codes)
     - `POST /api/v1/auth/2fa/disable` (Disabling two-factor protection)

---

## 3. Two-Factor Authentication (2FA) & Emergency Backup Codes

Platform 2FA complies with RFC 6238 Time-based One-Time Password (TOTP) standards.

### 3.1 Enrollment & Invariants
- **Secret Generation:** Generated using cryptographically secure random bytes via Speakeasy.
- **QR Code Delivery:** Embedded directly as an inline Base64 data URL (`data:image/png;base64,...`) via the `qrcode` library. The secret is never sent to external third-party chart APIs.
- **Activation Guard:** 2FA status remains disabled until the user provides a valid 6-digit TOTP code confirming successful authenticator app synchronization.
- **Emergency Backup Codes:**
  - Exactly 10 random 8-character alphanumeric codes (`XXXX-XXXX`) are generated upon enrollment.
  - **Storage Invariant:** Plaintext backup codes are returned **only once** to the user in a secure download/print modal.
  - Backup codes are hashed via `bcrypt` before storage in `user.twoFactorBackupCodes`.
  - Each backup code is single-use (`used: true`, `usedAt: Date`). Once consumed, it cannot be reused.
- **Login Challenge:** If a user with 2FA enabled submits valid credentials to `POST /auth/login`, the server returns `{ require2FA: true, twoFactorTempToken: "..." }`. The session is only created once verified against `POST /auth/2fa/login-verify`.

---

## 4. Session Tracking & Multi-Device Revocation

The platform maintains server-side tracking of active refresh tokens in MongoDB.

### 4.1 Session Metadata
Each session record contains:
- `userId`: Owning user account.
- `hashedToken`: SHA-256 hash of the refresh token (plaintext token is never stored in DB).
- `ip`: Client IP address at issuance/refresh.
- `userAgent`: Client user-agent string.
- `deviceInfo`: Parsed client platform (OS, browser, device category).
- `lastUsedAt`: Timestamp of the most recent token refresh.
- `createdAt` & `expiresAt`: TTL lifecycle.

### 4.2 Revocation Semantics
- **Single Session Revocation:** `DELETE /api/v1/users/me/sessions/:sessionId` deletes the token from DB, invalidating the session on next refresh.
- **Revoke All Others:** `POST /api/v1/users/me/sessions/revoke-others` invalidates all stored sessions except the caller's active session.
- **Role Change Invalidation:** When a Super Admin updates a user's role (`PATCH /system/users/:id/role`), all active refresh sessions for that user are immediately deleted from MongoDB, forcing them to re-authenticate with their new permissions.

---

## 5. Append-Only Audit Logging & Redaction

Audit logs provide an immutable forensic history of system and governance actions.

### 5.1 Immutability & Retention
- **Append-Only:** The `/api/v1/system/audit-logs` endpoint exposes strictly `GET` operations. Any `PUT`, `PATCH`, or `DELETE` request is rejected with `404 Not Found` / `405 Method Not Allowed`.
- **Retention TTL:** Records feature a MongoDB TTL index on `expiresAt` automatically purging records after 12 months.

### 5.2 Secret Redaction Invariant
The audit service intercepts all log writes through `sanitizeAuditData()`. Any property matching sensitive keys is permanently replaced with `"[REDACTED]"`:
- `password`, `currentPassword`, `newPassword`
- `token`, `accessToken`, `refreshToken`, `reauthToken`, `twoFactorTempToken`
- `secret`, `twoFactorSecret`, `backupCodes`, `otpauthUrl`
- `authorization`, `cookie`, `x-reauth-token`

### 5.3 Automated Threat Intelligence & Suspicious IP Rule
`GET /api/v1/system/security/events` executes high-performance aggregation across audit records:
- **Suspicious IP Rule:** Detects any IP address with **5 or more failed login attempts within a 10-minute sliding window**.
- Aggregates failed authentication attempts by IP address and calendar day over the last 30 days.
- Surfaces recent account lockout events with client metadata.
