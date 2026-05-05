# 🌿 Product Requirements Document
## Virtual Herbal Garden Tour Module

| Field | Details |
|-------|---------|
| **Version** | 1.0 |
| **Status** | Draft |
| **Date** | April 2026 |
| **Route** | `/virtual-tour` |
| **Priority** | High — Core learning module |

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Scope](#2-scope)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [UI / UX Specifications](#5-ui--ux-specifications)
6. [User Flows](#6-user-flows)
7. [Data Model](#7-data-model)
8. [API Endpoints](#8-api-endpoints)
9. [Acceptance Criteria](#9-acceptance-criteria)
10. [Milestones & Dependencies](#10-milestones--dependencies)
11. [Open Questions & Assumptions](#11-open-questions--assumptions)

---

## 1. Module Overview

| Field | Details |
|-------|---------|
| **Module Name** | Virtual Herbal Garden Tour |
| **Route / URL** | `/virtual-tour` |
| **Module Type** | Interactive Learning / Guided Tour |
| **Target Users** | General public, students, herbal enthusiasts, healthcare learners |
| **Priority** | High — Core learning module of the application |

### 1.1 Purpose

The Virtual Herbal Garden Tour is an interactive, self-paced guided learning module that takes users through a structured journey exploring medicinal plants and their significance. The module presents educational content in bite-sized checkpoints, combining audio narration, interactive activities, and progress tracking to create an engaging learning experience.

### 1.2 Goals

- Deliver structured, sequential herbal education through guided checkpoints.
- Enable self-paced learning with audio narration and interactive exercises.
- Track user progress persistently across sessions (2 of 6 checkpoints model).
- Encourage completion via visible progress metrics and intuitive navigation.
- Support replay and review for reinforcement of already-completed checkpoints.

---

## 2. Scope

### 2.1 In Scope

- Progress tracker UI (percentage complete, checkpoint count, progress bar).
- Checkpoint card list with status indicators (Completed / In Progress / Locked).
- Audio narration playback per checkpoint.
- Interactive activities embedded within each checkpoint.
- "Review Checkpoint", "Replay", and "View Details" actions per completed step.
- "Continue" or "Start" CTA for the active/upcoming checkpoint.
- Responsive layout — desktop and mobile.
- Session-persistent progress stored per authenticated user.
- Navigation via top nav bar (Library, AI Scanner, 3D Garden, Remedies, Virtual Tour, Login).

### 2.2 Out of Scope

- New checkpoint content authoring interface (Admin CMS — separate module).
- Certificate generation upon tour completion.
- Social sharing of progress.
- Gamification / badges (future roadmap).
- Offline mode / PWA capability (Phase 2).

---

## 3. Functional Requirements

### 3.1 Page Header & Hero Section

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-01 | Display page label: "Interactive Learning Journey" | Label visible as a pill/badge above the main heading |
| FR-02 | Display main heading: "Virtual Herbal Garden Tour" | H1 element, centered, consistent with brand typography |
| FR-03 | Display descriptive subtext about the tour purpose | Two-line descriptive text below heading, centered alignment |

### 3.2 Progress Tracker

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-04 | Display "Your Progress" card | Card spans full content width, clearly separated from checkpoint list |
| FR-05 | Show number of completed checkpoints out of total (e.g. "2 of 6 checkpoints completed") | Dynamic text updates as user completes more checkpoints |
| FR-06 | Show percentage complete (e.g. "33% Complete") | Percentage displayed prominently, auto-calculated from checkpoint count |
| FR-07 | Render a horizontal progress bar reflecting completion % | Bar fills left-to-right in brand green; width corresponds exactly to completion percentage |
| FR-08 | Progress persists across page refreshes and re-logins | State stored server-side per authenticated user; guest users shown session-only state |

### 3.3 Checkpoint Cards

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-09 | Render an ordered list of checkpoint cards | Cards rendered in sequential order; numbering visible (1, 2, 3...) |
| FR-10 | Each card shows checkpoint number + title | Example: "1. Welcome to the Garden" |
| FR-11 | Display completion status badge on card header | Badge: "Completed" (green), "In Progress" (amber), "Locked" (grey) |
| FR-12 | Display checkpoint description (subtitle text) | One-line description below title |
| FR-13 | Display metadata: Audio Narration, Duration, Activity type | Icons with labels; duration shown in minutes (e.g. "3 min") |
| FR-14 | Completed checkpoint shows: "Review Checkpoint", "Replay", "View Details" buttons | All three CTAs visible and functional on completed cards |
| FR-15 | Active checkpoint shows: "Start" or "Continue" primary CTA | Single prominent action button; label depends on whether user has started |
| FR-16 | Locked checkpoints show a disabled/locked state | Locked visual indicator; interaction disabled until prior checkpoint completed |
| FR-17 | Status icon shown alongside card (checkmark for completed) | Green circle with white checkmark for completed; empty circle for incomplete |

### 3.4 Checkpoint Detail View

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-18 | "View Details" opens a detail page or modal for the checkpoint | Navigates to `/virtual-tour/:checkpointId` or opens expanded overlay |
| FR-19 | Detail view contains: full plant description, images, scientific name | Rich content with at least one image and plant taxonomy details |
| FR-20 | Audio narration player embedded in detail view | Play/pause, scrub bar, duration display; autoplay off by default |
| FR-21 | Interactive activity section (quiz, drag-drop, or identification) | At least one activity type; completion marks checkpoint as done |
| FR-22 | "Replay" re-triggers audio narration from the start | Audio resets to 0:00; previous completion status retained |

### 3.5 Navigation & Routing

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-23 | Top navigation highlights "Virtual Tour" as active | "Virtual Tour" nav item appears visually distinct (filled green button style) |
| FR-24 | All top nav links route correctly to their respective modules | Library, AI Scanner, 3D Garden, Remedies, Login all navigate correctly |
| FR-25 | Login link redirects unauthenticated users to auth flow | Clicking Login routes to `/login`; post-login redirects back to `/virtual-tour` |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Initial page load (LCP) ≤ 2.5 seconds on a 4G connection.
- Audio narration streams progressively; first byte within 1 second of play trigger.
- Progress bar update latency ≤ 300ms after checkpoint completion is confirmed by API.
- Checkpoint card list renders all items without pagination for ≤ 20 checkpoints.

### 4.2 Accessibility (WCAG 2.1 AA)

- All interactive buttons have `aria-label` attributes.
- Progress bar exposes `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- Audio narration player supports keyboard-only navigation (Space to play/pause, arrow keys to scrub).
- Color contrast ratio ≥ 4.5:1 for all text against background.
- Checkpoint status communicated via text, not color alone.

### 4.3 Responsiveness

- Layout supports viewport widths from 320px (mobile) to 1920px (desktop).
- On mobile: progress card and checkpoint cards stack vertically and occupy full width.
- Action buttons (Review, Replay, View Details) wrap to multiple lines on narrow screens.

### 4.4 Security

- User progress read/write API endpoints are authenticated (JWT / session-based).
- Unauthenticated users may view the tour structure but cannot persist progress.
- Audio and content assets served from CDN with signed URLs if content is premium.

### 4.5 Browser Support

- Chrome 110+, Firefox 110+, Safari 15+, Edge 110+.
- Audio: Web Audio API or HTML5 `<audio>` with fallback.

---

## 5. UI / UX Specifications

### 5.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Brand Green | `#1A7A3C` | Headings, active states, progress bar fill, primary buttons |
| Medium Green | `#2D9E5F` | Section borders, subheadings |
| Light Green BG | `#E8F5EE` | Card backgrounds, progress card, table header cells |
| Status Green | `#22C55E` | Completed badge, checkmark icon |
| Neutral Dark | `#1E1E1E` | Body text |
| Neutral Gray | `#5A5A5A` | Metadata text, descriptions |
| White | `#FFFFFF` | Page background, card background |

### 5.2 Typography

| Element | Font | Size / Weight | Color |
|---------|------|---------------|-------|
| Page Title (H1) | Inter / System | 32px / Bold | Brand Green |
| Section Heading (H2) | Inter / System | 22px / SemiBold | Medium Green |
| Card Title | Inter / System | 18px / SemiBold | Dark |
| Body / Description | Inter / System | 14px / Regular | Dark |
| Metadata (icons) | Inter / System | 13px / Regular | Gray |
| Badge Text | Inter / System | 12px / Medium | White on Green |
| Progress % | Inter / System | 28px / Bold | Brand Green |

### 5.3 Component Specifications

#### 5.3.1 Progress Card

- Background: `#E8F5EE` with 1px border in light green.
- Border radius: 12px. Padding: 24px.
- **Left:** "Your Progress" label (16px Bold) + "2 of 6 checkpoints completed" (14px Regular).
- **Right:** Percentage number (28px Bold) + "Complete" label (12px).
- Progress bar: full width, height 8px, background `#D0E8D8`, fill `#1A7A3C`, border-radius 999px.

#### 5.3.2 Checkpoint Card

- White card, border: `1px solid #D0E8D8`, border-radius: 12px, padding: 20px.
- Left gutter: 48px circle icon (checkmark green / empty / lock grey).
- Header row: checkpoint number + title (18px SemiBold) + status badge.
- Subtext: description in 14px Regular `#5A5A5A`.
- Metadata row: icons + labels in 13px with 16px gap between items.
- Action row: ghost-style outlined buttons with green text and border.

#### 5.3.3 Status Badge

| Status | Background | Text Color | Shape |
|--------|-----------|------------|-------|
| Completed | `#22C55E` | White | Pill |
| In Progress | `#F59E0B` | White | Pill |
| Locked | `#D1D5DB` | Grey | Pill |

---

## 6. User Flows

### 6.1 First-Time User

1. User lands on `/virtual-tour`.
2. All checkpoints show as "Locked" except Checkpoint 1 ("Start" CTA visible).
3. User clicks "Start" on Checkpoint 1.
4. Detail view opens: plant content, audio narration auto-prompts user.
5. User completes interactive activity.
6. System marks Checkpoint 1 as "Completed"; progress updates to 1/6 (17%).
7. Checkpoint 2 unlocks with "Start" CTA.

### 6.2 Returning User (Partial Progress)

1. User logs in and navigates to `/virtual-tour`.
2. Progress bar and checkpoints reflect saved state (e.g. 2 of 6, 33%).
3. Completed checkpoints show "Review Checkpoint", "Replay", "View Details".
4. Active checkpoint (3rd) shows "Continue" CTA.
5. User continues from where they left off.

### 6.3 Replay a Completed Checkpoint

1. User clicks "Replay" on a completed card.
2. Audio narration restarts from 0:00.
3. Checkpoint remains marked as "Completed" — no regression in progress.

---

## 7. Data Model

### 7.1 Checkpoint Entity

| Field | Type | Description |
|-------|------|-------------|
| `id` | String / UUID | Unique identifier for the checkpoint |
| `order` | Integer | Sequential position in the tour (1, 2, 3...) |
| `title` | String | Display title of the checkpoint |
| `description` | String | Short subtitle/description shown on the card |
| `durationMinutes` | Integer | Estimated time to complete in minutes |
| `audioUrl` | String (URL) | CDN URL for the narration audio file |
| `hasInteractiveActivity` | Boolean | Whether the checkpoint has an activity |
| `plantData` | Object | Embedded herbal/plant info (name, image, uses) |

### 7.2 UserProgress Entity

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String / UUID | Reference to the authenticated user |
| `checkpointId` | String / UUID | Reference to the checkpoint |
| `status` | Enum | `not_started` \| `in_progress` \| `completed` |
| `completedAt` | Timestamp | ISO timestamp of when the checkpoint was completed |
| `lastAccessedAt` | Timestamp | Most recent visit to the checkpoint detail |
| `replayCount` | Integer | Number of times user has replayed the checkpoint |

---

## 8. API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/tour/checkpoints` | No | Fetch all checkpoints with metadata |
| `GET` | `/api/tour/progress` | Yes | Fetch current user's progress across all checkpoints |
| `PATCH` | `/api/tour/progress/:id` | Yes | Update status of a specific checkpoint (start / complete) |
| `POST` | `/api/tour/replay/:id` | Yes | Log a replay event; increments replayCount |
| `GET` | `/api/tour/checkpoints/:id` | No | Fetch full detail for a single checkpoint |

---

## 9. Acceptance Criteria

| # | Scenario | Expected Outcome |
|---|----------|-----------------|
| AC-01 | User visits `/virtual-tour` without login | Page loads; progress shows 0%; all except Checkpoint 1 locked |
| AC-02 | Authenticated user with 2 completed checkpoints | Progress shows 33%; 2 cards marked Completed with 3 action buttons |
| AC-03 | User completes Checkpoint 3 activity | Checkpoint 3 → Completed; progress bar updates to 50%; Checkpoint 4 unlocks |
| AC-04 | User clicks Replay on Checkpoint 1 | Audio restarts; Completed badge remains; replayCount incremented |
| AC-05 | User completes all 6 checkpoints | Progress shows 100% Complete; all cards show Completed state |
| AC-06 | User navigates away and returns | Progress state persists exactly as before |
| AC-07 | Mobile viewport (375px) | Cards, progress bar, and buttons render without horizontal scroll |
| AC-08 | Keyboard navigation | Tab through all cards and action buttons; Enter/Space trigger actions |

---

## 10. Milestones & Dependencies

| # | Milestone | Estimated Duration | Dependencies |
|---|-----------|--------------------|--------------|
| M-01 | UI design & component library setup | 3 days | Brand guidelines, Figma handoff |
| M-02 | Static checkpoint list rendering | 2 days | Checkpoint data schema finalized |
| M-03 | Progress tracker integration | 2 days | UserProgress API endpoint |
| M-04 | Audio narration player | 3 days | CDN audio assets available |
| M-05 | Interactive activities (Checkpoint 1) | 4 days | Content team sign-off |
| M-06 | All 6 checkpoint content integration | 5 days | All audio + activity assets |
| M-07 | Auth-gated progress persistence | 3 days | Auth module complete |
| M-08 | QA, accessibility audit & bug fixes | 3 days | All above milestones |
| M-09 | Production deployment | 1 day | QA sign-off |

**Total Estimated Duration: ~26 days**

---

## 11. Open Questions & Assumptions

### 11.1 Open Questions

- Should guest (unauthenticated) users be able to start and track progress via `localStorage`?
- Will there be exactly 6 checkpoints or is this configurable via CMS?
- Is the audio narration human-recorded or AI-generated (TTS)?
- What types of interactive activities are required — quiz-only, or drag-drop/identification too?
- Is there a completion certificate or reward upon finishing all 6 checkpoints?
- Should locked checkpoints be visible (greyed out) or completely hidden?

### 11.2 Assumptions

- The "Virtual Tour" top nav button links exclusively to `/virtual-tour`.
- Maximum of 6 checkpoints for the initial release (based on UI screenshot).
- Progress percentage is calculated as `(completedCheckpoints / totalCheckpoints) × 100`.
- Audio narration is pre-recorded and hosted on a CDN (not real-time TTS).
- "Review Checkpoint" and "View Details" both navigate to the checkpoint detail view.
- The module is built using React.js (consistent with the broader application stack).

---

*End of Document — Virtual Herbal Garden Tour PRD v1.0*
