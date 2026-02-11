

# Add "NEW" Badge to Ask Docs Navigation

A lightweight enhancement using `localStorage` to show a dismissable "NEW" badge on the Ask Docs navigation item across all three surfaces.

## Approach

Use a simple `localStorage` check -- the badge shows until the user visits `/ask-document` for the first time. No date-based logic needed; once visited, it stays hidden permanently.

## Changes

### 1. Sidebar (`src/components/AppSidebar.tsx`)

- Read `localStorage.getItem('visited_ask_docs')` inside the component
- For the `'Ask Docs'` menu item, render a small emerald `Badge` with text "NEW" (similar to the existing "Admin" badge on Question Bank)
- In the `onClick` handler for Ask Docs, call `localStorage.setItem('visited_ask_docs', 'true')` alongside `onNavigate`

### 2. Mobile Bottom Nav (`src/components/MobileBottomNav.tsx`)

- Same `localStorage` check
- Add a small "NEW" `Badge` next to the "Ask Docs" label in the profile sheet
- Set `localStorage` on click via the existing `handleProfileAction`

### 3. Header (`src/components/Header.tsx`)

- No direct change needed here -- the header passes `secondaryNavItems` to `AppSidebar`, which already handles rendering. The "Ask Docs" item flows through the sidebar menu where the badge is already added.

## Technical Details

| File | Change |
|------|--------|
| `src/components/AppSidebar.tsx` | Add `localStorage` check; render emerald "NEW" badge on Ask Docs item; set flag on click |
| `src/components/MobileBottomNav.tsx` | Add `localStorage` check; render "NEW" badge next to Ask Docs button; set flag on click |

**Badge styling:** `bg-emerald-500 text-white text-[10px] px-1.5 py-0` -- matches the existing badge pattern used for Jobs count and Admin label.

No new dependencies. Minimal code addition (~10 lines per file).

