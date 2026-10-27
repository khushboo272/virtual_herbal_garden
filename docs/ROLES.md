# Role-Based Access Control (RBAC) & Role Mutation Policy

Virtual Herbal Garden enforces a strict 5-tier role hierarchy. Higher roles inherit all capabilities and permissions of lower tiers.

---

## 1. Role Hierarchy

| Rank | Role | Description | Default Privileges |
| :---: | :--- | :--- | :--- |
| **0** | `GUEST` | Unauthenticated public visitor | Browse library, view 3D garden, explore public remedies, try sample guided tours, view scanner demonstration. |
| **1** | `USER` | Authenticated community member | Save personal garden, bookmark plants/remedies, run AI scanner, complete tours & quizzes, submit support requests, apply for contributor status. |
| **2** | `BOTANIST` | Verified expert contributor | All `USER` permissions + create/edit plant and remedy monographs, submit contributions for editorial review, review AI scanner detection feedback. |
| **3** | `ADMIN` | Platform administrator & editor | All `BOTANIST` permissions + review & moderate pending submissions, manage platform content (publish/unpublish/delete), manage users & moderation queue, review contributor applications. |
| **4** | `SUPER_ADMIN` | System administrator & owner | Full unrestricted platform control + system health, audit log viewer, feature flags, assigning `ADMIN` role. |

---

## 2. Role Mutation Matrix (`PATCH /admin/users/:id/role`)

The following matrix defines which actor roles may assign target roles to other users.

| Actor Role | Target Role Currently | Permitted Transitions | Prohibited Transitions | Enforcement |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `USER` | `BOTANIST` | `ADMIN`, `SUPER_ADMIN` | 403 Forbidden |
| **ADMIN** | `BOTANIST` | `USER` | `ADMIN`, `SUPER_ADMIN` | 403 Forbidden |
| **ADMIN** | `ADMIN` | *None* | Cannot modify equal or higher role | 403 Forbidden |
| **ADMIN** | `SUPER_ADMIN` | *None* | Cannot modify equal or higher role | 403 Forbidden |
| **ADMIN** | Self | *None* | Cannot modify self | 403 Forbidden |
| **SUPER_ADMIN** | `USER` | `BOTANIST`, `ADMIN` | `SUPER_ADMIN` | 403 Forbidden |
| **SUPER_ADMIN** | `BOTANIST` | `USER`, `ADMIN` | `SUPER_ADMIN` | 403 Forbidden |
| **SUPER_ADMIN** | `ADMIN` | `USER`, `BOTANIST` | `SUPER_ADMIN` | 403 Forbidden |
| **SUPER_ADMIN** | `SUPER_ADMIN` | *None* | Cannot modify self or another Super Admin | 403 Forbidden |

### Mutation Invariants
1. **Self-Modification Block:** No user may alter their own role under any circumstances.
2. **Hierarchy Privilege Check:** An actor can only mutate roles for users whose role rank is strictly **lower** than their own (`targetRank < actorRank`).
3. **Immediate Revocation:** Any role change immediately revokes all active refresh tokens for the target user (`RefreshToken.updateMany({ revokedAt: new Date() })`), forcing immediate re-authentication with updated claims.
4. **Audit Logging:** Every role change records an `AuditLog` entry storing actor, target user ID, old role, and new role.
5. **Notification:** The target user receives an immediate in-app system notification alerting them to the role modification.

---

## 3. "Become a Botanist" Contributor Application Workflow

1. **Submission (`POST /api/v1/role-applications`):**
   - Available to `USER` role.
   - Requires detailed motivation (min 50 characters), qualifications summary, and up to 3 reference links.
   - Enforces a strict limit of **1 PENDING** application per user at a time.
2. **Review Queue (`GET /api/v1/admin/role-applications`):**
   - Accessible by `ADMIN` and `SUPER_ADMIN`.
   - Lists applicants with account age, scan count, contribution count, and submitted credentials.
3. **Approval (`POST /api/v1/admin/role-applications/:id/approve`):**
   - Automatically promotes applicant to `BOTANIST`.
   - Revokes active refresh tokens to issue new claims.
   - Creates an `AuditLog` record and notifies applicant.
4. **Rejection (`POST /api/v1/admin/role-applications/:id/reject`):**
   - Requires explanatory feedback reason.
   - Updates status to `REJECTED`, creates `AuditLog`, and notifies applicant with feedback.
