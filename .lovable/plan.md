

# Phase 1: Programmatic SEO & Dynamic Routing

## Overview
Create a new dynamic nested route `/boards/:board/class-:classNumber/:subject/:topic` that renders MCQs from the existing `content_items` table, with full SEO automation and breadcrumb support.

---

## Route Structure

```text
/boards/:boardSlug/class-:classNumber/:subjectSlug/:topicSlug
```

Examples:
- `/boards/sindh-board/class-9/biology/cell-structure`
- `/boards/federal-board/class-10/physics/kinematics`

Each segment maps to the existing LMS hierarchy: `educational_systems` → `levels` → `subjects` → `topics`.

---

## Implementation

### 1. New Page: `src/pages/BoardTopicPage.tsx`
- Extract URL params (`boardSlug`, `classNumber`, `subjectSlug`, `topicSlug`)
- Convert slugs back to names (e.g., `sindh-board` → `Sindh Board`) via Supabase queries joining `educational_systems` → `levels` → `subjects` → `topics`
- Fetch approved MCQs from `content_items` matching the resolved `topic_id` (or `canonical_topic_name` fallback)
- Render MCQ practice cards (reuse existing `PracticeMCQCard` component)

### 2. SEO Automation
- Dynamic `SEOHead` with formula:
  - **Title**: `{Topic} MCQs - {Subject} Class {ClassNumber} | {Board} | MCQsAI`
  - **Description**: `Practice {Topic} MCQs for {Subject} Class {ClassNumber} ({Board}). Free online preparation with explanations.`
  - **Keywords**: `{topic} MCQs, {subject} class {classNumber}, {board} preparation`

### 3. Dynamic Breadcrumbs
```text
Home > Boards > {Board} > Class {N} > {Subject} > {Topic}
```
Using the existing `PageBreadcrumb` component with items built from URL params.

### 4. Empty State
When zero MCQs exist for a topic, show a styled empty state with:
- Message: "No MCQs available for {Topic} yet"
- A "Generate Practice Test with AI" button (links to `/subject/:subjectId?topic={topicName}` to leverage existing AI generation flow)

### 5. Boards Index Page: `src/pages/Boards.tsx`
A simple listing page at `/boards` showing all active educational systems as cards, each linking to their levels. This serves as the SEO landing page for board-based navigation.

### 6. Route Registration
Add to `App.tsx`:
```
/boards → Boards index
/boards/:boardSlug/class-:classNumber/:subjectSlug/:topicSlug → BoardTopicPage
```

### 7. Sitemap Update
Add `/boards` to `public/sitemap.xml`. Individual topic pages are dynamic and would need a server-side sitemap generator in the future (out of scope).

---

## Slug Utility
Create `src/lib/slugUtils.ts` with:
- `toSlug(name)`: converts "Sindh Board" → "sindh-board"
- `fromSlug(slug)`: converts "sindh-board" → "Sindh Board" (capitalize words, replace hyphens)

The DB lookup uses `ILIKE` matching on the unslugified name to handle edge cases.

---

## Files

| Action | File |
|--------|------|
| Create | `src/lib/slugUtils.ts` |
| Create | `src/pages/Boards.tsx` |
| Create | `src/pages/BoardTopicPage.tsx` |
| Modify | `src/App.tsx` — add 2 new routes |
| Modify | `public/sitemap.xml` — add `/boards` |
| Modify | `src/components/Footer.tsx` — add Boards link |

No database changes needed — all data comes from existing `educational_systems`, `levels`, `subjects`, `topics`, and `content_items` tables.

