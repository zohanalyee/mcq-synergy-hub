

# Phase 2: User Engagement & Rich Results

## Overview
Five enhancements to BoardTopicPage: structured data for Google rich results, related topics navigation, topic stats bar, practice mode buttons, and per-topic progress tracking.

---

## 1. Educational Schema (JSON-LD) on BoardTopicPage

Add a `Quiz` schema (schema.org/Quiz) injected via `<Helmet>` directly in `BoardTopicPage.tsx` when MCQs exist.

```json
{
  "@type": "Quiz",
  "name": "{Topic} MCQs - {Subject} Class {N}",
  "about": { "@type": "Thing", "name": "{Topic}" },
  "educationalLevel": "Class {N}",
  "numberOfQuestions": 50,
  "provider": { "@type": "Organization", "name": "MCQsAI" }
}
```

**File**: `src/pages/BoardTopicPage.tsx` -- add Helmet script block.

---

## 2. Related Topics Section

After the MCQ list, show a "Related Topics" grid linking to sibling topics under the same subject.

- Query `topics` table where `subject_id` matches and `id != current topic`, limit 8
- Fetch this data alongside the main query (add to existing `queryFn`)
- Render as a grid of Link cards at the bottom: `boards/{board}/class-{N}/{subject}/{topic-slug}`

**File**: Create `src/components/board-topic/RelatedTopics.tsx`, modify `BoardTopicPage.tsx` query + render.

---

## 3. Topic Stats Bar

A horizontal stats bar below the H1 showing:
- Total MCQs count (from fetched data)
- Difficulty breakdown (count Easy/Medium/Hard from fetched MCQs)
- Practice count (count from `test_attempts` where topic matches, using a separate lightweight query)

Render as small badges/pills: `📝 50 MCQs · 🟢 20 Easy · 🟡 20 Medium · 🔴 10 Hard · 👥 142 practiced`

**File**: Create `src/components/board-topic/TopicStatsBar.tsx`, use in `BoardTopicPage.tsx`.

---

## 4. Practice Mode Buttons

Add two CTA buttons above the MCQ list:
- **Quick Test (10 Qs)**: Links to `/subject/{subjectId}?topic={topic}&count=10` (existing test generation flow)
- **Full Simulation**: Links to `/subject/{subjectId}?topic={topic}&count=50&timed=true`

These leverage the existing subject test page with query params. No new routing needed.

**File**: Create `src/components/board-topic/PracticeModeButtons.tsx`, use in `BoardTopicPage.tsx`.

---

## 5. Progress Tracking (Logged-in Users)

For authenticated users, show a small card above the MCQ list:
- Query `test_attempts` where `user_id = auth.uid()` and subjects/topic matches
- Calculate: tests taken, average accuracy, last practiced date
- Show as a compact "Your Progress" card with a progress ring

Falls back gracefully to "Sign in to track progress" for anonymous users.

**File**: Create `src/components/board-topic/TopicProgressCard.tsx`, use in `BoardTopicPage.tsx`.

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/components/board-topic/RelatedTopics.tsx` |
| Create | `src/components/board-topic/TopicStatsBar.tsx` |
| Create | `src/components/board-topic/PracticeModeButtons.tsx` |
| Create | `src/components/board-topic/TopicProgressCard.tsx` |
| Modify | `src/pages/BoardTopicPage.tsx` -- add JSON-LD schema, integrate 4 new components, expand query to fetch related topics + difficulty counts |

No database changes needed. All data comes from existing `topics`, `content_items`, and `test_attempts` tables.

