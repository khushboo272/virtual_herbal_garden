# Known Bugs — Virtual Herbal Garden

## BUG-001 Library search does not work
**Status:** FIXED (Task 2 + Task 4)
**Description:** Typing a search query in the library search bar does not filter the plant list — searching "tulsi" still shows all plants unchanged. The "Search in Library" link from the AI Scanner opens the library URL with `?q=` set, but the search box is not connected to any API call — it is a purely decorative `<Input>` with no `onChange` or state binding inside `PlantLibrary.tsx`. The `PlantLibraryPage` reads `?q=` from the URL and sets local state, but that state is never passed back to the `PlantLibrary` component. End-to-end: the URL parameter reaches the backend (via `usePlants`), but the sidebar search box is disconnected.
**Fixed in:** Task 2 added server-side full-text search with aliases; Task 4 wired the URL-driven search state to the component and debounced input.

---

## BUG-002 Plant images are broken (alt text only) on library cards and detail page
**Status:** FIXED (Task 3 + Task 4 + Task 5)
**Description:** Plant cards and the detail page show alt-text boxes instead of images. Root cause: the seeded plants in the database have empty `images: []` arrays. When `images[0].url` is `""`, the `<img src="">` silently fails and the browser shows the alt text box. No fallback/placeholder was implemented.
**Fixed in:** Task 3 created a `<PlantImage>` component with lazy loading and a leaf-icon SVG placeholder that shows whenever `src` is empty or fails to load. Task 4 uses `<PlantImage>` on every card. Task 5 uses it on the detail page.

---

## BUG-003 Favorite and share buttons on the plant detail page do nothing
**Status:** FIXED (Task 5)
**Description:** The Heart (favorite) and Share2 buttons in `PlantDetail.tsx` have no `onClick` handlers — they render but fire no action. The share button has no clipboard or Web Share API call. The favorite button has no bookmarks API integration.
**Fixed in:** Task 5 added `useFavorite` hook with optimistic UI toggle using the bookmarks API (`POST /users/me/bookmarks` / `DELETE /users/me/bookmarks/:id`), and a `useShare` helper that uses `navigator.share` when available and falls back to `navigator.clipboard.writeText` with a toast notification.

---

## BUG-004 AI Scanner "Recent Scans" loses images and shows "Unknown" entries
**Status:** FIXED (R2 Storage & Uploads Task 5)
**Description:** In AI Scanner, "Recent Scans" lost images when cloud storage was unconfigured or failed, and history included incomplete/pending/failed scans with missing details.
**Fix:** In `detection.service.ts`, when R2/S3 upload fails or credentials are unset, automatically generates a 256px JPEG base64 data URL thumbnail onto the `Detection` record (`imageUrl: dataUrl`, `imageThumbnailUrl: dataUrl`) and continues Gemini analysis without throwing or losing the scan. `getHistory()` filters strictly for `status: COMPLETE` so failed or incomplete scans never clutter the user's scan history.

---

## BUG-005 Home page badge says "Explore 200+ Medicinal Plants" but the database has ~10
**Status:** FIXED (Home module rebuild)
**Description:** The hero badge on the home page displays "Explore 200+ Medicinal Plants", but the actual plant count in the database is approximately 10–15. This was hardcoded copy in the Home component.
**Fix:** Home module now fetches stats.plants dynamically from /api/v1/home and renders the real count in the badge.

---

## BUG-006 Home hero search does nothing
**Status:** FIXED (Home module rebuild)
**Description:** The search bar in the hero section was a decorative <Input> with no onChange, no state binding, and no navigation. Pressing Search or Enter had no effect.
**Fix:** Hero search is now a real debounced autocomplete bar; Enter navigates to /library?q=...&open=1; selecting a suggestion goes to /plant/:slug.

---

## BUG-007 Browse by Category cards use fake counts and no filter
**Status:** FIXED (Home module rebuild)
**Description:** Category cards in the Home page hard-coded counts (24/18/32/15) and linked to /library with no filter applied. No data came from the database.
**Fix:** Home API endpoint returns real per-category plant counts using keyword matching against medicinalUses/tags. Cards now link to /library?health=<slug>.

---

## BUG-008 Featured plants show broken images; data source is unclear
**Status:** FIXED (Home module rebuild)
**Description:** Featured plant images showed alt-text boxes. HomePageWrapper used useFeaturedPlants (from usePlants.ts hook) which called GET /plants/featured. Plant detail links used plant.id (ObjectId) instead of slug.
**Fix:** Home API returns featured plants from the database using PlantImage component. Detail links use slug. PlantImage component provides leaf-icon fallback so images never appear broken.

---

## BUG-009 Remedies page is a static template
**Status:** FIXED (Remedies module rebuild)
**Description:** Remedies page was a static template with hard-coded plants, stock photos from Unsplash, fake "% Effective" values (92%, 88%, etc.), and fake dosages. It did not connect to the database.
**Fix:** Completely rebuilt the Remedies module into a database-driven feature (`/api/v1/remedies`, `RemediesPage`, `RemedyDetailPage`) with server-side search, health category facets, difficulty/usage filters, and ingredient plant matching. All fake efficacy percentages and invented dosages were eliminated and replaced with traditional educational disclaimers.

---

## BUG-010 /remedies/:slug renders a blank white page
**Status:** FIXED (Remedies module rebuild)
**Description:** Clicking any remedy card on the Home page routed to /remedies/:slug, which rendered completely blank because no route existed in App.tsx and there was no 404 catch-all route.
**Fix:** Added `/remedies/:slug` route rendering `RemedyDetailPage` in App.tsx, with full loading/error/not-found states, plant resolution, interactive steps checklist, and print view. Added catch-all `*` route rendering `NotFoundPage` across the app.

---

## BUG-011 Home tour cards link to /virtual-tour/:slug which has no route
**Status:** FIXED (Virtual Tour module rebuild)
**Description:** Guided tour cards on the Home page link to /virtual-tour/:slug, which had no route defined in App.tsx.
**Fix:** Connected `/virtual-tour/:slug` route in `App.tsx` to `TourOverviewPage`, rendering dynamic checkpoints timeline, plant and remedy integration, educational disclaimer, and progress controls. Also updated `HomePage.tsx` so cards resolve to `/virtual-tour/:slug` safely and "All Tours" leads to `/virtual-tour`.

---

## BUG-012 /virtual-tour is static
**Status:** FIXED (Virtual Tour module rebuild)
**Description:** /virtual-tour is static with one hard-coded 6-checkpoint tour; the Tour API and the 3 DB tours (Your Kitchen Pharmacy, Stress Relief & Adaptogens, Ayurvedic Immunity Garden) are ignored.
**Fix:** Replaced hard-coded static tour with a database-driven `ToursHubPage` supporting multi-faceted filtering (health categories, levels, plant slugs, keyword search, sorting), "Continue where you left off" resumption, dynamic TourCards, skeletons, empty states, and retry states. Deleted obsolete static checkpoint data.

---

## BUG-013 Tour progress exists only in localStorage
**Status:** FIXED (Virtual Tour module rebuild)
**Description:** Tour progress exists only in localStorage (lost across devices/users); "Continue Tour" is not backed by real authenticated progress.
**Fix:** Introduced MongoDB `TourProgress` model with compound index `(userId, tourId)` and endpoints for `/tours/me/progress`, `/tours/:slug/progress`, `/tours/:slug/checkpoints/:key/complete`, `/tours/:slug/checkpoints/:key/quiz`, `/tours/:slug/progress/sync`, `/tours/:slug/rating`, and `/tours/:slug/progress` (DELETE restart). Server-side quiz scoring guarantees answers never leak to clients. Guests use local storage and automatically sync to their profile on sign-in or tour access.

---

## BUG-014 Admin tour management / create-tour / tour analytics pages use sample or stub data
**Status:** FIXED (Virtual Tour module rebuild)
**Description:** Admin tour management, create-tour, and tour analytics pages use sample or stub data, so admins cannot add or manage tours.
**Fix:** Replaced static sample data and stubs with fully-functional `AdminToursListPage`, `AdminTourEditorPage`, and `AdminTourAnalyticsPage` protected under `RequireRole minimumRole="ADMIN"`. Admins can manage draft/published tours, re-order checkpoints with accessible up/down controls, configure quizzes with passing thresholds, preview drafts, and inspect funnel drop-off analytics.

---

## BUG-015 Browser tab title leaks from the previous page
**Status:** FIXED (Virtual Tour module rebuild)
**Description:** Browser tab title leaks from the previous page ("Traditional Herbal Remedies | ..." shown on /virtual-tour) due to unmanaged document.title without unmount cleanup.
**Fix:** Created shared `useDocumentTitle` hook (`frontend/src/hooks/useDocumentTitle.ts`) that saves the previous document title and restores it upon component unmount. Applied across all tour pages and remedies pages (`RemediesPage`, `RemedyDetailPage`).

---

## BUG-016 Tour detail pages show "0 checkpoints" and an empty timeline for every DB tour
**Status:** FIXED (Tours Fix Part A)
**Description:** Tour detail pages (/virtual-tour/:slug) showed "0 checkpoints" and an empty timeline for every database tour. Root cause: legacy documents in MongoDB stored checkpoints under the legacy field name `stops` instead of `checkpoints`, with unmapped difficulty fields.
**Fix:** Added backward-compatible runtime document normalization in `backend/src/modules/tours/tour.service.ts` (`normalizeTourDoc()`) which automatically maps legacy `stops` arrays to `checkpoints` and `difficulty` to `level`, sanitizes server-scored quizzes, backfilled legacy database records via `backfillTours.ts`, and seeded complete 4–6 checkpoint tours.

---

## BUG-017 Only 3 tours exist; the planned extra tour paths are missing
**Status:** FIXED (Tours Fix Part A)
**Description:** Only 3 legacy tours existed in the database; the 4 planned additional tour paths (Virtual Herbal Garden Tour, Skin & Wound Healing Trail, Digestive Health Trail, Respiratory Relief Walk) were missing.
**Fix:** Created and executed `seedTours.ts` providing 7 fully-featured tours (25+ rich checkpoints), each with complete plant associations, educational instructions, traditional safety precautions, and server-scored quizzes.

---

## BUG-018 Tour header shows an empty level pill; a tour with no checkpoints still shows "Start Tour" and an empty timeline with no explanation
**Status:** FIXED (Tours Fix Part A)
**Description:** Tour header showed an empty level pill when level was unmapped. A tour with no checkpoints still showed "Start Tour" and an empty timeline without explaining that the tour was still being authored.
**Fix:** Updated `frontend/src/features/tours/pages/TourOverviewPage.tsx` to handle level fallbacks cleanly (`tour.level || tour.difficulty || 'All Levels'`), added a prominent "This tour is being prepared" informational state when checkpoints count is 0, and concealed the "Start Tour" button and timeline until content is published. Ensured public listings only show published tours with $\ge 1$ checkpoint.

---

## BUG-019 Tour/remedy/plant cover images are plain placeholders and there is no upload flow
**Status:** FIXED (R2 Storage & Uploads Part B)
**Description:** Tour, remedy, and plant cover images were plain placeholders with no direct upload flow or dynamic category styling.
**Fix:** Added authenticated, role-protected upload endpoints (`POST /api/v1/tours/:id/cover`, `DELETE /api/v1/tours/:id/cover`, `POST /api/v1/tours/:id/checkpoints/:key/image`, `POST /api/v1/remedies/:id/image`, `DELETE /api/v1/remedies/:id/image`) with Sharp image processing (WebP conversion, thumbnails, optimal sizing). Built reusable `ImageUploader` component with drag-and-drop in Admin Tour Editor. Created `ThemedImage` component in frontend offering vibrant category-gradient SVG fallbacks when remote images are absent.

---

## BUG-020 R2 object keys are not organized per module
**Status:** FIXED (R2 Storage & Uploads Part B)
**Description:** Cloudflare R2 object keys were not organized in predictable per-module directories.
**Fix:** Implemented domain-partitioned key hierarchy in `backend/src/core/storage/assetKeys.ts` with dedicated key builders (`plants/`, `remedies/`, `tours/`, `scans/`, `users/`, `_system/`). Enforced lowercase hyphenated slug sanitization, path traversal blocking, zero-padded numbering, and proper HTTP Cache-Control header tagging (`immutable` for numbered items, 1h for mutable assets).

---

## BUG-021 Botanist contribution routes all render the same placeholder console
**Status:** FIXED (Botanist Dashboard & Contributions)
**Description:** Botanist contribution routes (`/dashboard/contributions*`, `/dashboard/ai-feedback`) all render the same static placeholder console with mock numbers and no real backend interaction.
**Fix:** Created full Botanist feature under `frontend/src/features/botanist/` and backend module `backend/src/modules/contributions/`. Built dedicated pages for `BotanistDashboardHome`, `MyContributionsPage` (with real status tabs, search, metrics, and pagination), `PlantEditorPage`, `RemedyEditorPage`, `SubmissionDetailsPage`, and `AIFeedbackQueuePage`. Wired all metric counters and contribution tables to real database endpoints.

---

## BUG-022 "New Remedy Draft" shows the plant form
**Status:** FIXED (Botanist Dashboard & Contributions)
**Description:** Clicking "New Remedy Draft" in the dashboard opens the plant creation form instead of a dedicated remedy editor.
**Fix:** Created a dedicated `RemedyEditorPage` (`/dashboard/contributions/new-remedy` and `/dashboard/contributions/remedy/:id`) with ailment tags, preparation time, difficulty, structured step-by-step preparation builder, ingredients with live plant autocomplete and dosage notes, traditional safety precautions, academic references, and medicinal safety compliance checks.

---

## BUG-023 AI Feedback Queue is a placeholder
**Status:** FIXED (Botanist Dashboard & Contributions)
**Description:** The AI Feedback Queue renders mock static detections and is not connected to real scans, has no filter functionality, and cannot submit verification feedback.
**Fix:** Implemented backend endpoints `GET /ai/feedback-queue` (anonymized scans without user identifiers), `POST /ai/detect/:id/feedback` (single verdict per botanist with update support), and `GET /ai/feedback-stats`. Built frontend `AIFeedbackQueuePage` (`/dashboard/ai-feedback`) supporting filter tabs (All, Pending Review, Reviewed by Me), verdict submission (Correct, Incorrect with plant picker, Not a plant, Unsure), review comments, and real-time community accuracy counters.

---

## BUG-024 Bookmarks, My Garden, Help & Contact are static
**Status:** FIXED (Botanist Dashboard & Contributions)
**Description:** The shared dashboard pages for Bookmarks, My Garden, and Help & Support are static placeholders not connected to user database records or APIs.
**Fix:** Built `frontend/src/features/dashboard/shared/` containing real implementations:
- `BookmarksPage` (`/dashboard/bookmarks`): Tabbed plant/remedy/tour views, pagination, detail navigation, undoable deletion toasts via Sonner, and fallback imagery.
- `MyGardenPage` (`/dashboard/garden`): Real plot list with auto-positioning, inline notes editing, growth stage selector (Seedling, Vegetative, Flowering, Mature, Harvested), 3D garden launch button, and deletion confirmation modal.
- `SettingsProfilePage` (`/dashboard/profile`): Display name and bio editing, R2 avatar upload preview (`users/<userId>/avatar.webp`), Google OAuth detection, password change modal, sign-out from all sessions, and account deletion safeguard.
- `HelpSupportPage` (`/dashboard/help`): Role-aware FAQ accordion (with contributor guidelines for Botanists), rate-limited support ticket submission (3 requests/hour), and ticket history list.

---

## BUG-025 Dashboard header search does nothing
**Status:** FIXED (Botanist Dashboard & Contributions)
**Description:** The search input in the dashboard top header is purely decorative with no event listeners, autocomplete dropdown, or navigation.
**Fix:** Built `HeaderSearchDropdown` component integrated into `DashboardLayout`. Features debounced querying of `GET /contributions/search` (or public library/remedy endpoints), grouped visual results for Plants and Remedies, full keyboard navigation (Arrow Up/Down, Enter to select, Escape to dismiss), outside click handling, and quick navigation to detail pages.

---

## BUG-026 Browser tab title is stale on dashboard pages
**Status:** FIXED (Botanist Dashboard & Contributions)
**Description:** Dashboard pages do not set specific browser tab titles or clean up upon unmount, causing stale titles across page navigations.
**Fix:** Connected `useDocumentTitle` hook to all Botanist and Shared Dashboard pages (`Botanist Dashboard | ...`, `My Contributions | ...`, `Edit Plant | ...`, `Edit Remedy | ...`, `Submission Details | ...`, `AI Feedback Queue | ...`, `Bookmarks | ...`, `My Garden | ...`, `Settings & Profile | ...`, `Help & Support | ...`) with automatic unmount restoration.

---

## BUG-027 "Contribute" navbar link goes to the generic dashboard and contribution routes have no per-route role guard
**Status:** FIXED (Botanist Dashboard & Contributions)
**Description:** The "Contribute" navbar link directs to the generic `/dashboard` and contribution sub-routes lack per-route role authorization guards, allowing unauthorized roles or causing disorientation.
**Fix:** Updated `NavbarExpert.tsx` so "Contribute" routes directly to `/dashboard/contributions`. Protected all botanist contribution and AI feedback routes in `App.tsx` using `<RequireRole minimumRole="BOTANIST">`, which gracefully redirects unauthorized users to `/` and fires an informative toast error.

---

## BUG-028 Plant form lacks fields the library needs and there is no review workflow
**Status:** FIXED (Botanist Dashboard & Contributions)
**Description:** The contribution plant form lacks key fields needed by the library (gallery images, cultivation requirements, safety precautions, sources/references, aliases) and there is no structured submission/review/changes-requested workflow.
**Fix:** Extended `Plant` and `Remedy` schemas with `status`, `owner`, `submittedAt`, `reviewNotes`, and `references`. Built `PlantEditorPage` with full scientific taxonomy, health benefits, cultivation parameters, safety precautions, gallery uploads, and mandatory citation validation. Implemented complete 5-state lifecycle (`DRAFT` -> `PENDING_REVIEW` -> `PUBLISHED` or `CHANGES_REQUESTED` or `REJECTED`) with live completeness checklist ("Ready for review: X/Y"), medicinal safety keyword scanning, autosave debounce with localStorage recovery, and Admin review/changes-requested endpoints.

---

## BUG-029 Admin top navbar lacks AI Scanner, Remedies and Virtual Tour
**Status:** FIXED (Admin Dashboard Part A)
**Description:** The navigation bar for ADMIN and SUPER_ADMIN roles lacks direct links to AI Scanner, Remedies, and Virtual Tour, inconsistent with the public and regular user navigation.
**Fix:** Updated `NavbarAdmin.tsx` to render the shared public explorer links (Home, Library, AI Scanner, 3D Garden, Remedies, Virtual Tour) alongside Dashboard and user avatar controls, providing seamless parity across all authenticated roles.

---

## BUG-030 Browser tab titles are stale on admin pages and User Growth breadcrumb reads "Analytics > User Management"
**Status:** FIXED (Admin Dashboard Part A)
**Description:** Browser tab document titles are stale or incorrect across admin routes (e.g. showing "AI Feedback Queue..." or "Create New Tour..."), and the User Growth page breadcrumb incorrectly maps to "Analytics > User Management".
**Fix:** Built a central dashboard routing authority (`frontend/src/features/dashboard/dashboard.routes.ts`) providing unambiguous paths, labels, parents, and document titles. Implemented `useDocumentTitle` synchronization in `DashboardLayout.tsx` and updated User Growth breadcrumbs to correctly map to "Analytics > User Growth".

---

## BUG-031 "Active Today" / "Daily Active Users" always show 0 although users are logged in
**Status:** FIXED (Admin Dashboard Part A)
**Description:** The admin dashboard overview and analytics cards show 0 for Active Today / Daily Active Users because user activity timestamps (`lastActiveAt`) are not actively maintained or tracked on authenticated requests.
**Fix:** Added throttled `lastActiveAt` activity tracking in `auth.ts` middleware (max once per 5 minutes per user using Redis/in-memory cache) and implemented real `activeToday` calculations across `adminUsers.service.ts` and `admin.service.ts` dashboard summary.

---

## BUG-032 Moderation Queue has a Tours tab with no source of pending tours and no real review UI
**Status:** FIXED (Admin Dashboard Part A)
**Description:** Moderation queue includes a "Tours" tab despite tours having no submission or pending-review lifecycle, and the queue lacks comprehensive preview, content safety, duplicate checking, and review decision UI.
**Fix:** Removed Tours from the moderation queue and sidebar badges. Built config-driven tabs (Plants, Remedies, Applications) in `ModerationQueuePage.tsx` and a full-featured `ModerationReviewPage.tsx` with duplicate candidate lookups, safety finding analysis, 3D model status, source checklists, review timelines, and approve/reject/request-changes actions with owner notifications and audit logging.

---

## BUG-033 User Management shows every user as USER, "Change Role" is disabled for everyone, and lacks management controls
**Status:** FIXED (Admin Dashboard Part A)
**Description:** User Management table displays all users with the USER role regardless of their actual database role, role modification is completely disabled, and there is no user search/filter, pagination, drawer details, ban/unban, or force-logout action.
**Fix:** Built `AdminUserManagementPage.tsx` and `adminUsers.service.ts` returning real user roles, provider tags, search, filtering by role/status/provider, and pagination. Implemented user detail drawer with activity counts and logs, role hierarchy policy enforcement (`ChangeRoleModal.tsx`), ban/unban with optional `bannedUntil` dates, and `forceLogout` with refresh token revocation.

---

## BUG-034 No content management for all plants/remedies (publish/unpublish/feature/delete)
**Status:** FIXED (Admin Dashboard Part A)
**Description:** Administrators have no unified content management view to audit, filter, publish, unpublish, feature, or safely delete all plants and remedies across the platform.
**Fix:** Built `ManageContentPlantsPage.tsx`, `ManageContentRemediesPage.tsx`, `ContentManagementView.tsx`, and `adminContent.service.ts` with real-time status badges, search, filtering, pagination, bulk unpublish/delete (max 50), toggle feature, preview links, admin edit mode, and dependency impact analysis with typed slug confirmation for safe deletions.

---

## BUG-035 No way to apply for the BOTANIST role and no review of applications
**Status:** FIXED (Admin Dashboard Part A)
**Description:** Platform users have no workflow or interface to apply for the BOTANIST role, and administrators have no queue to evaluate, approve, or reject contributor applications with feedback.
**Fix:** Created `RoleApplication` Mongoose schema and `roleApplications.service.ts`. Built `/dashboard/become-contributor` for USER roles with validation (min 50 chars motivation, qualifications, max 3 links, 1-pending limit) and added application review tabs to the moderation queue with applicant stats, approve (auto-upgrades role to BOTANIST and revokes tokens), and reject (mandatory feedback) workflows.

---

## BUG-036 Admin child routes lack per-route role guards
**Status:** FIXED (Admin Dashboard Part A)
**Description:** Admin sub-routes in the dashboard rely solely on parent navigation and lack dedicated per-route role guards (`RequireRole`), which can allow unauthorized role elevation if routes are accessed directly.
**Fix:** Wrapped every admin sub-route in `App.tsx` with `<RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard">`, redirecting any unauthorized access attempts back to `/dashboard` accompanied by a clear error toast.

---

## BUG-044 Moderation Queue shows a pending count but does not list the pending items
**Status:** FIXED (Admin Part A Regression Fixes)
**Description:** Moderation Queue showed a pending count in the summary and sidebar badge, but the list of pending items was empty while submitted items appeared in Content Management.
**Root Cause:**
1. In `admin.controller.ts`, `moderationService.listQueue(req.query as any)` passed the entire `req.query` object as parameter 1 (`type`). `normalizeType` treated the query object as `'remedy'`, querying remedies (count 0) instead of plants.
2. In `moderation.service.ts`, mapping logic checked `if (type === 'plant')` instead of normalized `targetType === 'plant'`.
3. Separate disparate predicates existed across `getSummary()`, `listQueue()`, and `admin.service.ts`.
4. If an owner record was deleted or null, items were skipped or lacked fallback defaults.
**Fix:**
1. Created single shared predicate `getPendingReviewPredicate()` in `moderation.service.ts` used by summary, queue list, dashboard summary, and backfill.
2. Corrected parameter destructuring in `admin.controller.ts`: `const { type = 'plant', ...filters } = req.query as any;`.
3. Added fallback owner display values (`Unknown user`, `id: 'unknown'`, `email: ''`) ensuring missing/deleted owners never drop rows.
4. Created idempotent backfill script `backfillPendingContent.ts` (`npm run backfill:pending`).
5. Added "Pending review" status chip in Content Management linking to `/dashboard/moderation?type=plant|remedy`.
6. Verified with invariant test suite `admin-moderation-invariants.test.ts`.

---

## BUG-045 /dashboard/users renders a blank white page
**Status:** FIXED (Admin Part A Regression Fixes)
**Description:** Navigating to `/dashboard/users` rendered a blank white page due to an unhandled runtime exception during component rendering.
**Root Cause:**
1. In `admin.controller.ts`, `listUsers` returns `sendSuccess(res, result, 200, result.pagination)` where `result` is an object `{ users, items, activeToday, ... }`.
2. In `frontend/src/features/admin/api/adminApi.ts`, `getAdminUsers` set `items: data || []` where `data` was the raw payload object, not an array.
3. In `AdminUserManagementPage.tsx`, `users` state was assigned `res.items` (the Object `{ users: [...], items: [...] }`), causing `users.map(...)` to throw `TypeError: users.map is not a function`.
4. Without an error boundary, React unmounted the entire DOM tree, causing a blank screen.
**Fix:**
1. Created shared Zod schemas (`adminUsersResponseSchema` with safe defaults and `.transform()`) in `adminSchemas.ts` for frontend and backend contract validation.
2. Created shared null-safe formatters in `adminFormatters.ts` (`safeFormatDate`, `safeRole`, `maskEmail`, `safeDisplayName`, `safeAvatarInitial`, `safeCount`).
3. Updated `adminApi.ts` to safely extract and validate user arrays.
4. Added graceful error state with Retry button in `AdminUserManagementPage.tsx`.
5. Added unit tests with edge-case fixtures (null `lastActiveAt`, missing counts, banned user, Google-only user, empty name, 0 users, API failure).

---

## BUG-046 Any page-level exception blanks the entire app
**Status:** FIXED (Admin Part A Regression Fixes)
**Description:** When any exception occurred inside a dashboard route or page component, the entire application tree crashed and blanked the browser because there were no error boundaries.
**Root Cause:** Absence of React error boundaries inside `DashboardLayout` and at the root application level in `App.tsx`.
**Fix:**
1. Created `RouteErrorBoundary` component with "Try again" (re-mounts route / resets state), "Go to dashboard" button, route pathname error logging to console, and collapsible error stack view in development mode.
2. Wrapped the `<Outlet />` inside `DashboardLayout.tsx` with `<RouteErrorBoundary>` so if any page crashes, the top navigation and sidebar stay completely visible and functional.
3. Wrapped the root tree in `App.tsx` with `<RouteErrorBoundary isRoot>` as a safe fallback.
4. Added automated unit tests (`RouteErrorBoundary.test.tsx`) asserting navigation/sidebar integrity and fallback rendering.
5. Added route smoke test (`dashboardSmoke.test.tsx`) iterating all 16 dashboard routes with edge-case fixtures, asserting 0 error boundaries are triggered.








---

## BUG-047-PREV Admin user suspension is immediately inverted/unbanned and user remains active
**Status:** FIXED
**Description:** When an admin attempted to suspend a user in User Management, the user was immediately unbanned / reinstated, sending an "Account Reinstated" notification, and the user remained "Active" in the admin table.
**Root Cause:**
1. In `frontend/src/features/admin/pages/AdminUserManagementPage.tsx`, suspending a user sends `{ isActive: false, banReason, bannedUntil }`.
2. In `backend/src/modules/admin/admin.controller.ts`, `banUser` passed `req.body.isActive` directly as the `ban: boolean` argument to `adminUsersService.banUser(targetUserId, ban, reason, ...)`.
3. Because `isActive` was `false`, `adminUsersService.setBanStatus` received `ban = false`.
4. It executed the `else` branch (unban/reinstate): setting `targetUser.isActive = true`, clearing `banReason`, and sending an "Account Reinstated" notification to the user.
5. In addition, `banUserSchema` in `admin.validators.ts` omitted `bannedUntil` and `ban`.
**Fix:**
1. In `admin.controller.ts`, computed `shouldBan = ban !== undefined ? Boolean(ban) : (isActive !== undefined ? !isActive : true)`.
2. Updated `banUserSchema` in `admin.validators.ts` to accept `isActive`, `ban`, `banReason`, and `bannedUntil`.
3. Added direct `handleReinstate(u)` for suspended user rows in `AdminUserManagementPage.tsx`.
4. Added real-time `account:suspended` and `account:reinstated` socket emissions.
5. Added integration tests in `backend/tests/admin-dashboard-part-a.test.ts` verifying that suspension via API properly sets `isActive: false`, `isBanned: true`, and preserves the suspension.

---

## BUG-048-PREV NotificationPanel crashes with RangeError: Invalid time value
**Status:** FIXED
**Description:** On the user side, navigating or opening notifications threw an unhandled `RangeError: Invalid time value` at `formatDistanceToNow` inside `NotificationPanel.tsx`, triggering an "Application Error" fallback screen instead of showing the real issue.
**Root Cause:**
In `frontend/src/app/components/dashboard/NotificationPanel.tsx`, `formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })` was called directly without date validation. If `notification.createdAt` was missing, null, or an unparseable string, date-fns threw `RangeError: Invalid time value`.
**Fix:**
1. Created `safeFormatTimeAgo(dateInput)` in `NotificationPanel.tsx` checking for null/undefined, verifying `!isNaN(d.getTime())`, and wrapping `formatDistanceToNow` in `try/catch`.
2. Added `ACCOUNT_SUSPENDED` handling in `AuthContext.tsx` and `api.ts` to clear tokens and show explicit suspension messages.
3. Added suspension verification in `GoogleStrategy` so banned users cannot bypass suspension using Google OAuth.
4. Added custom failure callback in `auth.routes.ts` passing the exact suspension message in the redirect URL.
5. Added unit test in `NotificationPanel.test.tsx` verifying safe rendering with invalid and missing dates.

---

## BUG-047 Role Management page crashes ("Unable to load page")
**Status:** FIXED (Super Admin Dashboard Part S1)
**Description:** Navigating to `/dashboard/system/role-management` crashes the page with the RouteErrorBoundary ("Unable to load page").
**Root Cause:** In `useAdminUsers()`, the hook stored the entire API response object `{ users, pagination, ... }` into `users` state instead of extracting the users array, causing `adminUsers.forEach is not a function` in `RoleManagementPage`.
**Fix:**
1. Refactored `useAdminUsers` hook to guarantee `users` is always an array of user objects (`res.data.users || res.data || []`), exposing `{ users, total, isLoading, fetchUsers }`.
2. Created `frontend/src/features/system/pages/RoleManagementPage.tsx` with tabs for Users & Roles, Admin Accounts, and Permission Matrix. Wrapped with `<RequireRole minimumRole="SUPER_ADMIN" forbiddenRedirect="/dashboard">` in `App.tsx`.
3. Verified via Vitest smoke tests (`dashboardSmoke.test.tsx` 18/18 PASS) and feature tests (`systemFeature.test.tsx` 6/6 PASS).

---

## BUG-048 Audit Log shows hard-coded sample rows (emails that do not exist in the DB)
**Status:** FIXED (Super Admin Dashboard Part S1)
**Description:** `/dashboard/system/audit-log` displayed 3 static mock entries (`admin@garden.com`, `botanist@garden.com`, Shatavari) with dummy timestamps instead of reading live AuditLog documents.
**Root Cause:** The page rendered a hardcoded local array instead of fetching from the backend audit log API.
**Fix:**
1. Implemented real backend endpoints: `GET /api/v1/system/audit-logs`, `GET /api/v1/system/audit/summary`, `GET /api/v1/system/audit-logs/export.csv`, and `GET /api/v1/system/security/events`.
2. Built real-time `AuditLogPage.tsx` with filter toolbar (Actor, Action multi-select, TargetType, Severity, Date Range, text query), Summary metrics cards (24h, 7d, 30d, top actors), full slide-over Detail Drawer with formatted JSON and diff highlighting, CSV streaming export with `X-Reauth-Token`, and Security Events tab with suspicious IP tracking (≥5 failed logins / 10m).
3. Verified via backend tests (`system-super-admin.test.ts` 21/21 PASS) and frontend tests (`systemFeature.test.tsx` 6/6 PASS).

---

## BUG-049 Settings & Profile has generic copy for admin roles and no security center
**Status:** FIXED (Super Admin Dashboard Part S1)
**Description:** Settings & Profile used static copy ("Herbal explorer", "botanical profile") regardless of role, and lacked a security center (2FA setup/disable with backup codes, active sessions with revocation, personal login history, notification preferences).
**Root Cause:** No role-aware configuration or backend/frontend security center and session tracking existed.
**Fix:**
1. Built role-aware copy configuration dictionary (`ROLE_COPY_CONFIG`) for `SUPER_ADMIN`, `ADMIN`, `BOTANIST`, and `USER` with custom page subtitles, badges, and bio labels.
2. Built 2FA Security Center supporting TOTP QR code data URL setup, 10 single-use hashed backup codes with print/download modal, single-use verification, and password/TOTP reauth disable flow.
3. Built Active Sessions manager showing device, browser, OS, IP, and relative time with "Revoke" and "Log Out Other Devices" actions.
4. Built Login History log table and granular Notification Preferences toggle switches (`User.preferences.notifications`).
5. Verified via frontend feature test (`systemFeature.test.tsx` 6/6 PASS).

---

## BUG-050 Dashboard search triggers browser email-autofill popup and shows misleading empty message for admin queries
**Status:** FIXED (Super Admin Dashboard Part S1)
**Description:** The dashboard header search input triggered autofill suggestions for email credentials and only searched plants/remedies even when logged in as an ADMIN or SUPER_ADMIN searching for users or tours.
**Root Cause:** Input lacked appropriate `autoComplete="off"`, type, and name attributes; backend search endpoint and frontend search lacked ADMIN+ user/tour search integration and role-aware empty states.
**Fix:**
1. Updated `HeaderSearchDropdown.tsx` with `type="search"`, `autoComplete="off"`, `name="dashboard-header-search"`, and `data-lpignore="true"` to prevent autofill heuristics.
2. Implemented `GET /api/v1/admin/search` returning grouped Users and Tours alongside Plants and Remedies for ADMIN and SUPER_ADMIN users.
3. Added role-aware empty states guiding the user on what categories are searchable based on their active role.
4. Verified via Vitest unit tests in `systemFeature.test.tsx`.

---

## BUG-051 Sensitive super-admin actions need no re-authentication
**Status:** FIXED (Super Admin Dashboard Part S1)
**Description:** High-privilege actions (granting/revoking ADMIN, disabling 2FA, regenerating backup codes, revoking user sessions, exporting audit logs) could be executed without recent password or TOTP re-authentication.
**Root Cause:** No step-up re-authentication endpoint, token, or middleware existed.
**Fix:**
1. Implemented `POST /api/v1/auth/reauth` issuing a signed 5-minute scoped JWT (`purpose: "reauth"`). Rate-limited to 5 attempts per minute per IP. Audits failures without logging passwords.
2. Created `requireRecentAuth` middleware validating the `X-Reauth-Token` header, verifying user match, expiration, and purpose.
3. Protected role changes (`PATCH /system/users/:id/role`), admin session revocation (`DELETE /system/users/:id/sessions/:sessionId`), CSV export (`GET /system/audit-logs/export.csv`), and backup codes regeneration (`POST /auth/2fa/regenerate-backup-codes`).
4. Created reusable modal `ReauthDialog.tsx` and custom hook `useReauth.ts` handling both password and TOTP modes.
5. Verified via 21 backend Jest tests and frontend Vitest component tests.

---

## BUG-052 Logging in to a 2FA-enabled account fails silently without prompting for verification code
**Status:** FIXED
**Description:** After enabling two-factor verification, when the user logs out and attempts to log back in via the login modal on the home page (`Layout.tsx`), clicking "Sign In" silently did nothing: no error was shown and the user was not logged in.
**Root Cause:**
1. In `backend/src/modules/auth/auth.controller.ts`, when 2FA is active for the user, `POST /api/v1/auth/login` returns `{ requires2fa: true, challengeToken: string, message: "Please provide your 2FA code" }` with HTTP 200.
2. In `frontend/src/contexts/AuthContext.tsx`, `login(email, password)` assumed the response always contained `{ accessToken, user }`. When `requires2fa` was returned, `accessToken` and `user` were `undefined`, so no session was created and no error was thrown.
3. In `frontend/src/app/Layout.tsx`, `handleAuthSubmit` blindly called `login()`, closed the auth modal (`setShowAuthDialog(false)`), and navigated to `/`. There was no secondary step or input UI to collect the 6-digit TOTP authenticator code or 8-character single-use backup code.
**Fix:**
1. Created TDD test suite `frontend/src/features/auth/__tests__/twoFactorLogin.test.tsx` verifying `AuthContext` returns the 2FA challenge and `Layout` prompts for the code and calls `verify2faLogin`.
2. Updated `AuthContext.tsx`: defined `AuthLoginResult` interface (`{ requires2fa: boolean; challengeToken?: string }`). If `requires2fa` is true, returns the challenge token without setting the user or tokens. Added `verify2faLogin(challengeToken: string, code: string)` calling `POST /api/v1/auth/2fa/login-verify` to complete authentication and establish the WebSocket connection.
3. Updated `Layout.tsx`: added a 2FA step state in the login modal. When `requires2fa` is received, keeps the modal open and renders the 2-Step Verification view with a 6-digit TOTP / backup code input, "Verify & Sign In" button, and "Back to Email & Password" option.
---

## BUG-053 Database Collections & Catalog Distribution "Manage" buttons open 404 "Lost in the Garden?" page
**Status:** FIXED
**Description:** Clicking the "Manage ↗" button next to any database collection (e.g. User Accounts, Medicinal Plants, Herbal Remedies, Virtual Guided Tours) in the "Database Collections & Catalog Distribution" table on the System Overview page (`/dashboard/system`) opens a 404 page: "ERROR 404 — PAGE NOT FOUND. Lost in the Garden?".
**Root Cause:**
1. In `backend/src/modules/system/system.service.ts`, the database collections catalog array defined management URLs prefixed with `/dashboard/admin/*` (`/dashboard/admin/users`, `/dashboard/admin/content/plants`, `/dashboard/admin/content/remedies`, `/dashboard/admin/tours`).
2. In `frontend/src/App.tsx`, all dashboard pages are nested under `<Route path="/dashboard" element={<DashboardLayout />}>`, where the actual routes are defined as `users` (`/dashboard/users`), `content/plants` (`/dashboard/content/plants`), `content/remedies` (`/dashboard/content/remedies`), and `tours/manage` (`/dashboard/tours/manage`). There was no `/dashboard/admin/*` routing branch, causing the router to fall back to the 404 catch-all route.
**Fix:**
1. Wrote TDD assertions in `backend/tests/system-overview.test.ts` verifying collection management paths point to valid active routes (`/dashboard/users`, `/dashboard/content/plants`, etc.). Observed test failure with `Expected: "/dashboard/users", Received: "/dashboard/admin/users"`.
2. Updated `backend/src/modules/system/system.service.ts` so collection records provide the canonical active dashboard paths:
   - `users`: `/dashboard/users`
   - `plants`: `/dashboard/content/plants`
   - `remedies`: `/dashboard/content/remedies`
   - `tours`: `/dashboard/tours/manage`
3. Added backward-compatibility alias redirects in `frontend/src/App.tsx` within `<Route path="/dashboard">`:
   - `admin/users` -> `<Navigate to="/dashboard/users" replace />`
   - `admin/content/plants` -> `<Navigate to="/dashboard/content/plants" replace />`
   - `admin/content/remedies` -> `<Navigate to="/dashboard/content/remedies" replace />`
   - `admin/content` -> `<Navigate to="/dashboard/content/plants" replace />`
   - `admin/tours` -> `<Navigate to="/dashboard/tours/manage" replace />`
4. Updated mock data and added a component test in `frontend/src/features/system/__tests__/SystemOverviewPage.test.tsx` verifying manage links render valid dashboard paths (4/4 tests PASS).
5. Re-ran backend integration tests (7/7 PASS), frontend smoke tests (18/18 PASS), frontend lint (0 errors), and production build (clean bundle).

