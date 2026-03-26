

# Fix 404 Errors: Add Missing Board Hierarchy Routes

## Problem
Only `/boards` and `/boards/:boardSlug/class-:classNumber/:subjectSlug/:topicSlug` routes exist. Intermediate URLs like `/boards/sindh-text-book-board/class-12` hit the 404 catch-all because no components or routes exist for them.

## Solution
Create 3 new page components and register them in App.tsx.

---

## New Files

### 1. `src/pages/BoardLandingPage.tsx`
- Route: `/boards/:boardSlug`
- Resolves boardSlug to an educational system using `findBestMatch`
- Fetches all levels for that system, displays them as clickable cards
- Links to `/boards/${boardSlug}/class-${classNum}`

### 2. `src/pages/BoardClassPage.tsx`
- Route: `/boards/:boardSlug/class-:classNumber`
- Resolves board + class using same fuzzy matching
- Fetches all subjects for that level, displays as a grid
- Links to `/boards/${boardSlug}/class-${classNumber}/${subjectSlug}`

### 3. `src/pages/BoardSubjectPage.tsx`
- Route: `/boards/:boardSlug/class-:classNumber/:subjectSlug`
- Resolves board + class + subject
- Fetches all topics for that subject, displays as a list/grid
- Links to `/boards/${boardSlug}/class-${classNumber}/${subjectSlug}/${topicSlug}`

All three pages use:
- `findBestMatch` from `slugUtils.ts` for fuzzy slug resolution
- `<Header>` wrapper pattern (children inside Header)
- `<PageBreadcrumb>` with correct hierarchy
- `<SEOHead>` with dynamic title/description
- `<Footer />` inside Header
- Loading spinner + empty state

---

## Modified Files

### `src/App.tsx`
Add 3 new routes (order matters -- more specific before less specific):

```
<Route path="/boards/:boardSlug/class-:classNumber/:subjectSlug/:topicSlug" ... />
<Route path="/boards/:boardSlug/class-:classNumber/:subjectSlug" element={<BoardSubjectPage />} />
<Route path="/boards/:boardSlug/class-:classNumber" element={<BoardClassPage />} />
<Route path="/boards/:boardSlug" element={<BoardLandingPage />} />
<Route path="/boards" element={<Boards />} />
```

### `src/pages/Boards.tsx`
Update class links from `/boards/${toSlug(sys.name)}/class-${classNum}` -- this already looks correct, no change needed. The issue was purely missing routes.

---

## Technical Details
- Each page follows the exact same Supabase resolution pattern as BoardTopicPage: fetch all candidates, then `findBestMatch` client-side
- URL param `classNumber` uses `class-:classNumber` pattern consistent with existing route
- All pages use `useQuery` with appropriate cache keys and `staleTime: 5min`
- Lazy-loaded with `Suspense` wrapper in App.tsx

