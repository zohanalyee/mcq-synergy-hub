

## Plan: Auto-Load Practice Test & Enable AI Fallback on SubjectContent Page

### What Changes

**1. `src/pages/SubjectContent.tsx`**
- Change default `studyMode` from `"read"` to `"practice"` — subjects open in practice mode by default so users can immediately attempt questions
- Re-enable `handleGenerateNew`: instead of showing "AI unavailable" toast, call `loadMCQs(true, false)` which triggers AI generation when bank is empty
- Update `loadMCQs`: when `fetchOnly=false` (Generate New), set `fetch_only: false` and `forceNew: true` so the edge function uses the Smart Hybrid flow (bank first → AI fallback)
- "Refresh" button keeps current behavior: `loadMCQs(false, true)` — re-fetches from bank only, shuffled
- On mount, keep `loadMCQs(false, true)` — auto-loads whatever is in the bank (no AI cost)

**2. `src/components/subject-content/MCQControls.tsx`**
- Update "Generate New" button label to "Generate New" with a subtle AI indicator
- No structural changes needed — it already has the button wired up

### Flow Summary
- **Open subject** → auto-fetch from question bank (all topics, 20 questions, Medium)
- **Practice Mode** (default): click options to reveal right/wrong
- **Read Mode**: correct answers highlighted, no interaction
- **Refresh**: re-fetch from bank with current filter settings
- **Generate New**: triggers AI generation for missing questions, saves to bank
- **Topic/Difficulty/Count filters**: work as today, re-fetch from bank

### Files Modified
- `src/pages/SubjectContent.tsx` — default mode + re-enable AI generation path

