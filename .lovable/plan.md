

## Plan: Aggressive Spacing & Density Reductions

### 1. Base Font Size — Apply 14px globally (not just mobile)
**File: `src/index.css`**
- Move `font-size: 14px` from the mobile-only media query to apply to `html` globally (all screen sizes)

### 2. Subject Grid — More columns
**File: `src/components/subjects/SubjectGrid.tsx`**
- Change grid from `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6` → `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8`
- Reduce gap from `gap-3` → `gap-2`

### 3. Syllabus Builder Grid — More columns
**File: `src/components/syllabus-builder/SubjectGrid.tsx`**
- Change from `grid-cols-2 sm:grid-cols-3` → `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5`
- Reduce gap from `gap-3` → `gap-2`

### 4. Tools Page — More columns, tighter spacing
**File: `src/pages/Tools.tsx`**
- Grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` → `grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8`
- Gap: `gap-2.5` → `gap-2`
- Tool card padding: `p-4` → `p-3`
- Icon size: `h-10 w-10` → `h-8 w-8`, inner icon `h-5 w-5` → `h-4 w-4`
- Heading: `text-2xl sm:text-3xl` → `text-xl sm:text-2xl`

### 5. Index Page — Tighter sections
**File: `src/pages/Index.tsx`**
- Subject grid: `grid-cols-2 md:grid-cols-4 gap-4` → `grid-cols-3 md:grid-cols-4 gap-2`
- Feature grid: `grid-cols-2 md:grid-cols-3 gap-4` → `grid-cols-2 md:grid-cols-3 gap-2`
- Section headings: `text-2xl` → `text-lg`, `text-xl` → `text-base`
- Section margin-bottom: `mb-6`/`mb-5` → `mb-3`
- Testimonials grid gap: `gap-4` → `gap-2`
- Stats counters: `text-2xl md:text-3xl` → `text-xl md:text-2xl`
- "View All Subjects" margin: `mt-8` → `mt-4`

### 6. SubjectCard — Slightly tighter
**File: `src/components/SubjectCard.tsx`**
- Min-height: `min-h-[120px]` → `min-h-[100px]`

### 7. FeatureCard — Reduce padding
**File: `src/components/FeatureCard.tsx`**
- Card min-height: `min-h-[100px]` → remove
- Padding: `p-3` → `p-2.5`

### Files to edit (7 files):
1. `src/index.css` — global 14px font
2. `src/components/subjects/SubjectGrid.tsx` — more columns
3. `src/components/syllabus-builder/SubjectGrid.tsx` — more columns
4. `src/pages/Tools.tsx` — denser grid
5. `src/pages/Index.tsx` — tighter sections
6. `src/components/SubjectCard.tsx` — smaller min-height
7. `src/components/FeatureCard.tsx` — less padding

