

## Plan: Replace Subjects Page Filters with Glassmorphism Search + Filter

### What Changes

**`src/pages/Subjects.tsx`**
- Replace `SmartSearchInput` + `SystemLevelFilter` with the same `GlassSearchInput` + `GlassFilterSidebar` combo used in the Syllabus Builder
- Layout: single row with `GlassSearchInput` (flex-1) on the left and `GlassFilterSidebar` button on the right — identical to Syllabus Builder line 606-621
- Map `systems` data from `useSubjectsPageData` (type `SystemWithLevels`) to match `EducationalSystemWithLevels` expected by `GlassFilterSidebar` (add missing `description` field as `undefined`)
- Keep `FilterSummary` below the search row
- Remove `SystemLevelFilter` and `SmartSearchInput` imports

### Files Modified
- `src/pages/Subjects.tsx` — swap filter components, add search+filter row layout

### No new files needed — reuses existing `GlassSearchInput` and `GlassFilterSidebar` components directly.

