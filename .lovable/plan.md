

# Fix Layout for Boards & BoardTopicPage

## Problem
`Boards.tsx` and `BoardTopicPage.tsx` render `<Header />` as a sibling element with a separate `<main>` using `pt-24`. This conflicts with the Header component's internal layout which already provides `mt-14` to its children. All other pages (Blog, FAQ, StudyGuides) correctly pass content as `<Header>{children}</Header>`.

## Solution
Refactor both pages to use the same children-wrapper pattern:

### `src/pages/Boards.tsx`
- Remove the outer `<div className="min-h-screen ...">` wrapper
- Pass page content as children of `<Header>`
- Move `<Footer />` inside `<Header>` as the last child
- Remove `pt-24` from main content container (replace with `py-8`)
- Use `max-w-7xl mx-auto px-4` for consistent container sizing

### `src/pages/BoardTopicPage.tsx`
- Same refactor: wrap content inside `<Header>` as children
- Remove outer wrapper div and `pt-24`
- Move `<Footer />` inside `<Header>`

No other pages need changes -- Blog, BlogPost, FAQ, and StudyGuides already use the correct pattern.

## Files Modified
- `src/pages/Boards.tsx`
- `src/pages/BoardTopicPage.tsx`

