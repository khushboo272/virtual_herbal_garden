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




