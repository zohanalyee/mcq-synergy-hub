
# Ultra-Compact Hero Section for Mobile

## Goal
Make the entire hero section (heading, 3 category cards, stats) fit in one mobile screen without scrolling, while keeping the desktop layout comfortable.

## Changes

### 1. Redesign TestCategoryCard for mobile (src/components/TestCategoryCard.tsx)
Switch to a **horizontal row layout on mobile** (icon + title + arrow in one line) and keep the current vertical card layout on desktop:
- Mobile: Single-row card with icon, title, and chevron. No description, no "Get Started" button. Minimal padding (`p-2.5`), `min-h` removed on mobile.
- Desktop: Keep current vertical layout with description and button (`md:min-h-[140px]`, `md:p-4`).

### 2. Compact hero section in Index.tsx (src/pages/Index.tsx)
- Remove the "Prepare Smarter, Score Higher" badge on mobile (`hidden md:inline`)
- Reduce heading: `text-xl` on mobile (from `text-3xl`)
- Remove subtitle paragraph on mobile (`hidden md:block`)
- Remove "Prepare Your Way" subheading on mobile (`hidden md:block`)
- Reduce vertical spacing: `pt-2 pb-4` on mobile (from `pt-4 pb-8`)
- Reduce margins between elements: `mb-2` on mobile (from `mb-6`)
- Remove "Get Started" / "Explore Subjects" buttons on mobile (`hidden sm:flex`) since the cards already navigate
- Cards gap: `gap-1.5` on mobile

### 3. Compact HeroStatsSection for mobile (src/components/home/HeroStatsSection.tsx)
Replace the 2x2 grid of stat cards with a **single-row inline summary on mobile**:
- Mobile: One horizontal row showing "24m | 35 Tests | 7% | 120 Qs" with tiny icons, no cards, no progress bars
- Desktop: Keep the existing 4-column grid with cards and progress bars

Use a responsive approach: `hidden md:grid` for the card grid, `flex md:hidden` for the inline row.

### 4. Files modified
- `src/components/TestCategoryCard.tsx` -- horizontal mobile layout
- `src/pages/Index.tsx` -- hide non-essential elements on mobile, tighten spacing
- `src/components/home/HeroStatsSection.tsx` -- inline stats row on mobile

## Technical Details

### TestCategoryCard mobile layout:
```text
<Card>
  <div className="flex items-center gap-3 p-2.5 md:hidden">
    <icon-circle />
    <title className="flex-1 text-sm font-semibold" />
    <ChevronRight />
  </div>
  <div className="hidden md:flex flex-col p-4">
    <!-- existing desktop layout -->
  </div>
</Card>
```

### Index.tsx hero spacing changes:
- Section: `pt-2 pb-4 md:pt-4 md:pb-8`
- Badge: `hidden md:inline`
- Heading: `text-xl md:text-4xl lg:text-5xl`, reduced `mt-2 mb-2 md:mt-4 md:mb-4`
- Subtitle: `hidden md:block`
- "Prepare Your Way": `hidden md:block`
- Cards grid gap: `gap-1.5 md:gap-4`
- CTA buttons: `hidden sm:flex`

### HeroStatsSection mobile inline row:
```text
<!-- Mobile: inline compact row -->
<div className="flex md:hidden items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
  <span><Clock h-3/> 24m</span>
  <span>|</span>
  <span><CheckCircle h-3/> 35</span>
  <span>|</span>
  <span><Target h-3/> 7%</span>
  <span>|</span>
  <span><HelpCircle h-3/> 120</span>
</div>

<!-- Desktop: existing card grid -->
<div className="hidden md:grid grid-cols-4 gap-3">
  ...existing StatCards...
</div>
```

### Estimated mobile height:
- Heading: ~50px
- Card 1: ~48px
- Card 2: ~48px
- Card 3: ~48px
- Stats row: ~24px
- Spacing: ~30px
- Total: ~248px (fits easily in one screen)
