
# Student Exam Interface: Focus Mode & Gamification

## Overview
This plan redesigns the existing `TestSession.tsx` page into a premium, distraction-free exam interface with a "Neural Focus" music player, live motivation engine, crash protection via localStorage, and a responsive Question Palette (sidebar on desktop, Sheet drawer on mobile). The existing gamification system (`processTestCompletion`, badges, confetti) is preserved and extended with in-session motivational triggers.

---

## Architecture

The current `TestSession.tsx` (742 lines) will be refactored into smaller, focused components:

```text
src/pages/TestSession.tsx (orchestrator - slimmed down)
  |
  +-- src/components/exam/ExamHeader.tsx         (timer, progress, music toggle)
  +-- src/components/exam/QuestionCard.tsx        (question text + option cards)
  +-- src/components/exam/QuestionPalette.tsx     (grid: answered/skipped/review)
  +-- src/components/exam/ExamNavBar.tsx          (prev / mark / next buttons)
  +-- src/components/exam/NeuralFocusPlayer.tsx   (mini music widget)
  +-- src/components/exam/useExamMotivation.tsx   (streak/milestone/speed toasts)
  +-- src/components/exam/useExamPersistence.tsx  (localStorage crash protection)
```

---

## Task 1: Page Layout & Visual Style (Deep Blue Glassmorphism)

### ExamHeader.tsx
- Sticky top bar with glass effect (`glass-card backdrop-blur-xl`)
- Left: Session name (truncated)
- Center: Progress bar (using existing `Progress` component, `h-1.5`)
- Right: Countdown timer badge + Music toggle button
- Timer turns red (`text-red-500 animate-pulse`) when under 60 seconds

### QuestionCard.tsx
- Large card with glassmorphism (`glass-card rounded-2xl`)
- Question text: `text-base sm:text-lg font-semibold` with scrollable area for long questions
- 4 Option Cards rendered as individual interactive cards (not radio buttons):
  - Default: `glass-card border border-border/50 hover:border-primary/30`
  - Selected: `ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/50` (glowing blue border)
  - Each card has option letter (A/B/C/D) badge on left
- Flag button in top-right corner of question card

### QuestionPalette.tsx
- Grid of numbered buttons showing status:
  - Answered: Green (`bg-emerald-500 text-white`)
  - Skipped/Unanswered: Red (`bg-red-500/20 text-red-500 border border-red-500/30`)
  - Marked for Review: Orange (`bg-orange-500 text-white`)
  - Current: Blue ring (`ring-2 ring-blue-500`)
- **Desktop**: Rendered as a sidebar card on the right (`w-64`)
- **Mobile**: Hidden by default, accessible via a floating button that opens a `Sheet` (bottom drawer)
- Legend row at bottom showing color meanings

### ExamNavBar.tsx
- Fixed sticky bottom bar (`sticky bottom-0 bg-background/95 backdrop-blur-sm`)
- Three buttons:
  - Previous (outline, left arrow)
  - Mark for Review (orange outline, flag icon)
  - Next / Submit (primary, right arrow)
- Submit only shows on last question

### Layout Structure
```text
Desktop:
+----------------------------------------------+
| ExamHeader (sticky top)                       |
+----------------------------------------------+
| QuestionCard (flex-1)    | QuestionPalette    |
|                          | (sidebar, w-64)    |
+----------------------------------------------+
| ExamNavBar (sticky bottom)                    |
+----------------------------------------------+

Mobile:
+----------------------------------------------+
| ExamHeader (sticky top)                       |
+----------------------------------------------+
| QuestionCard (full width)                     |
+----------------------------------------------+
| ExamNavBar (sticky bottom)                    |
|  + Floating palette trigger button            |
+----------------------------------------------+
```

---

## Task 2: Neural Focus Music Player

### NeuralFocusPlayer.tsx
- Collapsible mini widget anchored top-right (below header)
- Uses HTML5 `<audio>` element with free ambient audio URLs
- Three preset playlists as buttons/chips:
  - "Deep Focus" - binaural beats
  - "Lo-Fi Beats" - lo-fi hip hop
  - "Rain Sounds" - nature ambient
- Audio sources: Free royalty-free MP3 URLs from public sources (e.g., Pixabay audio)
- Minimal controls:
  - Play/Pause button (icon toggle)
  - Volume slider (small, horizontal)
  - No visible video/waveform
- Collapsed state: Just a small music icon button
- Expanded state: Glass panel with playlist chips + controls
- State persisted in component (not localStorage -- music should stop on page leave)

### Technical Notes
- No external dependencies needed -- pure HTML5 Audio API
- Audio element created via `useRef<HTMLAudioElement>`
- Volume controlled via `audio.volume` property
- Playlist URLs stored as constants (can be updated later)

---

## Task 3: Live Motivation Engine (Gamification)

### useExamMotivation.tsx (Custom Hook)
Tracks in-session performance and triggers motivational toasts:

**Streak Detection:**
- Track timestamps of each answer
- If 3+ consecutive answers within 2 minutes total: trigger "On Fire! 3 in a row!" toast
- Uses `sonner` toast at bottom-center, auto-dismiss 3 seconds
- Visual: Fire emoji + bold text

**Milestone Detection:**
- At 25% completion: "Great start! Keep it up!"
- At 50% completion: "Halfway there! Keep pushing!"
- At 75% completion: "Almost done! Finish strong!"
- Each milestone triggers only once per session (tracked via `Set<number>`)

**Speed Detection:**
- If answer given within 10 seconds of arriving at question: "Speedster!" toast
- Track `questionArrivalTime` via `useRef<number>`
- Throttled: max 1 speed toast per 5 questions

**Toast Styling:**
- Position: bottom-center
- Duration: 2-3 seconds
- Non-intrusive: small, transparent glass style
- Uses `sonner` toast (already configured in App.tsx)

---

## Task 4: Crash Protection (localStorage Sync)

### useExamPersistence.tsx (Custom Hook)
- **Save on every interaction:**
  - `currentQuestion` index
  - `answers` object (Record of question index to selected answer)
  - `flaggedQuestions` Set (serialized as array)
  - `timeRemaining` (saved every 5 seconds, not every tick)
- **Storage key:** `exam-state-{sessionId}`
- **On mount:** Check if localStorage has saved state for this session ID
  - If found and `isSubmitted` is false: restore state
  - Show toast: "Session restored from where you left off"
- **On submit:** Clear the localStorage entry
- **On unmount:** Save final state (for accidental navigation)

### Auto-Submit (Timer)
- Already exists in current code (lines 302-316)
- Will be preserved: when `timeRemaining` hits 0, `handleSubmit()` is called
- Enhancement: Show a 10-second warning toast before auto-submit

---

## Task 5: Results Screen Enhancement
- The existing results view (score display, SmartFeedbackCard, answer review) is preserved unchanged
- The `processTestCompletion()` call is preserved (handles badges, streaks, confetti)
- No changes to the results/post-submission flow

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/exam/ExamHeader.tsx` | Sticky header with timer, progress, music toggle |
| `src/components/exam/QuestionCard.tsx` | Question display with interactive option cards |
| `src/components/exam/QuestionPalette.tsx` | Question grid sidebar (desktop) / Sheet (mobile) |
| `src/components/exam/ExamNavBar.tsx` | Bottom navigation (prev/mark/next/submit) |
| `src/components/exam/NeuralFocusPlayer.tsx` | Collapsible music player widget |
| `src/components/exam/useExamMotivation.ts` | Streak/milestone/speed toast hook |
| `src/components/exam/useExamPersistence.ts` | localStorage save/restore hook |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/TestSession.tsx` | Refactor to use new components; keep data fetching, submit logic, results view |
| `src/index.css` | Add exam-specific utility classes (option card glow, palette colors) |

## No Changes Needed
- `App.tsx` (route already exists: `/test-session/:id`)
- `gamification.ts` (processTestCompletion stays as-is)
- `SmartFeedbackCard.tsx` (unchanged)
- Database schema (no changes)
- Edge Functions (no changes)

---

## Technical Details

### Option Card Selection (replacing RadioGroup)
```typescript
// Current: RadioGroup with RadioGroupItem
// New: Interactive cards with click handler
<div
  onClick={() => handleAnswerChange(currentQuestion, option)}
  className={cn(
    "glass-card rounded-xl p-3 cursor-pointer transition-all duration-200",
    "border hover:border-primary/30 hover:shadow-md",
    answers[currentQuestion] === option
      ? "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
      : "border-border/50"
  )}
>
  <div className="flex items-center gap-3">
    <Badge className="h-7 w-7 rounded-lg shrink-0">
      {String.fromCharCode(65 + idx)}
    </Badge>
    <span className="text-sm">{option}</span>
  </div>
</div>
```

### localStorage Persistence Format
```typescript
interface ExamPersistState {
  currentQuestion: number;
  answers: Record<number, string>;
  flaggedQuestions: number[];
  timeRemaining: number;
  savedAt: number; // timestamp
}
// Key: `exam-state-${sessionId}`
```

### Desktop Layout (Two-Column)
```typescript
<div className="flex gap-4">
  {/* Main question area */}
  <div className="flex-1 min-w-0">
    <QuestionCard ... />
    <ExamNavBar ... />
  </div>
  {/* Desktop sidebar palette */}
  <div className="hidden lg:block w-64 shrink-0">
    <QuestionPalette ... />
  </div>
</div>
```

### Music Player Audio Sources
Pre-configured with placeholder URLs that can be swapped for real ones:
- Deep Focus: ambient binaural beats track
- Lo-Fi Beats: lo-fi study music
- Rain Sounds: nature rain ambience
- Sources: royalty-free audio from public URLs

### Header Behavior During Exam
- The main app Header is still rendered (provides sidebar access)
- ExamHeader sits below it as a secondary sticky bar
- On mobile, MobileBottomNav is still visible but ExamNavBar takes priority visually
