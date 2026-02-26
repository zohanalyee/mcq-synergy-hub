

# Fix: Content Inventory Generation Not Saving Questions

## Problem
The `handleGenerate` and `handleBulkGenerate` functions in `ContentInventory.tsx` only pass a topic name string to the `generate-test` edge function. The edge function needs `topic_ids` (UUID array) and `subject` context to properly link and save questions to the database.

## Root Cause
Current code (line 119):
```
body: { topic: item.display_name, difficulty: 'mixed', question_count: 20, mode: 'bank_only', forceNew: true }
```
Missing: `topic_ids`, `subject` -- required by the edge function for proper DB linkage.

## Fix

### File: `src/components/admin/analytics/ContentInventory.tsx`

**`handleGenerate` (lines 113-132):**
Before invoking `generate-test`, query the `topics` table to resolve matching topic UUIDs and subject name:
1. Query `topics` with joined `subjects` using `ilike('name', item.display_name)`
2. Collect all matching topic IDs into an array
3. Pass `topic_ids`, `topic`, `subject`, and increased `question_count` (50 for better coverage) to the edge function
4. Update success toast to show cross-board count

**`handleBulkGenerate` (lines 134-155):**
Apply the same topic resolution pattern per item in the loop:
1. Resolve topic IDs and subject for each target item
2. Skip items with no matching topics
3. Pass proper parameters including `topic_ids` and `subject`
4. Use 50 questions for empty topics, 30 for low topics
5. Add 2-second delay between generations to avoid rate limiting

## Technical Details

Both functions add this query before the `generate-test` invocation:
```typescript
const { data: matchingTopics } = await supabase
  .from('topics')
  .select('id, name, subject_id, subjects(id, name)')
  .ilike('name', item.display_name);
```

Then pass the resolved data:
```typescript
body: {
  topic_ids: matchingTopics.map(t => t.id),
  topic: item.display_name,
  subject: matchingTopics[0].subjects?.name,
  difficulty: 'mixed',
  question_count: 50,
  mode: 'bank_only',
  forceNew: true,
}
```

No database migration needed. No edge function changes needed. Single file modification.

