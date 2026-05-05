# 🌿 Virtual Herbal Garden Tour — Full Implementation Plan v2.0
## UI Rebuild to Match Reference Screenshot Design

| Field | Details |
|-------|---------|
| **Version** | 2.0 — UI Redesign + Full Feature Build |
| **Status** | Active Development |
| **Date** | April 2026 |
| **Route** | `/virtual-tour` |
| **Priority** | High — Core Learning Module |
| **Tech Stack** | React + TypeScript + Framer Motion + Web Speech API |
| **Progress Storage** | localStorage (guest) + API (authenticated users) |

---

## Table of Contents

1. [Module Overview & Screenshot Analysis](#1-module-overview--screenshot-analysis)
2. [Exact UI Specifications (Screenshot Match)](#2-exact-ui-specifications-screenshot-match)
3. [Checkpoint Data — All 6 Checkpoints](#3-checkpoint-data--all-6-checkpoints)
4. [Component Architecture](#4-component-architecture)
5. [Progress Management](#5-progress-management)
6. [Audio Narration (Web Speech API)](#6-audio-narration-web-speech-api)
7. [Interactive Quiz System](#7-interactive-quiz-system)
8. [API Endpoints (Future Backend Phase)](#8-api-endpoints-future-backend-phase)
9. [Implementation Phases](#9-implementation-phases)
10. [Acceptance Criteria](#10-acceptance-criteria)
11. [Open Questions & Decisions](#11-open-questions--decisions)

---

## 1. Module Overview & Screenshot Analysis

The Virtual Herbal Garden Tour is an interactive, self-paced guided learning module taking users through 6 sequential checkpoints on medicinal plants — combining audio narration, interactive quizzes, and persistent progress tracking.

### 1.1 Confirmed UI Design from Screenshot

The reference screenshot (`localhost:5173/virtual-tour`) shows:

- **Large circular status icons (56px)** alternating left/right sides of each card:
  - Checkpoint 1 (odd) → circle on the **LEFT**, inside the card gutter
  - Checkpoint 2 (even) → circle on the **RIGHT**, outside the card
- **Dashed connector lines** linking consecutive checkpoint cards vertically (between the circles)
- **Full-width progress card** at top — left side shows label + count, right side shows large percentage
- **Active cards** have a left border accent (4px solid green) + subtle box-shadow
- **Completed cards** show three ghost-outlined buttons: `✓ Review Checkpoint` | `↺ Replay` | `🔍 View Details`
- **Active/Available cards** show a single filled green `▶ Start` or `▶ Continue` button
- **Locked cards** show a disabled `🔒 Locked` button (gray, no hover)
- Status badges in pill shape: green=Completed, amber=In Progress/Available, gray=Locked

---

## 2. Exact UI Specifications (Screenshot Match)

### 2.1 Progress Tracker Card

| Property | Value |
|----------|-------|
| Background | `#E8F5EE` with `1px solid #B7DDC6` border |
| Border Radius | `16px` |
| Padding | `28px 32px` |
| Left Side | "Your Progress" `16px Bold #1A7A3C` + "X of 6 checkpoints completed" `14px #5A5A5A` |
| Right Side | Percentage `28px Bold #1A7A3C` + "Complete" label `12px` |
| Progress Bar | Height `10px`, bg `#D0E8D8`, fill `#1A7A3C`, border-radius `999px`, full width |
| ARIA | `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` on bar container |

### 2.2 Checkpoint Card Layout

Each checkpoint renders as a wide card. Odd-numbered checkpoints (1, 3, 5) have the circle on the **LEFT**; even-numbered (2, 4, 6) have it on the **RIGHT** — matching the alternating layout in the screenshot.

| Property | Value |
|----------|-------|
| Card Background | White `#FFFFFF` |
| Card Border | `1px solid #D0E8D8`, border-radius `16px`, padding `24px 28px` |
| Active Card | Left border `4px solid #2E9E57` + `box-shadow: 0 0 0 2px #C3E6D0` |
| Status Circle | `56px` diameter — green filled `#22C55E` for completed, white with green border for active, gray `#F3F4F6` for locked |
| Circle Position | **LEFT** for checkpoints 1, 3, 5 — **RIGHT** for checkpoints 2, 4, 6 |
| Connector Line | Dashed vertical line `#D0E8D8` between consecutive cards, `2px` dashed |
| Card Width | ~85% of container, offset to leave room for side circle |

**CSS Pattern for Alternating Circles:**
```css
/* Odd checkpoints: circle on left */
.cp-card-odd { margin-left: 80px; position: relative; }
.cp-card-odd .status-circle { position: absolute; left: -68px; top: 50%; transform: translateY(-50%); }

/* Even checkpoints: circle on right */
.cp-card-even { margin-right: 80px; position: relative; }
.cp-card-even .status-circle { position: absolute; right: -68px; top: 50%; transform: translateY(-50%); }

/* Connector line (between cards) */
.cp-connector { border-left: 2px dashed #D0E8D8; height: 40px; margin-left: calc(50% - 1px); }
```

### 2.3 Status Badges

| Status | Background | Text Color | Shape |
|--------|-----------|------------|-------|
| Completed | `#22C55E` | White | Pill — `11px SemiBold` |
| In Progress / Available | `#F59E0B` | White | Pill — `11px SemiBold` |
| Locked | `#D1D5DB` | `#6B7280` | Pill — `11px SemiBold` |

### 2.4 Action Buttons

| State | Buttons |
|-------|---------|
| Completed | `✓ Review Checkpoint` \| `↺ Replay` \| `🔍 View Details` — ghost outlined, green border + text |
| Active | `▶ Start` or `▶ Continue` — filled green `#1A7A3C`, white text |
| Locked | `🔒 Locked` — disabled, gray border, no hover |

**Button Style:**
```css
.btn {
  border: 1.5px solid #1A7A3C;
  color: #1A7A3C;
  background: white;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  cursor: pointer;
}
.btn:hover { background: #1A7A3C; color: white; }
.btn-primary { background: #1A7A3C; color: white; }
.btn-disabled { border-color: #D1D5DB; color: #9CA3AF; cursor: not-allowed; }
```

### 2.5 Checkpoint Detail Modal (View Details / Review / Start)

Opened when user clicks Start, Continue, Review Checkpoint, or View Details.

| Section | Content |
|---------|---------|
| Header (sticky) | Title + subtitle + status badge + ✕ close button |
| Introduction | Full text in `#F9FDF9` card with green border |
| Key Learning Points | Checklist with `✓` green checkmarks |
| Featured Plants | Pill tags with `#F0FBF4` bg and green border |
| Interactive Activity | `🎮` header + description + Start Activity button → QuizActivity |
| Audio Narration | `🔊` header + Play/Pause circle btn + progress bar + timer + volume |

---

## 3. Checkpoint Data — All 6 Checkpoints

All data lives in `frontend/src/app/virtualTour/checkpointData.ts`.

### Checkpoint 1 — Welcome to the Garden
- **Description:** Introduction to medicinal plants and their importance
- **Duration:** 3 min | **Plants:** Aloe Vera, Chamomile, Peppermint
- **Learning Points:** History of medicinal plants, healing compounds, sustainable harvesting, safety
- **Activity:** Quiz — plant identification basics
- **Audio Script:** Covers history of herbal medicine, Aloe Vera's 75+ compounds, Chamomile since ancient Egypt, Peppermint's menthol

### Checkpoint 2 — Immunity Boosters
- **Description:** Explore plants that strengthen immune system response
- **Duration:** 5 min | **Plants:** Echinacea, Elderberry, Ginger
- **Learning Points:** Echinacea + white blood cells, elderberry anthocyanins, ginger anti-inflammatory, combining herbs safely
- **Activity:** Quiz — identify immune-boosting compounds

### Checkpoint 3 — Stress & Sleep Herbs
- **Description:** Discover adaptogens and relaxants for mind-body balance
- **Duration:** 4 min | **Plants:** Ashwagandha, Lavender, Valerian
- **Learning Points:** Adaptogens + cortisol, lavender GABA modulation, valerian sleep receptors, bedtime routines
- **Activity:** Quiz — match herbs to stress-relief mechanisms

### Checkpoint 4 — Digestive Herbs
- **Description:** Herbs that soothe, heal, and optimize the gut microbiome
- **Duration:** 5 min | **Plants:** Turmeric, Fennel, Licorice Root
- **Learning Points:** Curcumin + gut inflammation, fennel carminative action, licorice mucosal protection, gut-brain axis
- **Activity:** Quiz — digestive herb knowledge

### Checkpoint 5 — Skin & Wound Healing
- **Description:** Topical and internal herbs for skin health and repair
- **Duration:** 4 min | **Plants:** Calendula, Tea Tree, Comfrey
- **Learning Points:** Calendula flavonoids + wound healing, tea tree antimicrobial, comfrey allantoin + cell proliferation
- **Activity:** Quiz — identify skin herb applications

### Checkpoint 6 — Herbs for Heart Health
- **Description:** Cardiovascular support through plant-based medicine
- **Duration:** 6 min | **Plants:** Hawthorn, Garlic, Motherwort
- **Learning Points:** Hawthorn OPCs + coronary arteries, garlic allicin + cholesterol, motherwort leonurine + heart rhythm
- **Activity:** Quiz — heart herb knowledge

---

## 4. Component Architecture

### 4.1 File Structure

```
frontend/src/app/virtualTour/
  ├── checkpointData.ts          ← All 6 checkpoints with full data
  ├── types.ts                   ← Checkpoint, UserProgress, CheckpointStatus
  ├── virtualTour.css            ← All tour-specific styles
  ├── ProgressTracker.tsx        ← Progress card component
  ├── CheckpointCard.tsx         ← Individual card with alternating layout
  ├── CheckpointDetail.tsx       ← Modal detail view
  ├── AudioPlayer.tsx            ← Web Speech API audio player
  └── activities/
      ├── QuizActivity.tsx       ← Multiple choice quiz
      └── ActivityWrapper.tsx   ← Selects activity type per checkpoint

frontend/src/contexts/
  └── TourProgressContext.tsx    ← Progress state + localStorage

frontend/src/hooks/
  └── useTourProgress.ts         ← Hook wrapping context
```

### 4.2 TypeScript Interfaces (types.ts)

```typescript
export type CheckpointStatus = 'not_started' | 'in_progress' | 'completed';

export interface PlantData {
  name: string;
  scientificName?: string;
  image?: string;
  uses: string[];
}

export interface QuizQuestion {
  q: string;
  opts: string[];
  ans: number;        // index of correct answer
  exp: string;        // explanation shown after answering
}

export interface Checkpoint {
  id: string;
  order: number;
  title: string;
  description: string;
  durationMinutes: number;
  plants: string[];
  intro: string;
  learning: string[];
  activityLabel: string;
  audioText: string;
  quiz: QuizQuestion[];
}

export interface UserProgress {
  [checkpointId: string]: CheckpointStatus;
}

export interface TourProgressContextType {
  progress: UserProgress;
  startCheckpoint: (id: string) => void;
  completeCheckpoint: (id: string) => void;
  replayCheckpoint: (id: string) => void;
  getStatus: (id: string) => CheckpointStatus;
  isUnlocked: (index: number) => boolean;
  completedCount: number;
  progressPercentage: number;
}
```

### 4.3 CheckpointCard.tsx — Alternating Layout (CRITICAL)

```tsx
interface CheckpointCardProps {
  checkpoint: Checkpoint;
  index: number;               // 0-based — determines left/right
  status: CheckpointStatus;
  isUnlocked: boolean;
  onStart: (id: string) => void;
  onViewDetails: (id: string) => void;
  onReplay: (id: string) => void;
}

// Circle on LEFT for index 0,2,4 (checkpoints 1,3,5)
// Circle on RIGHT for index 1,3,5 (checkpoints 2,4,6)
const isLeft = index % 2 === 0;
```

### 4.4 TourProgressContext.tsx

```tsx
const STORAGE_KEY = 'herb_tour_progress';

export const TourProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  });

  const save = (p: UserProgress) => {
    setProgress(p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  };

  const startCheckpoint = (id: string) => {
    if (progress[id] !== 'completed') save({ ...progress, [id]: 'in_progress' });
  };

  const completeCheckpoint = (id: string) => save({ ...progress, [id]: 'completed' });

  const isUnlocked = (idx: number) =>
    idx === 0 || progress[CHECKPOINTS[idx - 1].id] === 'completed';

  const completedCount = CHECKPOINTS.filter(c => progress[c.id] === 'completed').length;
  const progressPercentage = Math.round((completedCount / CHECKPOINTS.length) * 100);

  return (
    <TourProgressContext.Provider value={{ progress, startCheckpoint, completeCheckpoint, isUnlocked, completedCount, progressPercentage }}>
      {children}
    </TourProgressContext.Provider>
  );
};
```

---

## 5. Progress Management

### 5.1 State & Persistence

| Method | Behavior |
|--------|----------|
| `startCheckpoint(id)` | Sets status → `'in_progress'`, saves to localStorage |
| `completeCheckpoint(id)` | Sets status → `'completed'`, triggers re-render of all cards |
| `replayCheckpoint(id)` | Increments `replayCount` in localStorage, does NOT change status |
| `isUnlocked(idx)` | `true` if `idx === 0` OR `checkpoints[idx-1].status === 'completed'` |
| `getStatus(id)` | Returns current status from progress state |

### 5.2 Unlocking Logic

- Sequential only: Checkpoint N unlocks when Checkpoint N-1 is `'completed'`
- Checkpoint 1 is always unlocked (never locked)
- Progress never regresses — Replay retains `'completed'` status
- localStorage key: `'herb_tour_progress'`
- Schema: `{ "cp1": "completed", "cp2": "in_progress", "cp3": "not_started", ... }`

---

## 6. Audio Narration (Web Speech API)

No CDN audio assets required. The Web Speech API (browser TTS) narrates each checkpoint's script.

### 6.1 AudioPlayer.tsx Specification

| Feature | Implementation |
|---------|----------------|
| API | `window.speechSynthesis` + `SpeechSynthesisUtterance` |
| Rate | `0.9` (slightly slower for clarity) |
| Pitch | `1.05` (warm tone) |
| Voice | Prefer English female; fallback to first English voice |
| Play/Pause | `speechSynth.pause()` / `speechSynth.resume()` |
| Replay | `speechSynth.cancel()` → new utterance → `speechSynth.speak()` |
| Progress Bar | `setInterval` tracking elapsed time vs estimated duration |
| Duration Estimate | `audioText.length / 12` seconds (≈12 chars/sec at rate 0.9) |
| Keyboard | `Space` = play/pause, `←/→` arrow keys = seek ±5 seconds |
| Autoplay | **OFF** by default — user must click Play |
| Mute | `speechSynth.cancel()` + reset play state |

### 6.2 Audio Player UI

```
[ ▶ ]  [════════════════░░░░░░]  1:23 / 3 min  [🔊]
  ↑           ↑ seekable bar                      ↑
play/pause                                      mute
```

---

## 7. Interactive Quiz System

### 7.1 Quiz Rules

| Property | Value |
|----------|-------|
| Questions per checkpoint | 3 |
| Options per question | 4 |
| Pass threshold | 60% (2 of 3 correct) |
| On pass | Status → `'completed'`, progress bar updates, next checkpoint unlocks |
| On fail | Status stays `'in_progress'`, Retake button shown |
| Retake | Unlimited — `'completed'` status never reverts |

### 7.2 QuizActivity.tsx State Machine

```
IDLE
  → [Start Activity clicked] → QUESTION (q=0)
  → [Answer selected] → FEEDBACK (show correct/wrong + explanation)
  → [Next Question / See Results clicked] → QUESTION (q+1) or RESULTS
  → [Pass] → completeCheckpoint() called → COMPLETED banner
  → [Fail] → FAILED banner with Retake button
  → [Retake clicked] → QUESTION (q=0, score=0)
```

### 7.3 Visual Feedback

```css
.quiz-opt.correct { background: #DCFCE7; border-color: #22C55E; color: #166534; }
.quiz-opt.wrong   { background: #FEE2E2; border-color: #F87171; color: #991B1B; }
.quiz-feedback.ok  { background: #DCFCE7; color: #166534; padding: 8px 12px; border-radius: 8px; }
.quiz-feedback.bad { background: #FEE2E2; color: #991B1B; padding: 8px 12px; border-radius: 8px; }
```

---

## 8. API Endpoints (Future Backend Phase)

Frontend uses localStorage only in Phase 1. Backend endpoints for Phase 2:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/tour/checkpoints` | No | All 6 checkpoints with metadata |
| `GET` | `/api/tour/checkpoints/:id` | No | Full detail for a single checkpoint |
| `GET` | `/api/tour/progress` | Yes | Current user's progress across all checkpoints |
| `PATCH` | `/api/tour/progress/:id` | Yes | Update checkpoint status (start / complete) |
| `POST` | `/api/tour/replay/:id` | Yes | Log replay event; increments replayCount |

### 8.1 Backend Data Models (for future reference)

```typescript
// Checkpoint entity (MongoDB / PostgreSQL)
{
  id: string,
  order: number,
  title: string,
  description: string,
  durationMinutes: number,
  audioUrl: string,           // CDN URL when available
  hasInteractiveActivity: boolean,
  plantData: PlantData[]
}

// UserProgress entity
{
  userId: string,
  checkpointId: string,
  status: 'not_started' | 'in_progress' | 'completed',
  completedAt: Date | null,
  lastAccessedAt: Date,
  replayCount: number
}
```

---

## 9. Implementation Phases

### Phase 1 — Types & Data Layer
- [ ] Create `checkpointData.ts` with all 6 checkpoints (quiz Qs, audio scripts, learning points)
- [ ] Add TypeScript interfaces: `Checkpoint`, `UserProgress`, `CheckpointStatus`
- [ ] Create `TourProgressContext.tsx` with localStorage persistence
- [ ] Create `useTourProgress.ts` hook

### Phase 2 — ProgressTracker Component
- [ ] Build `ProgressTracker.tsx` with exact left/right split layout
- [ ] Wire to `TourProgressContext` for live updates
- [ ] Add ARIA attributes on progress bar

### Phase 3 — CheckpointCard Component ⭐ CRITICAL
- [ ] Implement alternating circle layout (LEFT for odd, RIGHT for even)
- [ ] Render dashed SVG/CSS connector lines between cards
- [ ] Render status badge (Completed / In Progress / Available / Locked)
- [ ] Show correct action buttons per status
- [ ] Wire `onStart`, `onViewDetails`, `onReplay` callbacks
- [ ] Add Framer Motion staggered entry animations

### Phase 4 — CheckpointDetail Modal
- [ ] Build modal overlay with sticky header
- [ ] Render Introduction, Learning Points, Featured Plants sections
- [ ] Integrate `AudioPlayer` component
- [ ] Integrate `ActivityWrapper` → `QuizActivity`
- [ ] Wire completion callback to `completeCheckpoint()`

### Phase 5 — Audio Player
- [ ] Build `AudioPlayer.tsx` with Web Speech API
- [ ] Play/Pause, progress bar with click-to-seek, timer display, mute
- [ ] Keyboard: Space, ←/→ arrows
- [ ] Replay mode resets to 0:00

### Phase 6 — Quiz Activity
- [ ] Build `QuizActivity.tsx` with 3 Qs per checkpoint
- [ ] Correct/wrong visual feedback + explanation text
- [ ] Score + pass/fail logic → completion trigger

### Phase 7 — Main Page Assembly & Routing
- [ ] Rewrite `VirtualTour.tsx`: hero + ProgressTracker + CheckpointCard list
- [ ] Wrap in `TourProgressProvider`
- [ ] Add route `/virtual-tour/:checkpointId` in `App.tsx`
- [ ] Remove old `useTours` API hook dependency

### Phase 8 — Styling & Responsiveness
- [ ] Create `virtualTour.css` with CSS custom properties
- [ ] Mobile breakpoints (320px, 768px, 1024px)
- [ ] Connector line hidden on mobile (< 600px)
- [ ] Circles move inside cards on mobile

### Phase 9 — Accessibility Audit
- [ ] All buttons: `aria-label`
- [ ] Progress bar: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Keyboard: Tab → Enter/Space on all interactive elements
- [ ] Color contrast ≥ 4.5:1 verified
- [ ] Status via text AND color (not color alone)

---

## 10. Acceptance Criteria

| # | Scenario | Expected Outcome |
|---|----------|-----------------|
| AC-01 | Visit `/virtual-tour` fresh (no localStorage) | 0% progress, only CP1 available, CP2-6 locked |
| AC-02 | Complete CP1 quiz (≥60%) | CP1 → Completed, 17%, CP2 unlocks with Start button |
| AC-03 | User with CP1+CP2 completed | 33%, two Completed cards with 3 buttons each |
| AC-04 | Click Replay on CP1 | Audio restarts 0:00, Completed badge stays, replayCount +1 |
| AC-05 | Complete all 6 checkpoints | 100% Complete, all cards Completed |
| AC-06 | Page refresh | localStorage restores exact progress state |
| AC-07 | Mobile 375px | No horizontal scroll, buttons wrap, no layout breaks |
| AC-08 | Keyboard nav | Tab through all elements, Enter/Space trigger actions |
| AC-09 | Alternating circles | Odd CPs: circle LEFT, Even CPs: circle RIGHT |
| AC-10 | Connector lines | Dashed lines visible between all consecutive cards |
| AC-11 | Locked card | No hover state, button disabled, quiz inaccessible |
| AC-12 | Modal close | ESC key and ✕ button both close modal, audio stops |

---

## 11. Open Questions & Decisions

### ✅ Decision 1 — Guest Progress via localStorage
**RESOLVED:** Guest users track progress via `localStorage` key `'herb_tour_progress'`. Authenticated users will additionally sync with the API. localStorage always acts as the local cache — no regression on logout.

### ✅ Decision 2 — Audio Narration Source
**RESOLVED:** Web Speech API (browser TTS) narrates each checkpoint's script. Full play/pause/seek/volume UI provided. Static CDN audio files can replace TTS in Phase 2 with zero component changes — swap `audioText` for `audioUrl` in the player.

### ✅ Decision 3 — Backend Scope
**RESOLVED:** Frontend-only with localStorage for Phase 1. Backend `UserProgress` model and API endpoints deferred to Phase 2. Context architecture is designed for easy API swap-in.

### ✅ Decision 4 — Alternating Circle Layout
**CONFIRMED FROM SCREENSHOT:** Circles alternate sides:
- Checkpoints 1, 3, 5 → circle on **LEFT**
- Checkpoints 2, 4, 6 → circle on **RIGHT**
- Dashed connector lines between circles link cards vertically

### ❓ Open Question — Connector Line Type
Should connector lines be CSS (`border-left: 2px dashed`) or SVG paths? CSS is simpler; SVG allows curved paths matching the screenshot's slightly curved dashes. **Recommend:** CSS dashed border for simplicity; upgrade to SVG if exact curve matching is required.

### ❓ Open Question — Mobile Circle Behavior
On narrow viewports (< 600px), the alternating circle layout breaks. Options:
1. Move circles inside the card header (inline, not absolute positioned) — **recommended**
2. Always place circles on the left at mobile
3. Hide circles on mobile, show status via badge only

---

*End of Document — Virtual Herbal Garden Tour Implementation Plan v2.0 | April 2026*
