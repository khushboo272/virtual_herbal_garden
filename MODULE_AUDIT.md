# Virtual Herbal Garden - Feature Module Audit
**Generated:** 2026-09-18  
**Scope:** Read-only verification against [PROJECT_REPORT.md](PROJECT_REPORT.md) and current source  
**Constraint:** No source files, names, folders, or implementations were changed. This file is the only new artifact.

## 1. Verification Summary

The project report is directionally accurate, but two details required correction during verification:

- The report names `frontend/src/app/components/dashboard/pages/BookmarksPage.tsx`; that file does not exist. `BookmarksPage` is currently exported from `SubPages.tsx`.
- The report describes the AI scanner as a partially integrated hook flow, but the routed scanner itself is more incomplete: `AIPlantDetection.tsx` simulates a fixed Tulsi answer and does not use `useDetection`.

The root [PRD.md](PRD.md) contains only a title, so requirement percentages cannot be independently calculated. Status below is based on executable checks and current source.

### 1.1 Section 8 - Testing claims

| Claim | Result | Evidence |
|---|---|---|
| Frontend production build passes | **PASS** | `npm run build --workspace=frontend` completed successfully. Build is configured in [frontend/package.json](frontend/package.json); the generated bundle also reported CSS import order and bundle-size warnings. |
| Frontend lint fails on `vite.config.js` `__dirname` | **FAIL confirmed** | [frontend/vite.config.js](frontend/vite.config.js#L10) uses `path.resolve(__dirname, './src')`; current lint reports `10:25  error  '__dirname' is not defined`. |
| Backend typecheck fails on `SYSTEM_ALERT` and unused `req` | **FAIL confirmed** | [backend/src/modules/notifications/notification.service.test.ts](backend/src/modules/notifications/notification.service.test.ts#L31) and [backend/src/modules/notifications/notification.service.test.ts](backend/src/modules/notifications/notification.service.test.ts#L40) reference the missing enum member; [backend/src/modules/plants/plant.controller.ts](backend/src/modules/plants/plant.controller.ts#L207) declares unused `req`. |
| Backend Jest suite fails because of stale imports | **FAIL confirmed** | Current Jest run fails in `backend/tests/auth.test.ts`, `plants.test.ts`, `garden.test.ts`, and `ai.test.ts` importing nonexistent `../src/models/*` and `../src/utils/*`; current implementation is under `src/modules/*` and `src/core/*`. It also reports missing environment variables in [backend/src/core/config/env.ts](backend/src/core/config/env.ts#L66-L73). |
| Frontend tests are part of standard verification | **PARTIAL** | Test files exist, but [frontend/package.json](frontend/package.json) has no `test` script; root `test` invokes only the backend workspace. |

### 1.2 Section 10 - Known issue claims

| Claim | Result | Exact evidence |
|---|---|---|
| Exposed Cloudflare/R2 credentials exist | **FAIL confirmed / critical** | [cloudflare.txt](cloudflare.txt#L1-L20) exists and contains account/API credential labels, Access Key ID, Secret Access Key, and Token value. Secret values are intentionally not reproduced here. Revoke and rotate them. |
| Local AI queue is mocked and does not process jobs | **FAIL confirmed** | [backend/src/core/jobs/queues.ts](backend/src/core/jobs/queues.ts#L6-L17) activates `MockQueue` for local/mock Redis; [backend/src/modules/ai-detection/detection.worker.ts](backend/src/modules/ai-detection/detection.worker.ts#L14-L16) sets the worker to `null` in the same mode. |
| Frontend does not poll detection status | **FAIL confirmed** | [frontend/src/hooks/useDetection.ts](frontend/src/hooks/useDetection.ts#L7-L25) uploads once and sets the returned data; it contains no call to `/ai/detect/:jobId` and no polling timer. The routed scanner is even more incomplete at [frontend/src/app/components/slides/AIPlantDetection.tsx](frontend/src/app/components/slides/AIPlantDetection.tsx#L34-L61), where analysis is simulated. |
| AI history endpoint mismatch | **FAIL confirmed** | Frontend calls `/ai/detections` at [frontend/src/hooks/useDetection.ts](frontend/src/hooks/useDetection.ts#L46); backend registers `/history` at [backend/src/modules/ai-detection/detection.routes.ts](backend/src/modules/ai-detection/detection.routes.ts#L15). |
| Detection enum mismatch | **FAIL confirmed** | Frontend declares `COMPLETED` at [frontend/src/lib/types.ts](frontend/src/lib/types.ts#L117); backend declares `COMPLETE` at [backend/src/types/index.ts](backend/src/types/index.ts#L47) and writes it in [backend/src/modules/ai-detection/detection.worker.ts](backend/src/modules/ai-detection/detection.worker.ts#L52). |
| `/garden-3d` has no frontend guard | **FAIL confirmed** | [frontend/src/App.tsx](frontend/src/App.tsx#L109) renders `VirtualGarden3DPage` directly without `RequireRole`. |
| Admin/super-admin child routes lack their own frontend role checks | **FAIL confirmed** | Dashboard parent only requires USER at [frontend/src/App.tsx](frontend/src/App.tsx#L63-L65). Admin children are unwrapped at [frontend/src/App.tsx](frontend/src/App.tsx#L85-L94); system children are unwrapped at [frontend/src/App.tsx](frontend/src/App.tsx#L97-L101). Backend guards remain present in [backend/src/modules/admin/admin.routes.ts](backend/src/modules/admin/admin.routes.ts#L12-L33). |
| Email verification/reset delivery is unfinished | **FAIL confirmed** | [backend/src/modules/auth/auth.service.ts](backend/src/modules/auth/auth.service.ts#L48) and [backend/src/modules/auth/auth.service.ts](backend/src/modules/auth/auth.service.ts#L173) contain explicit send-email TODOs. |
| Notification per-item endpoint is stale | **FAIL confirmed** | [frontend/src/hooks/useUser.ts](frontend/src/hooks/useUser.ts#L53) calls `/users/me/notifications/:notificationId`; active backend routes expose bulk read endpoints at [backend/src/modules/users/user.routes.ts](backend/src/modules/users/user.routes.ts#L20-L22). |
| R2 configuration bypasses validated env | **FAIL confirmed** | [backend/src/lib/r2Client.ts](backend/src/lib/r2Client.ts#L4-L27) reads `process.env.R2_*`; the validated schema in [backend/src/core/config/env.ts](backend/src/core/config/env.ts#L20-L30) defines AWS S3 fields but no R2 fields. |
| Frontend access token is in localStorage | **FAIL confirmed** | [frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx#L83-L90) reads `access_token` from localStorage and [frontend/src/lib/api.ts](frontend/src/lib/api.ts) owns token storage. |

### 1.3 Section 11 - Completion claims

| Area | Result | Current evidence and status |
|---|---|---|
| Core backend modules/API | **PARTIAL** | Domain routers are registered in [backend/src/routes/index.ts](backend/src/routes/index.ts#L3-L16), but typecheck and full tests fail. |
| Auth/RBAC | **PARTIAL** | Auth endpoints are broad and backend RBAC exists; email delivery TODOs remain and frontend child-route guards are incomplete. |
| Plant library/content | **PARTIAL** | Plant CRUD/read/review/upload routes exist in [backend/src/modules/plants/plant.routes.ts](backend/src/modules/plants/plant.routes.ts#L10-L34), but frontend user notes report favorite/share gaps and the 3D fallback uses mock plants. |
| Remedies | **PARTIAL/static** | Backend CRUD exists in [backend/src/modules/remedies/remedy.routes.ts](backend/src/modules/remedies/remedy.routes.ts#L10-L16); the frontend slide retains local remedy data/filtering. |
| Tours | **PARTIAL/static** | Backend CRUD exists in [backend/src/modules/tours/tour.routes.ts](backend/src/modules/tours/tour.routes.ts#L9-L16); public progress is local/static and admin management uses sample data. |
| Personal garden | **PARTIAL** | Garden API and 3D controls exist, but dashboard `MyGardenPage` only links to the 3D garden inside [frontend/src/app/components/dashboard/pages/SubPages.tsx](frontend/src/app/components/dashboard/pages/SubPages.tsx#L204-L228). |
| 3D garden | **PARTIAL/working scene** | Extensive scene systems exist, but route guard is absent and real model loading has fallback/mock behavior. |
| AI detection | **BROKEN/incomplete** | The routed UI is hard-coded/simulated; queue worker is disabled locally; API contracts disagree. |
| Dashboards | **PARTIAL/static** | Shared shell and role panels exist, but several pages are static or placeholders. |
| Testing/release hygiene | **BROKEN** | Frontend build passes, but lint, backend typecheck, and full backend tests fail. |
| Overall completion percentage | **NOT CALCULABLE** | Root [PRD.md](PRD.md) has no requirement list, so the previous approximate percentage is not independently defensible. |

## 2. Feature-to-File Map

The lists below include the current direct implementation files and the shared files that make ownership cross-feature. Backend module files are listed individually; frontend legacy page/component files are listed individually where they are feature-owned or directly rendered.

### Summary table

| Feature | Backend files | Frontend files | Shared/coupled files | Status | Report reference |
|---|---|---|---|---|---|
| Home | Plant routes/controller/service/model/validators | `App.tsx`, `HomePageWrapper.tsx`, `HomePage.tsx`, `usePlants.ts`, `features/home/index.ts` | `Layout.tsx`, `api.ts`, `types.ts`, AuthContext, plant domain | **Partial/working read path** | Report 3.1 |
| Library / Plant Detail | Plant routes/controller/service/model/validators, Category, Review | `PlantLibraryPage.tsx`, `PlantDetailPage.tsx`, `PlantLibrary.tsx`, `PlantDetail.tsx`, `PlantViewer3DModal.tsx`, `usePlants.ts`, `features/plants/index.ts` | App, Layout, api, types, AuthContext, DataStates | **Partial** | Report 3.1 |
| AI Scanner | Detection routes/controller/service/model/validators/worker; queues, Redis, env, storageService, imageProcessor | `AIPlantDetectionPage.tsx`, `AIPlantDetection.tsx`, `useDetection.ts`, `features/ai-detection/index.ts`, dashboard scanner/stat components | App, api, types, plants, storage, jobs, sockets, dashboard | **Broken/incomplete** | Report 3.9 |
| 3D Garden | Plant routes/controller/service/model; R2 client; S3 config; upload middleware; garden routes/service/model for personal state | `VirtualGarden3DPage.tsx`, `Garden3DScene.tsx`, all `components/garden/*` environment/plant/audio files, `app/components/3d/*`, `useGardenPlants.ts`, `config/assets.ts`, `features/3d-garden/index.ts` | App, api, types, socket, Plant model, Personal Garden API, auth | **Partial/working scene** | Report 3.5 |
| Personal Garden | Garden routes/controller/service/model/validators; User service; ActivityLog model | `useGardenPlants.ts`, `VirtualGarden3DPage.tsx`, `PersonalizedZone.tsx`, `MyGardenPage` in `SubPages.tsx`, dashboard/user feature barrels | Garden3DScene, Plant model, users/activity, socket, auth | **Partial/coupled** | Report 3.4 |
| Remedies | Remedy routes/controller/service/model/validators | `RemediesPageWrapper.tsx`, `RemediesPage.tsx`, `useRemedies.ts`, `features/remedies/index.ts` | Plant types/IDs, App, Layout, api, shared UI | **Partial/static frontend** | Report 3.7 |
| Virtual Tour | Tour routes/controller/service/model/validators | `VirtualTourPage.tsx`, `VirtualTour.tsx`, `app/virtualTour/{types,checkpointData,ProgressTracker,CheckpointCard,CheckpointDetail,AudioPlayer}.tsx`, `activities/{QuizActivity,ActivityWrapper}.tsx`, `TourProgressContext.tsx`, `useTourProgress.ts`, `useTours.ts`, `features/tours/index.ts` | Plant data, App, Layout, localStorage, audio, dashboard tour pages | **Partial/static** | Report 3.8 |
| Auth | Auth routes/controller/service/validators/passport/RefreshToken model; User model; auth/rbac middleware; JWT/hash/encryption/audit utils | `AuthContext.tsx`, `RequireRole.tsx`, `OAuthCallbackPage.tsx`, `Layout.tsx`, `main.tsx`, `api.ts`, `socket.ts`, navbar variants, `features/auth/index.ts` | App, every protected page, notifications, socket, user role types | **Partial** | Report 3.2 and 5 |
| Dashboard - USER | Users routes/controller/service/validators/User model; Garden; Detection; Bookmark; Notification; ActivityLog | `DashboardLayout.tsx`, `DashboardSidebar.tsx`, `DashboardHome.tsx`, `UserDashboard.tsx`, `SubPages.tsx` user exports, `useDashboard.ts`, `useUser.ts`, `useGardenPlants.ts`, `useDetection.ts` | AuthContext, RequireRole, App, api, shared dashboard UI, socket | **Partial/static** | Report 3.10 |
| Dashboard - BOTANIST | Plant and Remedy routes/controller/service/model/validators; Detection feedback; admin/shared notifications | `BotanistPanel.tsx`, `BotanistDashboardPage.tsx`, `useBotanist.ts`, `features/botanist/index.ts`, App contribution routes | Dashboard shell, AuthContext, Plant/Remedy domains, upload modal, api | **Partial; contribution child routes are dashboard shells** | Report 3.6 |
| Dashboard - ADMIN | Admin routes/controller/service/validators; User, Plant, Remedy, Detection, Review, Tour, AuditLog, Notification, SystemConfig models | `AdminDashboardOverview.tsx`, `AdminPanel.tsx`, `UserManagementPage.tsx`, `ModerationQueuePage.tsx`, `AnalyticsOverviewPage.tsx`, `ManagePlantsPage.tsx`, `ToursManagementPage.tsx`, `SubPages.tsx`, `useAdmin.ts`, `useDashboard.ts`, `features/admin-panel/index.ts` | Every content model, Dashboard shell, App, AuthContext, api, notifications | **Partial; backend broad, UI mixed** | Report 3.10 |
| Admin / System - SUPER_ADMIN | Admin routes/controller/service/validators; AuditLog and SystemConfig models | `SystemPages.tsx`, `useAdmin.ts`, `features/admin-panel/index.ts`, App system routes | Admin service aggregates nearly all domains; dashboard shell, AuthContext, api | **Partial/static** | Report 3.10 |
| Notifications | Notification model/service/controller/test; ActivityLog model; User/admin routes/controllers; Socket index/events/changeStreams; email service/worker | `NotificationPanel.tsx`, `useNotifications.ts`, duplicate notification hook in `useUser.ts`, AuthContext, socket client, navbar variants | User, admin, activity, socket, email, dashboard shell | **Partial/contract split** | Report 3.10 |

### 2.1 Backend file inventory by domain

**Plants / library / 3D placement / reviews:**
- `backend/src/modules/plants/plant.routes.ts`
- `backend/src/modules/plants/plant.controller.ts`
- `backend/src/modules/plants/plant.service.ts`
- `backend/src/modules/plants/plant.validators.ts`
- `backend/src/modules/plants/Plant.model.ts`
- `backend/src/modules/plants/Category.model.ts`
- `backend/src/modules/plants/Review.model.ts`
- `backend/src/core/middleware/upload.ts`
- `backend/src/lib/r2Client.ts`
- `backend/src/core/config/s3.ts`
- `backend/src/core/utils/storageService.ts`

**AI:**
- `backend/src/modules/ai-detection/detection.routes.ts`
- `backend/src/modules/ai-detection/detection.controller.ts`
- `backend/src/modules/ai-detection/detection.service.ts`
- `backend/src/modules/ai-detection/detection.validators.ts`
- `backend/src/modules/ai-detection/Detection.model.ts`
- `backend/src/modules/ai-detection/detection.worker.ts`
- `backend/src/core/jobs/queues.ts`
- `backend/src/core/config/redis.ts`
- `backend/src/core/config/env.ts`
- `backend/src/core/utils/imageProcessor.ts`
- `backend/src/core/utils/storageService.ts`
- `backend/src/core/socket/index.ts`
- `backend/src/core/socket/events.ts`

**Personal garden:**
- `backend/src/modules/garden/garden.routes.ts`
- `backend/src/modules/garden/garden.controller.ts`
- `backend/src/modules/garden/garden.service.ts`
- `backend/src/modules/garden/garden.validators.ts`
- `backend/src/modules/garden/Garden.model.ts`
- `backend/src/modules/users/user.service.ts`
- `backend/src/modules/notifications/ActivityLog.model.ts`

**Remedies:**
- `backend/src/modules/remedies/remedy.routes.ts`
- `backend/src/modules/remedies/remedy.controller.ts`
- `backend/src/modules/remedies/remedy.service.ts`
- `backend/src/modules/remedies/remedy.validators.ts`
- `backend/src/modules/remedies/Remedy.model.ts`

**Tours:**
- `backend/src/modules/tours/tour.routes.ts`
- `backend/src/modules/tours/tour.controller.ts`
- `backend/src/modules/tours/tour.service.ts`
- `backend/src/modules/tours/tour.validators.ts`
- `backend/src/modules/tours/Tour.model.ts`

**Auth and identity:**
- `backend/src/modules/auth/auth.routes.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.validators.ts`
- `backend/src/modules/auth/passport.strategy.ts`
- `backend/src/modules/auth/RefreshToken.model.ts`
- `backend/src/modules/users/User.model.ts`
- `backend/src/core/middleware/auth.ts`
- `backend/src/core/middleware/rbac.ts`
- `backend/src/core/utils/jwt.ts`
- `backend/src/core/utils/hash.ts`
- `backend/src/core/utils/encryption.ts`
- `backend/src/core/utils/auditLogger.ts`

**Users / bookmarks / activity:**
- `backend/src/modules/users/user.routes.ts`
- `backend/src/modules/users/user.controller.ts`
- `backend/src/modules/users/user.service.ts`
- `backend/src/modules/users/user.validators.ts`
- `backend/src/modules/users/User.model.ts`
- `backend/src/modules/users/Bookmark.model.ts`
- `backend/src/modules/notifications/ActivityLog.model.ts`

**Admin/system:**
- `backend/src/modules/admin/admin.routes.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/admin/admin.validators.ts`
- `backend/src/modules/admin/AuditLog.model.ts`
- `backend/src/modules/admin/SystemConfig.model.ts`
- Plus cross-domain models imported by `admin.service.ts`: User, Plant, Remedy, Detection, Review, Tour, AuditLog, Notification, SystemConfig.

**Notifications/realtime/email:**
- `backend/src/modules/notifications/Notification.model.ts`
- `backend/src/modules/notifications/notification.service.ts`
- `backend/src/modules/notifications/notification.controller.ts`
- `backend/src/modules/notifications/notification.service.test.ts`
- `backend/src/modules/notifications/ActivityLog.model.ts`
- `backend/src/modules/notifications/email.service.ts`
- `backend/src/modules/notifications/email.worker.ts`
- `backend/src/modules/users/user.routes.ts`
- `backend/src/modules/users/user.controller.ts`
- `backend/src/modules/admin/admin.routes.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/core/socket/index.ts`
- `backend/src/core/socket/events.ts`
- `backend/src/core/socket/changeStreams.ts`

## 3. Coupling Issues Blocking Clean Modularization

1. **`frontend/src/App.tsx` is the global route composition hotspot.** It owns home, library, AI, remedies, tour, dashboard, OAuth, aliases, and 3D routing. Feature routes cannot be moved independently without splitting route registries.
2. **Frontend feature folders are façades, not owning modules.** `features/*/index.ts` files export components from `app/pages`, `app/components/slides`, and root `hooks`, so the requested self-contained structure is not currently true.
3. **`frontend/src/app/components/dashboard/pages/SubPages.tsx` is a mixed-domain container.** It contains AI stats, user growth, featured content, create tour, tour analytics, bookmarks, My Garden, and scanner pages in one file.
4. **`frontend/src/hooks/useUser.ts` owns unrelated concerns.** It contains bookmarks, notifications, and profile statistics; it also contains the invalid per-notification API call. `useNotifications.ts` separately owns notifications, creating duplicate contracts.
5. **`frontend/src/hooks/usePlants.ts` crosses content and 3D/testing boundaries.** Home/library/detail use plant data, while 3D fallback/mock plants are also supplied from this hook.
6. **Plant backend owns too many boundaries.** `plant.routes.ts` combines public catalog reads, reviews, publishing/featuring, image upload, GLB/LOD upload/deletion, and public garden placement.
7. **Personal garden and public garden placement are different concepts but are mixed in the frontend.** `Plant.globalPosition3D`/visibility is public placement; `Garden` entries are user-owned plants. The 3D page currently uses plant placement APIs while the personal-garden API is separate.
8. **`backend/src/modules/users/user.service.ts` is an identity aggregation point.** It touches user profile, garden, detection, reviews, bookmarks, activity, and statistics/account deletion.
9. **`backend/src/modules/admin/admin.service.ts` is the largest backend coupling point.** It directly aggregates users, plants, remedies, detections, reviews, tours, notifications, audit logs, and system config.
10. **Notifications are not a single bounded context.** Models/services are under `notifications`, active user routes are under `users`, broadcasts are under `admin`, realtime delivery is under `core/socket`, and activity logs are stored under `notifications`.
11. **Tour content has two sources of truth.** Backend `Tour` CRUD exists, but public UI uses static checkpoint data and `TourProgressContext` local storage rather than the Tour API.
12. **AI has two frontend implementations.** The routed `AIPlantDetection.tsx` simulates a fixed result; `useDetection.ts` contains a separate upload hook with endpoint and status mismatches and is not the routed scanner’s source of truth.
13. **Shared infrastructure is imported as feature logic.** `api.ts`, `types.ts`, `AuthContext.tsx`, socket code, upload middleware, storage, rate limiting, and environment config are necessary shared infrastructure, but several feature hooks/components directly own infrastructure details instead of using feature adapters.
14. **Dashboard routes are composition-coupled to role policy.** The dashboard parent checks only USER, while admin, system, and botanist child paths rely on navigation convention rather than individual frontend guards.
15. **Backend tests encode a pre-module filesystem layout.** Tests refer to `src/models` and `src/utils`, while implementations were moved under domain modules and `core`, preventing reliable verification.
16. **Configuration is split.** Validated `env.ts` handles AWS variables while R2 code reads unvalidated `process.env.R2_*`; local fallback behavior is hidden in Redis/database infrastructure.
17. **Socket events cross feature boundaries.** Plant updates, detection updates, notifications, admin rooms, and change streams share `core/socket` and the frontend socket client.

## 4. Proposed Module Boundaries

These are target boundaries only. No moves or splits were performed.

### Home
```text
frontend/src/features/home/{pages,components,hooks,api,index.ts}
backend/src/modules/home/{routes,controller,service,validators}
```
Home should own the home query/view adapter. Plant catalog remains the source domain for plant records. Move/split `HomePageWrapper.tsx` and `HomePage.tsx`; keep only shared layout/navigation in `app`.

### Library / Plant Detail / Catalog
```text
frontend/src/features/plants/{pages,components,hooks,api,index.ts}
backend/src/modules/catalog/plants/{routes,controller,service,model,validators}
backend/src/modules/catalog/reviews/{routes,controller,service,model,validators}
backend/src/modules/catalog/categories/{model,service}
```
Move `PlantLibraryPage.tsx`, `PlantDetailPage.tsx`, `PlantLibrary.tsx`, `PlantDetail.tsx`, and plant-specific hooks/API adapters. Split `plant.routes.ts`, `plant.controller.ts`, `plant.service.ts`, and `plant.validators.ts` so reviews and 3D asset management leave the catalog boundary.

### AI Scanner
```text
frontend/src/features/ai-scanner/{pages,components,hooks,api,types,index.ts}
backend/src/modules/ai-scanner/{routes,controller,service,model,validators,worker}
```
Move/split `AIPlantDetectionPage.tsx`, `AIPlantDetection.tsx`, `useDetection.ts`, detection types/API calls, `detection.*`, and `detection.worker.ts`. Keep BullMQ/Redis as infrastructure adapters, not scanner business logic. Remove scanner pages from `SubPages.tsx`.

### 3D Garden
```text
frontend/src/features/3d-garden/{pages,scene,components,hooks,api,types,index.ts}
backend/src/modules/garden/public-placement/{routes,controller,service,validators}
backend/src/modules/assets/{service,storage-adapter}
```
Move `Garden3DScene.tsx`, `components/garden/*`, `app/components/3d/*`, `VirtualGarden3DPage.tsx`, `config/assets.ts`, and 3D hooks. Split GLB/LOD upload and public placement out of `plants/*` into a 3D/assets boundary. Keep generic renderer/UI primitives shared only where they have no plant-domain knowledge.

### Personal Garden
```text
frontend/src/features/personal-garden/{pages,components,hooks,api,types,index.ts}
backend/src/modules/garden/personal/{routes,controller,service,model,validators}
```
Move `useGardenPlants.ts`, personal garden parts of `VirtualGarden3DPage.tsx`, `PersonalizedZone.tsx`, and the dashboard My Garden page. Keep public plant catalog references as an API contract rather than importing plant service logic.

### Remedies
```text
frontend/src/features/remedies/{pages,components,hooks,api,types,index.ts}
backend/src/modules/content/remedies/{routes,controller,service,model,validators}
```
Move `RemediesPageWrapper.tsx`, `RemediesPage.tsx`, and `useRemedies.ts`. Split static/local remedy arrays from API DTO mapping. Keep plant references as IDs/DTOs.

### Virtual Tour
```text
frontend/src/features/tours/{pages,components,hooks,api,types,index.ts}
backend/src/modules/content/tours/{routes,controller,service,model,validators}
```
Move `VirtualTourPage.tsx`, `VirtualTour.tsx`, `app/virtualTour/*`, tour activities, `useTours.ts`, `useTourProgress.ts`, and `TourProgressContext.tsx`. Replace local-storage-only progress with a tour-owned persistence adapter. Remove tour admin pages from `SubPages.tsx`.

### Auth and Identity
```text
frontend/src/features/auth/{pages,components,hooks,api,types,index.ts}
backend/src/modules/identity/auth/{routes,controller,service,model,validators}
backend/src/modules/identity/users/{routes,controller,service,model,validators}
```
Move auth-specific parts of `Layout.tsx`, `OAuthCallbackPage.tsx`, `AuthContext.tsx`, `RequireRole.tsx`, and auth navbar behavior. Split `user.service.ts` into profile, account, bookmark, and user analytics services. Keep the API client, token transport, and socket lifecycle as shared infrastructure or explicit adapters.

### Dashboard by role
```text
frontend/src/features/dashboard/{shared,user,botanist,admin,system}/{pages,components,hooks,api,index.ts}
backend/src/modules/dashboard/{routes,controller,service,validators}
```
Move `DashboardLayout.tsx`, `DashboardSidebar.tsx`, role navigation, common dashboard UI, and role pages under this boundary. Split `SubPages.tsx` into user/admin files. Split `AdminPanel.tsx` and `admin.service.ts` into dashboard analytics, moderation, user administration, content administration, notifications broadcast, and system configuration. Role checks should be route-local policy components.

### Admin / System
```text
frontend/src/features/admin/{pages,components,hooks,api,index.ts}
frontend/src/features/system/{pages,components,hooks,api,index.ts}
backend/src/modules/platform/admin/{routes,controller,service,validators}
backend/src/modules/platform/system-config/{routes,controller,service,model,validators}
backend/src/modules/platform/audit/{routes,controller,service,model,validators}
```
Move/split `SystemPages.tsx`, admin pages, `useAdmin.ts`, `AuditLog.model.ts`, `SystemConfig.model.ts`, and the relevant admin controller/service methods. System health/config/audit should not be static UI or hidden inside a general admin service.

### Notifications and Activity
```text
frontend/src/features/notifications/{components,hooks,api,types,index.ts}
backend/src/modules/platform/notifications/{routes,controller,service,model,validators}
backend/src/modules/platform/activity/{model,service}
backend/src/modules/platform/realtime/{socket-adapter,events}
```
Choose one canonical notification API. Consolidate the duplicate hooks from `useUser.ts` and `useNotifications.ts`; move `ActivityLog.model.ts` to activity; split email delivery from in-app notification creation. Keep Socket.IO under a shared realtime adapter that publishes domain events without owning domain persistence.

### Shared infrastructure that should remain outside features
```text
frontend/src/core/{api,auth-transport,realtime,types,ui}
backend/src/core/{config,middleware,utils,jobs,socket}
backend/src/lib/{storage}
```
`frontend/src/lib/api.ts`, `frontend/src/lib/socket.ts`, shared types, common UI primitives, backend middleware, configuration, logging, encryption, rate limiting, queues, and storage should remain shared only when they contain no feature-specific business behavior.

## 5. Final Assessment

The project has recognizable backend modules, but the target end-state of one self-contained module per feature has not been reached. Backend concerns are mostly separated by domain folders but still aggregate heavily in plants, users, admin, and notifications. Frontend concerns are substantially more scattered: feature barrels point into `app`, `components`, and root hooks, while a single dashboard file contains several unrelated page domains. The highest-risk functional areas are AI detection, static dashboard/tour/remedy flows, authorization at nested routes, and verification hygiene. The highest-risk modularization blockers are `App.tsx`, `SubPages.tsx`, `useUser.ts`, `plant.*`, `user.service.ts`, `admin.service.ts`, and the split notification/socket architecture.
