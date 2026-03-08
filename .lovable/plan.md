

## Plan: Make Filter Sidebar Collapsed by Default & Inline with Search

**Problem**: The filter sidebar is always open and takes a full column on the left, wasting space especially on mobile.

**Solution**: Remove the dedicated sidebar column. Instead, place a compact "Filters" toggle button next to the search bar. When clicked, the filter panel expands below the search bar (collapsible). Closed by default.

### Changes

**1. `src/components/syllabus-builder/GlassFilterSidebar.tsx`**
- Wrap the entire filter content in a `Collapsible` component
- Add a trigger button (pill-shaped with Filter icon + active count badge) that toggles visibility
- Default state: `open={false}` (collapsed)
- When expanded, show Educational Systems and Levels sections as they are now
- Make the outer container inline-friendly (no fixed width)

**2. `src/components/syllabus-builder/SyllabusBuilder.tsx`**
- Remove the 2-column grid layout (`grid-cols-1 lg:grid-cols-[280px_1fr]`)
- Use a single-column layout instead
- Place `GlassFilterSidebar` right after the `GlassSearchInput` in the same container (or combine them in a row)
- Layout becomes: Search bar + Filter button on one row, expandable filter panel below, then subject grid

### Layout Structure (after change)
```text
┌─────────────────────────────────────┐
│  [Search bar...        ] [Filters▼] │
├─────────────────────────────────────┤
│  (collapsible filter panel)         │
│  [Systems chips] [Levels chips]     │
├─────────────────────────────────────┤
│  Subject Grid (full width)          │
└─────────────────────────────────────┘
```

This gives the subject grid full width on all screen sizes and keeps filters hidden until needed.

