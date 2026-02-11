

# Add "Ask Document" RAG Q&A to Navigation

## Summary

The Ask Document page (`/ask-document`) is fully built and functional but has **zero navigation links** anywhere in the app. Students can only access it by manually typing the URL. This plan adds it to all navigation surfaces.

## Changes

### 1. Add to Header nav items (`src/components/Header.tsx`)

Add `{ title: 'Ask Docs', path: '/ask-document' }` to the `secondaryNavItems` array (after "Feedback"). This makes it visible in the desktop navigation dropdown and mobile menu.

### 2. Add icon mapping in Sidebar (`src/components/AppSidebar.tsx`)

Add an entry for `'Ask Docs'` in the `getIcon` function using the `BookOpen` icon (or `MessageSquare`) with a distinctive color (e.g., `text-emerald-600`). This ensures the sidebar shows a proper icon when expanded or collapsed.

### 3. Add to Mobile Bottom Nav profile sheet (`src/components/MobileBottomNav.tsx`)

Add a button in the profile sheet (between "Feedback" and the separator before Settings) that navigates to `/ask-document`. Use a `BookOpen` or `MessagesSquare` icon to match the feature's purpose.

## Technical Details

| File | Change |
|------|--------|
| `src/components/Header.tsx` | Add `{ title: 'Ask Docs', path: '/ask-document' }` to `secondaryNavItems` array |
| `src/components/AppSidebar.tsx` | Add `'Ask Docs'` icon entry in `getIcon` function |
| `src/components/MobileBottomNav.tsx` | Add navigation button to `/ask-document` in the profile sheet |

No new dependencies, no backend changes, no route changes needed -- the page and edge function already exist.
Plan approved! Please add "Ask Document" navigation links.

IMPLEMENTATION:
Add navigation to all 3 locations as described:
1. ✅ Header.tsx - secondaryNavItems
2. ✅ AppSidebar.tsx - icon mapping
3. ✅ MobileBottomNav.tsx - profile sheet button

PREFERENCES:
- Icon: BookOpen (preferred) - represents documents/books
- Color: text-emerald-600 - distinctive green
- Label: "Ask Docs" or "Ask Document" (keep it short for mobile)

ADDITIONAL REQUESTS:

1. Also add tooltip/description:
   - Desktop: Hover tooltip "Ask questions from your study materials"
   - Mobile: Long-press hint or subtitle

2. Badge/indicator (optional):
   - Show "NEW" badge for first week
   - Or show document count if possible

3. Verify it works:
   - Test on desktop, tablet, mobile
   - Ensure all navigation paths work
   - Check icon displays correctly

Please implement and deploy all changes.
