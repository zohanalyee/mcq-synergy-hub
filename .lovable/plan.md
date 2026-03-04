

# Plan: Premium Tools System with Admin-Controlled Navigation

## Overview
Full implementation across 4 phases: admin navigation DB, tools slide-out panel, tools listing page, and 50 individual tool pages.

## Phase 1: Database & Admin Navigation

**Migration**: Create `navigation_items` table with RLS using the existing `is_admin()` function (not a subquery, to avoid recursion). Seed with current nav items.

**Admin UI**: Add a `NavigationManager` component to AdminTabs for toggling visibility and reordering items. No drag-and-drop library (avoid adding `@dnd-kit`); use simple up/down arrows instead.

**Header update**: Fetch visible `navigation_items` from Supabase. Fall back to hardcoded items if query fails. Cache with React Query.

| File | Action |
|------|--------|
| Migration SQL | Create `navigation_items` table + RLS + seed data |
| `src/components/admin/NavigationManager.tsx` | New admin component |
| `src/components/admin/AdminTabs.tsx` | Add NavigationManager tab |
| `src/components/Header.tsx` | Fetch nav from DB with fallback |

## Phase 2: Tools Infrastructure

**ToolWrapper**: Shared layout component wrapping all tool pages with breadcrumbs, title, description, related tools section, and MCQ CTA.

**ToolsPanel**: Sheet-based slide-out panel showing popular tools + "View All" link to `/tools`. Triggered from sidebar icon.

**Sidebar update**: Add a "Tools" entry with `Wrench` icon to the sidebar's "Tools & Resources" section, navigating to `/tools`. The slide-out panel is a secondary affordance.

| File | Action |
|------|--------|
| `src/components/tools/ToolWrapper.tsx` | New shared wrapper |
| `src/components/tools/ToolsPanel.tsx` | New slide-out panel |
| `src/components/AppSidebar.tsx` | Add Tools nav item |
| `src/components/Header.tsx` | Add "Tools" to nav items |

## Phase 3: Tools Listing Page

**`/tools` page**: Grid of all 50 tools with search input, category filter chips (All, Calculators, Student Tools, Productivity, Converters, Generators), and "Popular" badges. Each card links to `/tools/{tool-id}`.

**Static definitions**: All tools defined in a `src/data/toolsData.ts` config array (id, name, category, icon, description, popular flag, href). No database table needed for tool definitions.

| File | Action |
|------|--------|
| `src/data/toolsData.ts` | New: 50 tool definitions |
| `src/pages/Tools.tsx` | New: tools listing page |
| `src/App.tsx` | Add `/tools` route + lazy imports |

## Phase 4: 50 Individual Tool Pages

All tools are client-side only (no backend). Each uses `ToolWrapper` for consistent layout. Tools organized by category:

**Calculators (20)**: BMI, Percentage, Salary, EMI, Tip, Loan, Discount, BMR, Duration, Ratio, Speed, Area, Fraction, Date, Fuel + existing (Calculator, Age, GPA)

**Student Tools (10)**: CGPA, GPA-to-%, %-to-GPA, Grade, Marks, Attendance, Result, Formula Sheet, Periodic Table, Multiplication Table

**Converters (8)**: Currency (static rates), Temperature, Roman Numeral, Binary, Unit (existing), Case Converter, Image Resizer (canvas API), PDF-to-Text (file reader)

**Productivity (6)**: Stopwatch, World Clock, Word Counter, Character Counter + existing (Timer, Notes, Calendar)

**Generators (6)**: QR Code (via canvas), Password, Random Name, Color Picker, Random Number, Equation Solver

Each tool page:
- Uses `useState` with debounced calculations (300ms via `useEffect`)
- Framer Motion `animate` for result reveal
- Copy-to-clipboard button on results
- Mobile responsive grid layouts

**Routing**: All 50 tools added to `App.tsx` with `React.lazy()` for code splitting.

| File | Action |
|------|--------|
| `src/pages/tools/*.tsx` | ~43 new tool page files |
| `src/App.tsx` | Add all tool routes (lazy) |

## Technical Decisions

- **No new dependencies** except tools that genuinely need them (e.g., `qrcode` for QR generator -- will use canvas API instead to avoid deps)
- **No drag-and-drop library** for admin nav -- simple position arrows
- **Static tool definitions** -- no DB table for tools themselves
- **Lazy loading** all tool pages for bundle optimization
- **ToolWrapper** provides consistent breadcrumbs, SEO-ready titles, related tools, and MCQ platform CTA on every tool page

## Estimated Changes
- ~50 new files (tool pages + infrastructure)
- ~5 modified files (App.tsx, Header, Sidebar, AdminTabs, migration)
- 1 new DB table (navigation_items)

