# Virtual Herbal Garden - Comprehensive Project Report
**Generated:** 2026-09-18  
**Scope:** Entire project  
**Report version:** 2.0  
**Assessment basis:** Source tree, route registration, package manifests, tests, project notes, and current build/typecheck/test/lint commands.

## 1. Executive Summary
Virtual Herbal Garden is a full-stack medicinal-plant education platform. It combines a public plant library, remedies and guided tours with authenticated user dashboards, AI plant detection, personal garden management, and an immersive Three.js garden. Botanists can contribute plant content and 3D assets; administrators moderate content, manage users, inspect analytics, and configure system features. The project has broad feature scaffolding and a successful frontend production bundle, but it is not currently release-ready: backend typechecking and the full test suite fail, several dashboard views are static shells, and AI processing is not functional in the default local Redis mode.

## 2. Project Overview
### 2.1 Purpose
The platform is intended to make medicinal plants easier to explore and learn through searchable botanical content, remedies, interactive tours, AI identification, and a persistent virtual garden.

### 2.2 Technology stack
| Technology | Version | Use |
|---|---:|---|
| React | 19.2.4 | Frontend UI |
| Vite | 8.0.1 | Frontend development/build |
| TypeScript | Frontend 6.0.2; backend 5.5.0 | Static typing |
| Tailwind CSS | 4.2.2 | Styling |
| React Router | 7.13.2 | Frontend routing |
| Express | 4.21.0 | HTTP API |
| Mongoose/MongoDB | Mongoose 8.5.0 | Persistence |
| JWT, Passport, Google OAuth | Current package versions | Authentication |
| bcryptjs, otplib, nodemailer | Current package versions | Passwords, 2FA, email |
| BullMQ + Redis/ioredis | Current package versions | Detection/email jobs |
| Socket.IO | 4.7.5 backend; 4.8.3 frontend | Realtime events |
| Three.js, React Three Fiber, Drei, Rapier | Current package versions | 3D garden, physics, models |
| Howler.js | 2.2.4 | Ambient/spatial audio |
| AWS SDK S3 / Cloudflare R2 | Current package versions | Media and GLB storage |
| Jest / Vitest | 29.7.0 / 4.1.5 | Backend/frontend tests |
| Sharp | 0.33.4 | Image processing |

### 2.3 Architecture
The backend is a modular Express application under `backend/src`: each domain has routes, controllers, services, validators, and Mongoose models. Cross-cutting concerns live under `core` for configuration, middleware, jobs, sockets, logging, storage, hashing, encryption, JWTs, and API responses.

The frontend is a React/Vite application. Shared layouts and pages live under `frontend/src/app`; reusable UI primitives are under `app/components/ui`; dashboard pages are under `app/components/dashboard`; hooks provide API integration; contexts provide authentication and tour progress; the garden is split between the main Three.js scene and reusable environment/plant/audio systems.

Important entry points:
- [backend/src/app.ts](backend/src/app.ts) - security middleware, CORS, API mounting, health endpoint, Swagger, errors.
- [backend/src/routes/index.ts](backend/src/routes/index.ts) - API module registration.
- [frontend/src/App.tsx](frontend/src/App.tsx) - browser routes and route guards.
- [frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx) - client authentication state.
- [frontend/src/components/Garden3DScene.tsx](frontend/src/components/Garden3DScene.tsx) - main 3D garden scene.

## 3. Implemented Features
### 3.1 Public plant library
**Status:** Partial, implemented with limitations.

The frontend exposes home, library, plant-detail, remedies, virtual-tour, mobile, and style-guide pages. The backend supports plant listing, pagination/filter validation, featured plants, autocomplete, detail, related plants, reviews, and public garden-visible plants. Plant details include botanical information, medicinal uses, growing conditions, toxicity and media/model metadata. The user notes still identify favorite/share behavior as broken, and some UI paths use mock/fallback plant data.

### 3.2 Authentication and account security
**Status:** Backend largely implemented; end-to-end verification currently blocked.

Implemented backend flows include registration, login, logout, refresh-token rotation, email verification endpoint, forgot/reset password endpoints, Google OAuth, TOTP 2FA setup/verification, logout-all, password hashing, and login lockout. The frontend stores access tokens and refreshes the current user; OAuth popup handling includes callback/local-storage fallback logic.

Known implementation gap: auth service contains TODOs where verification and reset emails should be sent. SMTP service and an email worker exist, but these flows do not currently enqueue those messages.

### 3.3 Role-based access
**Status:** Backend implemented and RBAC tests pass; frontend route enforcement is incomplete.

Roles are `GUEST`, `USER`, `BOTANIST`, `ADMIN`, and `SUPER_ADMIN`, with hierarchical access. Backend `authenticate` and `requireRole` guards protect domain operations. Role promotion is restricted to SUPER_ADMIN and excludes changing/promoting SUPER_ADMIN accounts. The frontend provides `RequireRole`, `hasMinRole`, and role-aware navigation.

The `/dashboard` parent route is guarded at USER+. However, admin/super-admin child routes are nested below that guard without their own frontend role checks. A user can manually open those shells; backend calls should still reject unauthorized operations. `/garden-3d` is also currently unguarded in `App.tsx`.

### 3.4 Personal garden
**Status:** Backend and 3D interaction surfaces implemented; persistence and UI coverage are partial.

The garden API supports reading a user garden, adding a plant, updating position/rotation/scale/growth stage/notes, and removing a plant. Frontend hooks and 3D components support personalized zones, selection, placement mode, movement, camera focus, and growth metadata. The dashboard My Garden page is largely a link into the 3D experience rather than a complete data-management view.

### 3.5 3D garden
**Status:** Broadly implemented as an interactive scene; real content pipeline needs production verification.

Implemented systems include React Three Fiber rendering, Rapier ground physics, procedural ground/mountains/clouds, grass with wind shader, river/water normals, day/night lighting and HDRI changes, stars/moon/fireflies, birds/boids, plant model loading and LOD, selection/raycasting, camera focus, orbit/first-person modes, touch/mobile handling, loading progress, minimap/HUD, fullscreen/navbar hiding, audio loops/spatial river audio/crossfades, and post-processing.

The backend supports plant model/LOD uploads, deletion, garden position updates, visibility metadata, and R2 storage. Current limitations include fallback geometric plants/mock data and the reported issue that database plants can appear visually identical when real GLB assets are missing or not loaded.

### 3.6 Botanist contributions
**Status:** Partial.

Botanist users can create/update plants and remedies, upload plant images and GLB/LOD models, set garden positions, and use contribution navigation. Several contribution routes in `App.tsx` still render `DashboardHome` instead of dedicated contribution forms/pages.

### 3.7 Remedies
**Status:** Backend CRUD exists; frontend experience is partial/static.

The API lists and fetches remedies and allows BOTANIST create/update and ADMIN delete/publish. The frontend has a remedies page and search UI, but project notes identify the page as static and not fully connected to backend behavior.

### 3.8 Virtual tours
**Status:** Backend CRUD exists; frontend tour interaction is partial/static.

The API lists, fetches, creates, updates, deletes, and publishes tours. The frontend contains checkpoint data, progress tracking, checkpoint details, audio, quiz activities, and tour pages. Current dashboard tour management uses sample tour data, and project notes report that review/replay/actions are not connected to backend persistence.

### 3.9 AI plant detection
**Status:** Incomplete integration.

Backend flow: authenticated USER uploads an image to `POST /ai/detect`; the service creates a Detection record and queues a job. A BullMQ worker calls the configured Python AI service, stores predictions, processing time, top match, and failure state. Botanists can submit feedback; admins can view statistics.

Current blockers:
- Default local Redis mode replaces BullMQ with `MockQueue` and disables the worker, so detections remain PENDING.
- Frontend submission does not poll `GET /ai/detect/:jobId` after receiving the asynchronous job response.
- Frontend history calls `/ai/detections`, but backend exposes `/ai/history`.
- Frontend/backend status naming differs (`COMPLETED` versus backend `COMPLETE`).
- Project notes report fixed/static answers rather than true model results.

### 3.10 Dashboards and notifications
**Status:** Infrastructure implemented; content is mixed real/static.

There is a unified dashboard layout with responsive sidebar/drawer, breadcrumbs, search navigation, role-specific navigation, stat cards, badges, empty states, confirmation modals, skeletons, notifications, and dashboard summary APIs. USER, BOTANIST, ADMIN, and SUPER_ADMIN panels exist. Realtime Socket.IO notifications and plant/detection events are wired in backend and frontend.

Static or incomplete dashboard pages include AI scanner statistics, user-growth chart, featured-content actions, create-tour form, tour analytics, bookmarks, My Garden, AI Scanner history, and some system/sub-page content. `SubPages.tsx` explicitly labels itself as stub content. One user hook calls a nonexistent per-notification PATCH endpoint; the separate notifications hook uses the valid bulk routes.

## 4. Data Models
The backend contains these Mongoose models:

| Model | Purpose and notable data |
|---|---|
| User | Identity, email, password/auth provider, role, lockout/security, profile, activity metrics, 2FA |
| RefreshToken | Refresh-token persistence, expiry/revocation/device data |
| Plant | Botanical data, descriptions, uses, growing conditions, toxicity, images, publishing/feature state, 3D model/LOD URLs, garden position/bed/visibility, uploader |
| Category | Plant classification/category metadata |
| Review | User plant reviews, ratings, moderation/flags |
| Remedy | Remedy description, ingredients, preparation, publishing/media data |
| Garden | User-owned garden plants and 3D transform/growth/notes data |
| Detection | Uploaded image/job state, predictions, top match, feedback, model version, timing/errors |
| Tour | Tour metadata, stops/checkpoints, media, coordinates, publishing state |
| Bookmark | User-to-entity saved items and entity type |
| Notification | User notifications, type/read state, related entity/message |
| ActivityLog | User activity and timestamps |
| AuditLog | Administrative/security actions and actor/target metadata |
| SystemConfig | Runtime/public system settings and feature flags |

Shared enums and API response contracts are defined in [backend/src/types/index.ts](backend/src/types/index.ts). Mongoose reports duplicate indexes on several fields during tests, including user, slug, and scientificName.

## 5. Authentication and Authorization
**Auth method:** JWT access tokens with refresh-token cookie flow; Google OAuth; TOTP 2FA.  
**Frontend storage:** access token is stored in `localStorage`; this increases the impact of an XSS vulnerability.  
**Role hierarchy:** `GUEST (0) < USER (1) < BOTANIST (2) < ADMIN (3) < SUPER_ADMIN (4)`.

Backend protections include authenticated user routes, BOTANIST content contribution routes, ADMIN moderation/publishing/stat routes, and SUPER_ADMIN role/system configuration routes. Public read endpoints include plant, remedy, tour, and garden-visible data. The frontend guards `/ai-detect` and `/dashboard` but does not fully guard all nested role-specific pages or `/garden-3d`.

## 6. API Reference
Base URL: `/api/v1`.

| Module | Registered endpoints and behavior |
|---|---|
| Auth | `POST /auth/register`, `/login`, `/logout`, `/refresh`, `/verify-email`, `/forgot-password`, `/reset-password`, `/2fa/setup`, `/2fa/verify`, `/logout-all`; `GET /auth/google`, `/google/callback` |
| Plants | `GET /plants`, `/featured`, `/search/autocomplete`, `/garden`, `/:slug`, `/:id/related`, `/:id/reviews`; `POST /plants`, `/:id/publish`, `/:id/feature`, `/:id/images`, `/:id/reviews`; `PATCH /plants/:id`, `/:id/garden-position`; `DELETE /plants/:id`, `/:id/model`; `PUT /plants/:id/model`, `/:id/model-lod` |
| Remedies | `GET /remedies`, `/:slug`; `POST /remedies`, `/:id/publish`; `PATCH /remedies/:id`; `DELETE /remedies/:id` |
| Tours | `GET /tours`, `/:slug`; `POST /tours`, `/:id/publish`; `PATCH /tours/:id`; `DELETE /tours/:id` |
| Personal garden | `GET /users/me/garden`; `POST /users/me/garden/plants`; `PATCH /users/me/garden/plants/:pid`; `DELETE /users/me/garden/plants/:pid` |
| AI | `POST /ai/detect`; `GET /ai/detect/:jobId`, `/history`, `/stats`; `POST /ai/detect/:id/feedback` |
| Users | `GET /users/me`, `/bookmarks`, `/notifications`, `/activity`, `/stats`, `/dashboard-summary`; `PATCH /users/me`, `/notifications/read-all`, `/notifications/mark-read`; `POST /users/me/avatar`, `/bookmarks`; `DELETE /users/me`, `/bookmarks/:id` |
| Admin | `GET /admin/dashboard-summary`, `/stats`, `/stats/overview`, `/stats/analytics`, `/users`, `/plants/drafts`, `/reviews/flagged`, `/audit-logs`, `/system/health`, `/system/config/public`; `PATCH /admin/users/:id/role`, `/users/:id/ban`, `/system/config`; `POST /admin/plants/:id/approve`, `/plants/:id/reject`, `/notifications/broadcast`; `DELETE /admin/reviews/:id` |

Also available: `GET /health` and lazy Swagger UI under `/api/docs`.

## 7. Frontend Structure
### 7.1 Routes
| Route | Current implementation |
|---|---|
| `/` | Home page |
| `/library` | Searchable plant library |
| `/plant/:id` | Plant detail |
| `/ai-detect` | AI scanner, USER guard |
| `/remedies` | Remedies page |
| `/virtual-tour` | Virtual tour page |
| `/mobile` | Mobile-specific page using mock plants |
| `/style-guide` | Static style guide |
| `/dashboard` | Unified USER+ dashboard with role-switch home |
| `/dashboard/garden`, `/bookmarks`, `/scanner`, `/profile`, `/help`, `/tours` | Shared dashboard pages |
| `/dashboard/contributions*`, `/dashboard/ai-feedback` | Currently mapped to dashboard home |
| `/dashboard/plants`, `/moderation`, `/analytics*`, `/featured`, `/users`, `/tours/manage*`, `/tours/analytics` | Admin dashboard pages without individual frontend role guards |
| `/dashboard/system*` | Super-admin pages without individual frontend role guards |
| `/garden-3d` | Full-screen 3D garden, currently no route guard |
| `/oauth/callback` | OAuth token callback |

### 7.2 State and API integration
Global state is handled by `AuthContext` and `TourProgressContext`. API access is centralized in `frontend/src/lib/api.ts`; domain hooks include `useAdmin`, `useBotanist`, `useDashboard`, `useDetection`, `useGardenPlants`, `useNotifications`, `usePlants`, `useRemedies`, `useTours`, and user hooks. Socket integration is centralized in `frontend/src/lib/socket.ts`.

### 7.3 Visual/component system
The application includes Radix-based UI primitives, Tailwind styling, responsive navigation/drawers, dashboard components, 3D HUD/minimap/touch controls, plant upload modal/dropzone, garden position picker, audio systems, loaders, procedural environment pieces, and post-processing.

## 8. Testing and Current Verification
### 8.1 Test inventory
Backend tests include auth, AI, garden, plants, RBAC, user statistics, admin statistics, and notification service tests. Frontend tests cover media queries, navbar variants, HUD, loader, audio, and post-processing.

### 8.2 Current command results
| Check | Result |
|---|---|
| Frontend production build | **Passes**. Emits warnings about a CSS import order, a large ~4.8 MB JS chunk, and ineffective dynamic import splitting. |
| Frontend lint | **Fails** on `vite.config.js`: `__dirname` is undefined in the ESM config. |
| Backend typecheck | **Fails**: missing `NotificationType.SYSTEM_ALERT` in notification tests and unused `req` in `plant.controller.ts`. |
| Backend full Jest suite | **Fails before complete execution**: multiple tests import obsolete `src/models/*` and `src/utils/*` paths; AI/admin tests also hit missing environment configuration. RBAC and user-stat tests pass in the observed run. |
| Frontend automated tests | No package `test` script is defined, so they are not part of the standard root verification command. |

## 9. Environment and Configuration
Validated backend settings in `backend/src/core/config/env.ts` include:

| Group | Variables |
|---|---|
| Server | `NODE_ENV`, `PORT`, `API_VERSION` |
| MongoDB | `MONGODB_URI`, `MONGODB_DB_NAME` |
| Redis | `REDIS_URL` |
| JWT | `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` |
| S3 | `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CDN_BASE_URL` |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |
| AI | `AI_SERVICE_URL`, `AI_MODEL_VERSION` |
| Security/email | `ENCRYPTION_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |
| Frontend/limits/logging | `CLIENT_URL`, rate-limit variables, `LOG_LEVEL` |

R2-specific settings are read directly from `process.env` in `backend/src/lib/r2Client.ts` and are not represented in the validated env schema. The repository has no reliable checked-in environment template visible in the audited files.

## 10. Known Issues and Risks
| Severity | Issue | Evidence/status |
|---|---|---|
| Critical | Credentials committed to repository | `cloudflare.txt` contains live-looking Cloudflare API/token and R2 access credentials. Revoke/rotate immediately; remove from history and use secret storage. |
| High | Backend is not type-clean | Typecheck fails in notification test and plant controller. |
| High | Backend suite is structurally stale | Several tests import paths that no longer exist under the current `modules`/`core` layout. |
| High | AI does not complete locally | Mock queue has no worker; frontend does not poll asynchronous status. |
| High | Frontend has AI contract mismatches | Wrong history path and status enum mismatch. |
| High | Admin UI route exposure | Nested admin/system pages lack frontend role guards, although backend authorization exists. |
| Medium | Email verification/reset delivery unfinished | Explicit TODOs in auth service. |
| Medium | Notifications hook calls nonexistent endpoint | Per-notification PATCH path is absent in backend. |
| Medium | Static/incomplete dashboard pages | `SubPages.tsx`, sample tours, hard-coded analytics, and unconnected bookmarks/garden/scanner views. |
| Medium | Token XSS exposure | Access token in localStorage. |
| Medium | R2 env/config inconsistency | R2 values bypass validated environment configuration. |
| Medium | Frontend lint failure | ESM `__dirname` usage. |
| Low | Frontend bundle is very large | Approximately 4.8 MB minified JS output. |
| Low | Duplicate Mongoose indexes | Warnings for user, slug, scientificName, and related indexes. |
| Low | Documentation drift | Root README is still the default Vite template; root PRD/TASK_LIST contain headings only; historical completion notes overstate current verification. |

## 11. Completion Status
Because the root PRD is only a heading and contains no requirement list, a defensible percentage against PRD requirements cannot be calculated. Based on source breadth rather than release readiness:

| Area | Source implementation | Operational status |
|---|---|---|
| Core backend modules/API | Broad | Mostly implemented; not type/test clean |
| Auth/RBAC | Broad | Backend strong; email and frontend guards incomplete |
| Plant library/content | Broad | Partial integration and known interaction gaps |
| Remedies | CRUD/API present | Frontend reported static |
| Tours | CRUD/API and activity UI present | Persistence/actions reported static |
| Personal garden | API and 3D controls present | Dashboard/persistence UX partial |
| 3D garden | Extensive scene systems | Requires real asset/data verification |
| AI detection | Queue/worker/API scaffold present | Not functional in default local setup |
| Dashboards | Many pages/components present | Several pages are placeholders/static |
| Testing/release hygiene | Partial | Current checks fail |

**Overall assessment:** Feature breadth is approximately advanced prototype / partial MVP. It should not be labeled complete or production-ready until the critical security issue, backend verification failures, AI job flow, and static dashboard integrations are resolved.

## 12. Historical Work Context
`PREVIOUS_TASKS.md` records completed work across authentication, RBAC, dashboards, notifications, navbar, database seeding, 3D garden v2.1, R2 uploads, and multiple routing fixes from May-June 2026. Those records are useful context, but they conflict with the current code in several areas: stale imports/tests, placeholder dashboard pages, missing frontend route guards, and unresolved AI integration. The current source and executable checks should supersede historical completion labels.

## 13. Recommended Next Steps
1. **Revoke all exposed Cloudflare/R2 credentials immediately**, remove `cloudflare.txt` secrets, rotate related production credentials, and audit git history.
2. **Restore a clean verification baseline:** fix backend type errors, update stale test imports to current module paths, provide safe test environment setup, add a frontend test script, and make frontend lint pass.
3. **Finish AI end to end:** use a real/local worker strategy, return and poll job status, align endpoint paths and status enums, and test both success and failure states.
4. **Enforce frontend authorization per route:** add role guards to admin, super-admin, botanist contribution, and 3D garden routes; verify direct URL access.
5. **Replace static dashboard/tour/remedy/bookmark/garden screens with real hooks and mutations**, starting with user-critical flows: favorites, garden persistence, scanner history, remedies, and tour progress/actions.
6. **Complete email flows and notification contracts**, including verification/reset job enqueueing and either a per-notification read endpoint or removal of the stale client call.
7. **Validate production 3D content:** ensure each database plant has a distinct valid GLB/LOD asset, correct R2 configuration, fallback behavior, and mobile performance.
8. **Bring documentation up to date:** replace the Vite README, populate the actual PRD/task board, add an environment example without secrets, and record verified rather than claimed completion.
