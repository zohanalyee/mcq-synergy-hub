
# UI/UX Finalization Plan

## Overview
This plan addresses 7 UI/UX gaps to make the LMS + RAG system transparent, trustworthy, and admin-friendly. No backend logic changes are required - all data sources already exist.

---

## Task 1: RAG Visibility in LMS (HIGH PRIORITY)

### Current State
- `TopicList.tsx` shows basic topic info (name, description, delete button)
- `LevelManager.tsx` shows subjects with topic counts but no RAG status
- No visibility into which topics have PDFs uploaded and processed

### Implementation

**File: `src/components/admin/topic/TopicList.tsx`**
- Add new column "RAG Status" to the table
- Fetch document counts per topic using a new query
- Display status badges:
  - Green badge with checkmark: "RAG Ready" (has completed documents)
  - Gray badge: "No Documents"
- Add tooltip showing: "X PDFs · Y chunks indexed"

**File: `src/services/lmsStructureService.ts`**
- Add new function `getTopicsWithRAGStatus(subjectId)` that joins topics with documents table
- Returns topic list with `documentCount` and `chunkCount` for each

**UI Design:**
```text
| Title      | Content Preview    | RAG Status        | Actions |
|------------|-------------------|-------------------|---------|
| Mechanics  | Physics topic...  | 🟢 RAG Ready (2)  | [🗑️]    |
| Thermody...| Heat transfer...  | ⚪ No Documents   | [🗑️]    |
```

### Estimated Effort: 2-3 hours

---

## Task 2: Auto-Fill Status Panel (HIGH PRIORITY)

### Current State
- `AutoFillDashboard.tsx` shows: daily quota, content gaps, enable/disable toggle
- `AutoFillSettings.tsx` has: manual run button, today's usage stats
- Missing: Last run time, next scheduled run indicator

### Implementation

**File: `src/components/admin/auto-fill/AutoFillDashboard.tsx`**
- Add new card: "Scheduler Status"
  - Last run time (from `ai_usage_logs` latest auto_fill entry)
  - Questions generated today
  - Questions skipped (topics already full)
  - Daily quota usage bar (already exists, enhance visibility)
  - Next scheduled run: "2:00 AM UTC" (static since pg_cron runs at 2 AM)
  - "Run Auto-Fill Now" button (move from Settings for visibility)

**File: `src/services/autoFillService.ts`**
- Add `getLastAutoFillRun()` function to fetch latest auto_fill log entry
- Add `getAutoFillSummary()` for a combined stats object

**UI Design:**
```text
┌─────────────────────────────────────────────────────┐
│ ⏰ Scheduler Status                                  │
├─────────────────────────────────────────────────────┤
│ Last Run: 2:03 AM · 45 min ago                       │
│ Generated: 38 questions · Skipped: 12 topics         │
│ Next Run: 2:00 AM UTC (in 14 hours)                  │
│                                                      │
│ Daily Quota: ████████░░ 38/50 (76%)                  │
│                                                      │
│ [▶ Run Auto-Fill Now]                                │
└─────────────────────────────────────────────────────┘
```

### Estimated Effort: 1-2 hours

---

## Task 3: Manual "Generate from RAG" Button (Per Topic)

### Current State
- `DocumentLibrary.tsx` has "Generate MCQs" button per document
- No per-topic generation option in `TopicList.tsx` or `TopicManager.tsx`
- `generateForTopic()` in `autoFillService.ts` already supports topic-based generation

### Implementation

**File: `src/components/admin/topic/TopicList.tsx`**
- Add new action button: sparkles icon "Generate MCQs"
- Only show if user is admin and topic has RAG documents
- On click, open modal dialog with:
  - Difficulty selector (Easy/Medium/Hard dropdown)
  - Count slider (1-5, default 5)
  - Generate button with progress indicator
- Call `generateForTopic()` from autoFillService

**New File: `src/components/admin/topic/GenerateFromRAGDialog.tsx`**
- Modal component with:
  - Topic name display
  - Difficulty dropdown
  - Count slider (max 5 for safety)
  - Progress state and result feedback
  - Success: "Generated X questions from course material"
  - Error: Display specific error message

**UI Design:**
```text
┌────────────────────────────────────────┐
│ 🧠 Generate MCQs from Course Material  │
├────────────────────────────────────────┤
│ Topic: Mechanics                        │
│                                         │
│ Difficulty: [Easy ▼]                    │
│ Count:      [●●●●●] 5 questions         │
│                                         │
│ [Cancel]              [✨ Generate]     │
└────────────────────────────────────────┘
```

### Estimated Effort: 2 hours

---

## Task 4: MCQ Source Labels (Transparency)

### Current State
- `QuestionBankTable.tsx` shows: question, category, subject/topic, difficulty, date
- No source_type indicator
- `content_items.source_type` values: 'manual', 'ai_generated', 'rag_generated', null

### Implementation

**File: `src/components/admin/question-bank/QuestionBankTable.tsx`**
- Add new column "Source" after "Difficulty"
- Display badge based on `source_type`:
  - `rag_generated` / `rag`: "📚 From Book" (green badge)
  - `ai_generated` / `auto_fill`: "🤖 AI Generated" (blue badge)
  - `manual` / null / other: "✍️ Manual" (gray badge)
- Add tooltip explaining source

**File: `src/pages/TestSession.tsx`**
- In results view, show source badge per question
- Use same badge logic as QuestionBankTable
- Already has `getSourceBadge()` for test source - extend to question-level

**File: `src/interfaces/content.ts`**
- Add `source_type?: 'manual' | 'ai_generated' | 'rag_generated' | 'auto_fill'` to ContentItem interface

**UI Design (Question Bank):**
```text
| Question        | Category | Subject/Topic | Difficulty | Source       | Added    |
|-----------------|----------|---------------|------------|--------------|----------|
| What is...      | MCQ      | Physics/Mech  | Medium     | 📚 From Book | 2h ago   |
| Calculate the...| MCQ      | Math/Algebra  | Hard       | 🤖 AI Gen    | Just now |
```

### Estimated Effort: 1-2 hours

---

## Task 5: Syllabus Builder - Better User Feedback

### Current State
- `SyllabusBuilder.tsx` has toast messages but they're brief
- Already shows: "Test Ready!", "Not Enough Questions", "Generating from Course Materials"
- Missing: Breakdown of question sources (X from DB, Y from RAG)

### Implementation

**File: `src/components/syllabus-builder/SyllabusBuilder.tsx`**
- Enhance toast messages with more detail:

**When DB questions are sufficient:**
```typescript
toast({
  title: "Test Ready!",
  description: `${questions.length} questions loaded from Question Bank.`,
  duration: 5000
});
```

**When partial (admin RAG generation):**
```typescript
toast({
  title: "Test Created!",
  description: `${dbCount} from Question Bank + ${ragCount} generated from course material.`
});
```

**When blocked (no RAG documents):**
```typescript
toast({
  title: "Not Enough Questions",
  description: `Only ${available} questions available. This topic has no uploaded study material.`,
  variant: "destructive"
});
```

**New UI Element: Generation Progress Modal**
- Show step-by-step progress during generation:
  1. "Checking Question Bank..." ✓
  2. "Found 12 questions (need 20)"
  3. "Generating 8 from course material..."
  4. "Complete! Test ready."

### Estimated Effort: 1 hour

---

## Task 6: Auto-Fill Settings UX Polish (MEDIUM)

### Current State
- `AutoFillSettings.tsx` already has:
  - Enable/disable toggle
  - Safety warning about limits
  - Today's usage display
  - Manual run button
- Missing: Visual quota exhausted warning, clearer status text

### Implementation

**File: `src/components/admin/auto-fill/AutoFillSettings.tsx`**
- Add pulsing warning badge when quota > 90%
- Add "Quota Exhausted" banner when remaining = 0
- Improve enable/disable toggle with status description:
  - Enabled: "Auto-fill will run at 2:00 AM UTC"
  - Disabled: "Auto-fill is paused"

**File: `src/components/admin/auto-fill/AutoFillDashboard.tsx`**
- Add warning banner when quota is exhausted:
```typescript
{usage?.remaining_requests === 0 && (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Daily Quota Exhausted</AlertTitle>
    <AlertDescription>
      Auto-fill will resume tomorrow at 2:00 AM UTC.
    </AlertDescription>
  </Alert>
)}
```

### Estimated Effort: 30 minutes

---

## Task 7: Jobs & Scholarships Review Queue (LOW)

### Current State
- `ExternalCuration.tsx` has Pending/Approved/Rejected tabs
- Has approve/reject buttons
- Has webhook info banner
- Missing: Duplicate indicator

### Implementation

**File: `src/pages/admin/ExternalCuration.tsx`**
- Add duplicate detection badge to OpportunityCard
- Query for existing opportunities with same `apply_url` in approved status
- Show badge: "⚠️ Duplicate URL" if match found

**File: `src/services/externalOpportunitiesService.ts`**
- Add `checkDuplicateUrl(applyUrl)` function
- Or enhance `getExternalOpportunities()` to return duplicate flag

**UI Design:**
```text
┌──────────────────────────────────────────┐
│ [Job] [Daily News]                        │
│ Software Engineer Position                │
│ ⚠️ Duplicate URL (approved)               │  ← NEW
│                                           │
│ 🏢 Tech Company                           │
│ 📍 Karachi                                │
│ 📅 Deadline: Feb 28, 2026                 │
│                                           │
│ [✓ Approve]  [✗ Reject]                   │
└──────────────────────────────────────────┘
```

### Estimated Effort: 1 hour

---

## Summary

| Task | Priority | Effort | Files to Modify |
|------|----------|--------|-----------------|
| 1. RAG Visibility in Topics | HIGH | 2-3h | TopicList.tsx, lmsStructureService.ts |
| 2. Auto-Fill Status Panel | HIGH | 1-2h | AutoFillDashboard.tsx, autoFillService.ts |
| 3. Manual RAG Generation | HIGH | 2h | TopicList.tsx, GenerateFromRAGDialog.tsx (new) |
| 4. MCQ Source Labels | MEDIUM | 1-2h | QuestionBankTable.tsx, TestSession.tsx, content.ts |
| 5. Syllabus Builder Feedback | MEDIUM | 1h | SyllabusBuilder.tsx |
| 6. Auto-Fill Settings Polish | LOW | 30m | AutoFillSettings.tsx, AutoFillDashboard.tsx |
| 7. Duplicate Indicator | LOW | 1h | ExternalCuration.tsx, externalOpportunitiesService.ts |

**Total Estimated Effort: 8-11 hours**

---

## Dependencies & Assumptions

### Backend Assumptions (Verified)
- `content_items.source_type` column exists and is populated
- `documents` table has `topic_id` linking to LMS topics
- `document_sections` stores chunk count per document
- `ai_usage_logs` tracks auto_fill runs with timestamps

### No Backend Changes Required
All data sources already exist. This is purely UI work.

### Recommended Execution Order
1. Task 4 (MCQ Source Labels) - Quick win, improves transparency immediately
2. Task 1 (RAG Visibility) - Critical for admin understanding
3. Task 3 (Manual RAG Generation) - Enables admin control
4. Task 2 (Auto-Fill Status) - Enhances monitoring
5. Task 5 (Syllabus Feedback) - Better UX
6. Task 6 (Settings Polish) - Minor improvements
7. Task 7 (Duplicate Indicator) - Low priority cleanup
