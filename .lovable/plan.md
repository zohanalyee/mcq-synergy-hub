

## Plan: Fix Floating Bar Position & Add Per-Topic Question Selector

### Problem
1. The floating bar sits at `bottom-4` but the mobile nav is `fixed bottom-0 z-50` with `h-16` (64px), so the bar gets hidden behind it.
2. User wants per-topic question count control via a modal triggered from the floating bar.

### Changes

#### 1. Fix position in `FloatingActionBar.tsx`
- Change `bottom-4` to `bottom-20` (80px) so it clears the 64px mobile nav + gap
- On desktop (no bottom nav), keep it lower: `lg:bottom-8`
- z-index `z-[100]` already exceeds nav's `z-50` — no change needed

#### 2. Make bar more compact (already mostly done)
- Current bar is already compact with `h-7` elements and `px-3 py-2`. Minor tweaks only if needed.

#### 3. Create `TopicsSelectorModal.tsx`
- New dialog component showing all selected topics grouped by subject
- Each topic row: checkbox + topic name + available Qs badge + stepper (−/input/+) for question count
- Footer: total topics, total questions, Cancel/Apply buttons
- Select All / Deselect All quick actions

#### 4. Wire modal into `FloatingActionBar.tsx`
- Make the Topics badge (`{selectedTopicsCount}T`) clickable — opens the modal
- Add a small settings icon on the badge to hint at interactivity
- Pass selected subjects/topics data and question counts

#### 5. Wire state in `SyllabusBuilder.tsx`
- Add `perTopicQuestionCounts` state: `Record<string, number>` (topicId → count, default 5)
- Pass to FloatingActionBar along with the full topic/subject data needed for the modal
- When modal applies, update the per-topic counts and use them in `handleGenerateQuiz`
- Update `quizSettings.questionsCount` to reflect the sum of per-topic counts when customized

### Files
- **Edit**: `src/components/syllabus-builder/FloatingActionBar.tsx` — fix `bottom-20`, add modal trigger
- **Create**: `src/components/syllabus-builder/TopicsSelectorModal.tsx` — per-topic question count modal
- **Edit**: `src/components/syllabus-builder/SyllabusBuilder.tsx` — add per-topic state, pass data, update generation logic

