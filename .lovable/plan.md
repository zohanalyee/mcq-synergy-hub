

# Fix Plan: 3 Critical UX Bugs

## Bug 1: AI Content Studio Modal Closes on Outside Click

**Problem**: `<DialogContent>` in `ManualOpportunityCreator.tsx` (line 186) has no protection against accidental outside clicks, wiping all entered data.

**Fix**: Add `onInteractOutside` and `onPointerDownOutside` event prevention to the `<DialogContent>` element.

**File**: `src/components/admin/ManualOpportunityCreator.tsx`
- Line 186: Add `onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}` to `<DialogContent>`

---

## Bug 2: No Way to Edit/Delete Published External Opportunities

**Problem**: Once items are approved in `external_opportunities`, there is no admin UI to manage them. The existing `OpportunityReviewQueue` only shows `status = 'pending'`.

**Fix**: Create a new `PublishedOpportunitiesManager` component and add it as a new "Published" sub-tab inside the Agent Dashboard Review tab area.

**New file**: `src/components/admin/PublishedOpportunitiesManager.tsx`
- Fetches `external_opportunities` where `status = 'approved'`, ordered by `created_at` desc
- Displays a data table with columns: Title, Type, Organization, Deadline, Actions
- Edit button opens a dialog pre-filled with all fields (title, description, organization, deadline, location, apply_url, image_url, document_url, type-specific fields)
- Delete button with confirmation dialog, calls `supabase.from('external_opportunities').delete().eq('id', id)`
- Search/filter by type (job/scholarship/tender/board_result)
- Uses React Query with key `['published-opportunities']`

**Modified file**: `src/components/admin/AgentDashboard.tsx`
- Import `PublishedOpportunitiesManager`
- Add a sub-tab system inside the Review `TabsContent` with two sections: "Pending Review" (existing) and "Published Content" (new manager)
- Or simpler: add the `PublishedOpportunitiesManager` component below the `OpportunityReviewQueue` in the review tab, separated by a heading

---

## Bug 3: Bulk Job Test Import Only Saves to localStorage

**Problem**: The `bulkImportJobTests` function in `src/services/bulkJobTestService.ts` saves to `localStorage` only. There is no `job_tests` table in Supabase — the entire Job Tests system runs on localStorage, which means data disappears on browser change or clear.

**Fix**: 
1. Create a `job_tests` database table via migration
2. Update `bulkJobTestService.ts` to insert into Supabase instead of localStorage
3. Update `jobTestService.ts` to read/write from Supabase
4. Update `useJobTestManagement.tsx` to use React Query

**Database migration**:
```sql
CREATE TABLE public.job_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  organization text NOT NULL,
  duration integer DEFAULT 90,
  questions integer DEFAULT 100,
  syllabus jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job tests" ON public.job_tests
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage job tests" ON public.job_tests
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
```

**Modified files**:
- `src/services/jobTestService.ts` — rewrite all functions to use `supabase.from('job_tests')` instead of localStorage
- `src/services/bulkJobTestService.ts` — rewrite `bulkImportJobTests` to use `supabase.from('job_tests').insert()`
- `src/hooks/useJobTestManagement.tsx` — use React Query for fetching, add `queryClient.invalidateQueries`
- `src/data/jobTestsData.ts` — keep interface definitions, seed data can be used for initial migration if desired

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/components/admin/ManualOpportunityCreator.tsx` — prevent outside click close |
| Create | `src/components/admin/PublishedOpportunitiesManager.tsx` — manage approved items |
| Modify | `src/components/admin/AgentDashboard.tsx` — add published content section |
| Migration | Create `job_tests` table |
| Modify | `src/services/jobTestService.ts` — Supabase backend |
| Modify | `src/services/bulkJobTestService.ts` — Supabase insert |
| Modify | `src/hooks/useJobTestManagement.tsx` — React Query |

