

# Plan: Enhanced Content Inventory Dashboard + Smart Topic Linking

## What This Does

Replaces the existing basic Content Inventory (which only groups by subject/topic text) with a full LMS-aware inventory dashboard that shows statistics across boards/classes, identifies duplicate topics shared across boards, and enables bulk generation for low-inventory topics. Also adds a `canonical_topic_name` column for cross-board question sharing.

---

## Part 1: Database Changes

### 1a. New column on `content_items`

Add `canonical_topic_name TEXT` column with an index for fast lookups on approved MCQs. Backfill existing rows by normalizing the `topic` column (lowercase, replace non-alphanumeric with hyphens).

### 1b. New RPC: `get_topic_inventory`

Replace the simple `get_content_inventory_stats` with a new function `get_topic_inventory(board_filter, class_filter, subject_filter)` that:
- Joins topics -> subjects -> levels -> educational_systems (full LMS hierarchy)
- Counts approved MCQs per canonical topic name (matching by `topic_id` OR `canonical_topic_name`)
- Groups by canonical name to show cross-board statistics (how many boards share that topic)
- Returns: `canonical_name`, `display_name`, `subject_name`, `board_count`, `board_names`, `total_questions`, `status` (good >= 100, low 50-99, empty < 50)
- Filters by board/class/subject when provided

---

## Part 2: Enhanced ContentInventory Component

**File: `src/components/admin/analytics/ContentInventory.tsx`** (full rewrite)

Replace the existing accordion-based view with a flat table dashboard:

- **Filter bar**: Board, Class, Subject, and Status dropdowns (populated from `educational_systems`, `levels`, `subjects`)
- **Summary cards**: Total Questions, Total Topics, Low Content count, Empty count
- **Main table** with columns: Topic, Subject, Boards (badge with tooltip showing board names), Questions, Status (color-coded badges: green Good, amber Low, red Empty), Actions (Generate button)
- **Bulk action buttons**: "Generate for All Low Topics" and "Generate for All Empty Topics"
- Generate button triggers the existing `generate-test` edge function for the selected topic (reuses AIContentFactory logic)

---

## Part 3: Smart Topic Linking in Edge Function

**File: `supabase/functions/generate-test/index.ts`**

When saving questions in `saveQuestionsInBackground`, compute and store `canonical_topic_name`:
```
canonical_topic_name = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
```

This is a one-line addition to the `questionData` object (around line 559).

---

## Part 4: Query Functions Use Canonical Names

**File: `src/services/syllabusRAGFallback.ts`**

In `fetchQuestionsForTopic`, add a third query path: if `topic_id` and `topic name` queries return insufficient results, also query by `canonical_topic_name` matching. This enables cross-board question sharing automatically.

---

## Part 5: AIContentFactory Topic Stats Enhancement

**File: `src/components/admin/AIContentFactory.tsx`**

Update the topic stats section (lines 92-109) to also show:
- How many boards share this topic
- A note that "Questions generated will be available across all boards with this topic"

Query using the canonical name to get cross-board count.

---

## Technical Details

### Files Modified

| File | Change |
|---|---|
| `src/components/admin/analytics/ContentInventory.tsx` | Full rewrite with filters, table, bulk actions |
| `src/components/admin/AIContentFactory.tsx` | Add cross-board stats display |
| `supabase/functions/generate-test/index.ts` | Save `canonical_topic_name` on insert |
| `src/services/syllabusRAGFallback.ts` | Add canonical name fallback query |

### Database Migration

1. `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS canonical_topic_name TEXT`
2. `CREATE INDEX idx_content_items_canonical ON content_items(canonical_topic_name) WHERE status = 'approved' AND category = 'mcq'`
3. Backfill: `UPDATE content_items SET canonical_topic_name = ... WHERE topic IS NOT NULL AND canonical_topic_name IS NULL`
4. Create `get_topic_inventory()` RPC function

### No New Files

The existing `ContentInventory.tsx` is rewritten in place. No new components needed.

### Implementation Order

1. Database migration (column + index + backfill + RPC)
2. Update edge function to save canonical names
3. Rewrite ContentInventory component
4. Update syllabusRAGFallback for canonical queries
5. Update AIContentFactory stats display

