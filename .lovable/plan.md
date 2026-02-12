# Fix Ask Document Page Layout

## Root Cause

The `Header` component (lines 158-208) creates a full-page layout with `min-h-screen`, sidebar, fixed header bar, and a `<main>` slot for `{children}`. Other pages pass their content **inside** `<Header>` as children.

However, `AskDocument.tsx` renders its content **after** `<Header />` as a sibling element:

```text
<div min-h-screen>        <-- AskDocument wrapper
  <Header />              <-- This is a full min-h-screen layout
  <main>content</main>    <-- This appears BELOW the full-height Header
</div>
```

This pushes the page content below an entire viewport height of empty space.

## Fix (single file change)

**File: `src/pages/AskDocument.tsx**`

Move the page content to be **children** of `<Header>` instead of a sibling. Remove the outer `min-h-screen` wrapper since Header already provides that.

Before:

```tsx
return (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 pt-2 pb-6 max-w-4xl">
      {/* all content */}
    </main>
  </div>
);
```

After:

```tsx
return (
  <Header>
    <div className="container mx-auto px-4 pt-2 pb-6 max-w-4xl">
      {/* all content -- unchanged */}
    </div>
  </Header>
);
```

Key changes:

- Remove outer `<div className="min-h-screen bg-background">`
- Change `<Header />` (self-closing) to `<Header>...</Header>` (wrapping)
- Move content inside Header as children
- Change `<main>` to `<div>` since Header already provides a `<main>` wrapper

No other files need changes. The content itself (title, chat area, input, example questions) stays exactly the same.  

Perfect diagnosis! Please implement the layout fix.

APPROVED CHANGES:

1. ✅ Remove outer min-h-screen wrapper

2. ✅ Make Header a wrapping component (not self-closing)

3. ✅ Move content inside Header as children

4. ✅ Change <main> to <div>

This matches the pattern used by other pages in the app and will fix the spacing issue completely.

Please implement and deploy the fix now.