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
**Status:** OPEN — not part of the library task.
**Probable causes:** `imageUrl` is empty when storage is not configured; history includes FAILED/PENDING records. Planned fix: store a small thumbnail data URL on Detection when storage is unavailable, show only COMPLETE scans in Recent Scans, and show FAILED scans as a clear failed state.

---

## BUG-005 Home page badge says "Explore 200+ Medicinal Plants" but the database has ~10
**Status:** OPEN — Home module.
**Description:** The hero badge on the home page displays "Explore 200+ Medicinal Plants", but the actual plant count in the database is approximately 10–15. This is hardcoded copy in the Home component.
