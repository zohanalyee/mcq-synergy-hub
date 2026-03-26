

# Data Visibility & Admin Override Fix

## Problem
The MCQ query on BoardTopicPage hardcodes `.eq('status', 'approved')`, hiding any pending/draft MCQs. Admins cannot verify if data exists but is unapproved.

## Changes

### `src/pages/BoardTopicPage.tsx`

1. **Admin sees all statuses**: Remove `.eq('status', 'approved')` when user is admin. Add `isAdmin` from `useUserRole()` into the query key and pass it into the queryFn.

2. **Show unapproved count message**: After fetching, split MCQs into approved vs unapproved. For admins, show all. For non-admins, show only approved. When admin sees unapproved MCQs, display a warning banner: "X questions found but not approved yet" with status badges.

3. **Add status badge on each MCQ card for admins**: Show a small colored badge (pending=amber, rejected=red) next to the question number when admin is viewing.

4. **Enhanced debug info**: Add `mcqTotalCount` (before status filter) and `mcqApprovedCount` to the debug panel so admins can see the breakdown.

5. **Canonical slug matching verification**: In the fallback branch (when `topic` is null and query uses `canonical_topic_name`), log the slug being compared in the debug info so admins can verify if it matches.

### Concrete code changes

**Query modification** (line ~107-114):
```typescript
// For admins, fetch all statuses; for public, only approved
let mcqQuery = supabase
  .from('content_items')
  .select('id, title, options, correct_option, explanation, difficulty, status')
  .eq('category', 'mcq')
  .limit(50);

if (!isAdmin) {
  mcqQuery = mcqQuery.eq('status', 'approved');
}
```

**Warning banner** (in the empty/results section):
- Count unapproved: `mcqs.filter(m => m.status !== 'approved').length`
- Show amber alert: "{N} questions exist but are not approved yet"

**Debug panel enhancement**:
- Show `canonicalSlugUsed` when topic falls back to canonical matching
- Show total vs approved count breakdown

## Files Modified
- `src/pages/BoardTopicPage.tsx` — admin status bypass, unapproved warning, enhanced debug

No database changes needed.

