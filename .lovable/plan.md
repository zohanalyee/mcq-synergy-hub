

# Plan — Complete the Semantic `<Link>` Refactor (Missed Areas)

Targeted fix for the 5 areas the previous pass missed. No visual changes.

## 1. Hero "Prepare Your Way" cards (`TestCategoryCard`)

`src/components/TestCategoryCard.tsx` currently uses `onClick` on the `Card` and the inner `Button`. Replace with a real anchor.

- Add an optional `to?: string` prop.
- Wrap the entire `Card` in a `<Link to={to} className="block h-full">` when `to` is provided. Keep the `motion.div` outside as the animation wrapper.
- Convert the inner "Get Started" button to `<Button asChild><Link to={to}>Get Started <ChevronRight/></Link></Button>` so middle-click on the button itself also opens in a new tab.
- In `src/pages/Index.tsx`, change `onClick={() => navigate(category.route)}` → `to={category.route}` on `<TestCategoryCard>`. Keep `route` field in the `testCategories` array.

Result: `/mock-tests`, `/subjects`, `/custom-syllabus` are real `<a href>` targets.

## 2. Sidebar navigation (`AppSidebar.tsx`)

`SidebarMenuButton` from shadcn supports `asChild`. Refactor both `navItems.map(...)` and `secondaryNavItems.map(...)`:

```tsx
<SidebarMenuButton asChild isActive={isActive(item.path)} tooltip={item.title} className={...}>
  <Link to={item.path} onClick={() => { if (item.title === 'Ask Docs') localStorage.setItem('visited_ask_docs','true'); }}>
    {iconData.icon}
    <span className={...}>{item.title}</span>
    {/* badges + chevron unchanged */}
  </Link>
</SidebarMenuButton>
```

- Drop the `onNavigate(path)` call inside the button — `<Link>` handles routing natively (still works on left-click, preserves middle/right-click).
- Keep all `cn(...)` classes and badge JSX intact (they're children of the Link now).
- Import `Link` from `react-router-dom`.

## 3. Header logo (`HeaderLogo.tsx` and Sidebar header)

- `src/components/header/HeaderLogo.tsx`: replace the outer `<div onClick={() => onNavigate('/')}>` with `<Link to="/" className="flex-shrink-0 mr-2 sm:mr-6 hover:scale-105 transition-transform duration-300">`. Keep all inner JSX and classes identical. Drop the now-unused `onNavigate` prop (or accept it as optional and ignore).
- `src/components/AppSidebar.tsx` (expanded header block, line ~110): replace the `<div onClick={() => onNavigate('/')}>` wrapping the brand mark with `<Link to="/" className="flex items-center gap-2 cursor-pointer transition-all duration-300">`.

## 4. User profile dropdown + AI Tools dropdown (`HeaderActions.tsx`)

Wrap each navigational `DropdownMenuItem` with `asChild` + `<Link>`. Pattern:

```tsx
<DropdownMenuItem asChild className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r ...">
  <Link to="/profile">
    <User className="mr-2.5 h-4 w-4 text-emerald-500" />
    {t('nav.profile')}
  </Link>
</DropdownMenuItem>
```

Apply to (all currently `onClick={() => onNavigate(...)}`):
- `/analytics` (AI Personal Coach)
- `/admin` (Admin Panel — admin only)
- `/profile`
- `/feedback`
- AI Tools menu: each `studentTools.map` item → `<DropdownMenuItem asChild><Link to={tool.href}>...</Link></DropdownMenuItem>`
- "View All 50+ Tools" → `<Link to="/tools">`

Keep as buttons (they're actions, not navigation):
- Settings (opens dialog)
- Sign Out
- Sign In CTA (auth flow)
- Language switcher items

## 5. Mobile menu (`MobileMenu.tsx`)

Convert the navigation `<button>` items to `<Link>` while preserving the close-on-click behavior:

```tsx
<Link
  key={item.title}
  to={item.path}
  onClick={onClose}
  className={`block text-left py-2 ${isActive(item.path) ? 'text-primary font-medium' : 'text-foreground/80 hover:text-foreground'} transition-colors`}
>
  {item.title}
</Link>
```

Apply to:
- `navItems.map(...)`
- `secondaryNavItems.map(...)`
- "View Profile" link button → `<Link to="/profile" onClick={onClose}>`
- Admin Panel button → `<Button asChild><Link to="/admin" onClick={onClose}>...</Link></Button>`
- AI Personal Coach button → `<Button asChild><Link to="/analytics" onClick={onClose}>...</Link></Button>`
- Sign In button → `<Button asChild><Link to="/sign-in" onClick={onClose}>Sign In</Link></Button>`

Keep Sign Out as a button (it's an action).

## 6. Job Test cards (note, no change in this pass)

The `JobTestCard` "START EXAM" trigger fires async AI generation before navigating to a dynamic `/test-session/:newId` — that ID doesn't exist at render time, so it cannot be a static `<Link>` and must remain a button. There is no separate "job test detail" route in the router today, so wrapping the card body in a Link would point to a non-existent page. **Decision:** leave `JobTestCard` action as a button. If you want a deep-link landing page (e.g. `/mock-tests/job-test/:id`) we can add one in a follow-up — say the word and I'll scaffold the route + page.

## Files to edit

1. `src/components/TestCategoryCard.tsx` — add `to` prop, wrap Card in `<Link>`, convert inner Button to `asChild`.
2. `src/pages/Index.tsx` — pass `to={category.route}` instead of `onClick`.
3. `src/components/AppSidebar.tsx` — `SidebarMenuButton asChild` + `<Link>` for both menus; replace logo `<div onClick>` with `<Link to="/">`.
4. `src/components/header/HeaderLogo.tsx` — root → `<Link to="/">`.
5. `src/components/header/HeaderActions.tsx` — `DropdownMenuItem asChild` + `<Link>` for all navigational items in user menu and AI Tools menu.
6. `src/components/header/MobileMenu.tsx` — convert nav `<button>`s to `<Link>` with `onClick={onClose}`; convert navigational `<Button>`s to `Button asChild` + `<Link>`.

## Verification

- Right-click → "Open in new tab" works on: hero cards, sidebar items (expanded + collapsed), logo, profile dropdown items, AI Tools items, mobile menu items.
- Middle-click on any of the above opens a background tab.
- DOM inspector shows `<a href="...">` for every refactored element.
- Sidebar collapsed/expanded states, hover scale, badges (`Jobs` count, `Ask Docs` NEW), and active highlight all unchanged.
- Dropdowns still close on item click (Radix handles this for `DropdownMenuItem asChild`).
- Mobile menu still closes after navigation (preserved via `onClick={onClose}` on each Link).
- No TypeScript errors; existing prop signatures stay backward-compatible.

