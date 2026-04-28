# UI/UX Overhaul — Unified Subject Card + System Grouping

## What you'll get

A single, professional **SubjectCard** used on both `/subjects` and `/custom-syllabus`, plus a **grouped grid** that splits subjects by Educational Board (Federal, Sindh, Punjab, KPK, Cambridge, etc.) instead of dumping all 145 subjects in one flat wall.

Visual result on each card:

```text
┌──────────────────────────────────────────┐
│ 📘  Biology                  [Class 9]   │  ← Level tag, top-right
│ Federal Board                            │  ← System sub-line
│ ──────────────────────────────────────── │
│ 📚 12 Topics  •  ✅ 240 MCQs             │  ← Stats row
│ ──────────────────────────────────────── │
│ VIEW TOPICS ▾                       [→]  │  ← Expandable + CTA arrow
└──────────────────────────────────────────┘
```

And on each page, sections like:

```text
═══ Federal Board ════════════ 18 subjects
[ Biology · Class 9 ] [ Chemistry · Class 9 ] [ Physics · Class 9 ] …

═══ Sindh Board ═════════════  22 subjects
[ Biology · SSC-I ] [ Chemistry · SSC-I ] …

═══ Cambridge ═══════════════  14 subjects
[ Biology · O-Level ] [ Physics · O-Level ] …
```

## Decisions (taking your enhancements)

1. **One card component** used in both pages — variant prop controls behavior (navigation card on `/subjects`, checkbox/topic-picker card on `/custom-syllabus`).
2. **Level tag pinned top-right** as a small Badge (e.g. `Class 9`, `O-Level`, `SSC-I`).
3. **Color strategy = System base + subject hash variation** (your Option B + A). Each board gets a base hue (Federal blue, Sindh green, Punjab orange, Cambridge purple, KPK cyan, Balochistan pink, fallback slate). Subjects within a board get a ±30° hue offset derived from a deterministic name hash, so cards within the same board feel cohesive but distinct. Falls back gracefully for unknown systems.
4. **Stats row**: `Topics` always; `MCQs` shown when count > 0 (we already have `topicCount`; MCQ count will be added — see Technical section).
5. **Grouped grid by System** with alphabetical sort within each group. Group header shows system name + subject count. Sticky-style heading, no collapsibles in v1 (keeps scanning fast on mobile).
6. **Custom Syllabus page** keeps its checkbox + expandable-topics behavior, but uses the same visual chrome (level tag top-right, system sub-line, stats row, themed colors, group headers).

## Files to create / change

**Create**

- `src/components/subjects/UnifiedSubjectCard.tsx` — single source of truth for the card. Props:
  - `subject: { id, name, level, levelId, system, systemId, topicCount, mcqCount?, topics?, icon?, description? }`
  - `variant: 'navigate' | 'select'`
  - `selection?: { isSelected, selectedTopicIds, isExpanded, onToggleSubject, onToggleTopic, onToggleExpand }` (only used when `variant='select'`)
  - `onClick?` (used by `variant='navigate'`; falls back to internal `<Link>` to `/subject-content/:id` so SEO + middle-click open-in-tab keep working — same pattern as today's `SubjectCard`)
- `src/components/subjects/GroupedSubjectGrid.tsx` — generic grouped grid. Props: `subjects`, `groupBy: 'system' | 'level' | 'none'`, `renderCard(subject) => ReactNode`, `emptyState?`. Handles grouping + alphabetical sort + group header rendering. Stays presentational.
- `src/lib/subjectTheme.ts` — exports `getSubjectTheme(subjectName, systemName?)` returning `{ main, light, border, surface }` HSL strings. Centralizes the system→hue table + hash variation. Replaces today's scattered color logic in `SubjectCard.tsx`, `useSubjectsPageData.tsx`, and `GlassCard.getCardTheme`.

**Modify**

- `src/components/subjects/SubjectGrid.tsx` (the `/subjects` one) — swap flat motion grid for `GroupedSubjectGrid` rendering `<UnifiedSubjectCard variant="navigate" />`. Keep skeleton/empty handling.
- `src/components/syllabus-builder/SubjectGrid.tsx` — swap flat grid for `GroupedSubjectGrid` rendering `<UnifiedSubjectCard variant="select" selection={…} />`. Pass `topicQuestionCounts` so the stats row can show MCQ counts per subject.
- `src/pages/Subjects.tsx` — no API change needed; the grouped grid plugs into the existing `mappedSubjects` array. Pass `systemName` through (already present in `SubjectDisplay`, currently dropped in the `mappedSubjects.map` — will be re-added).
- `src/hooks/useSubjectsPageData.tsx` — add an aggregate **subject-level MCQ count** lookup (single Supabase query: `select subject_id, count from questions group by subject_id` via RPC or `select subject_id` then count client-side, mirroring the existing topic-count pattern). Feed it into `SubjectDisplay.mcqCount`.
- `src/components/syllabus-builder/hooks/useSyllabusData.ts` (if not already) — derive subject-level MCQ totals from existing `topicQuestionCounts` (sum across the subject's topics) and pass through. No new query needed.

**Delete / deprecate (after swap)**

- `src/components/SubjectCard.tsx` — replaced by `UnifiedSubjectCard`. Will keep a thin re-export shim for one release if anything else imports it; otherwise remove.
- `src/components/syllabus-builder/SyllabusSubjectCard.tsx` — replaced by `UnifiedSubjectCard` with `variant='select'`.
- `src/components/custom-syllabus/SubjectCard.tsx` — also replaced (same shape as syllabus-builder card). I'll grep imports first and migrate any callers.

## Behavior details

- **Card height stays compact** when collapsed (~110–130px) and grows only when topics expand — matches your current density standard (Poppins 14px base, p-2.5/p-3).
- **Level tag** uses `<Badge variant="secondary">` styled with the card's themed color at low opacity, so it reads as part of the card identity, not a floating chip.
- **System sub-line** is a single muted line under the title (`text-[11px] text-muted-foreground`), not a full badge — keeps vertical rhythm tight.
- **Stats row** uses `BookOpen` for topics and `CheckCircle` for MCQs (matches existing icon language). Hidden cleanly when both counts are zero.
- **Expandable topics**: in `variant='navigate'` it's optional (off by default on `/subjects` to avoid double-purpose UI — main click goes to subject page). In `variant='select'` it's the primary interaction (matches today's syllabus builder).
- **Group headers**: small uppercase label with system name + count, separator line, no collapse (v1). Sort: groups ordered by system `order_index` if available, else alphabetical; subjects within a group sorted alphabetically.
- **Filter interaction**: when a system filter is active and only one group remains, group header is hidden (avoids redundant chrome).
- **Dark mode**: HSL theme function returns tokens that work in both modes (uses `hsl()` with alpha for surface, `hsl()` with adjusted lightness for borders). No hard-coded greys.
- **Sync badge** (offline cached indicator currently on `SubjectCard.tsx`) is preserved on the unified card behind the icon, same position.

## Out of scope (v1)

- Collapsible group headers
- List variant (`variant='list'`) — props already designed to allow it later, but no consumer needs it today
- MCQ count for subjects without `subject_id`-tagged questions in the DB (will display only topic count, gracefully)

## Risk / verification

- Both `/subjects` and `/custom-syllabus` render the same card chrome — visual regression check on mobile (`1085px` viewport and below). Group headers must not overflow on narrow widths.
- `MotionLink` SEO + middle-click behavior must survive the swap — `variant='navigate'` keeps the `<Link>` wrapper.
- Custom Syllabus `MAX_SUBJECTS = 10` selection logic and the indeterminate-checkbox state stay in `SyllabusBuilder.tsx` handlers; the unified card just renders what selection state it's given.
- Color migration: `getCardTheme` and the inline `getSubjectTheme` in `SubjectCard.tsx` will be removed once `subjectTheme.ts` is in place — I'll grep for remaining callers and update them so no orphan imports remain.

&nbsp;

# ✅ **LOVABLE'S PLAN - APPROVE WITH MINOR ADDITIONS**

**Lovable ka plan 95% PERFECT hai!** Lekin kuch minor additions recommend kar raha hun.

---

## **📊 LOVABLE'S PLAN REVIEW:**

### **✅ EXCELLENT POINTS:**

```
1. ONE UNIFIED CARD ✅
   - variant='navigate' for /subjects
   - variant='select' for /custom-syllabus
   - Same visual design everywhere
   
2. SYSTEM-BASED GROUPING ✅
   - Federal Board section
   - Sindh Board section
   - Cambridge section
   - Clear headers with counts

3. SMART COLOR SYSTEM ✅
   - System base hue (Federal=blue, Sindh=green)
   - Subject hash variation (±30°)
   - Deterministic, no hard-coding
   - Dark mode support

4. COMPACT DESIGN ✅
   - Level tag top-right
   - System subtitle
   - Stats row (topics + MCQs)
   - Expandable topics (optional)

5. SEO PRESERVED ✅
   - <Link> wrapper for navigation
   - Middle-click works
   - Right-click "Open in new tab" works

6. CLEAN ARCHITECTURE ✅
   - Central theme function
   - Reusable grid component
   - Delete old duplicates

```

---

## **⚠️ MINOR ADDITIONS NEEDED:**

### **ADDITION 1: MOBILE RESPONSIVENESS**

```
LOVABLE MENTIONED:
"Visual regression check on mobile (1085px viewport)"

ADD TO PLAN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mobile-specific optimizations:

1. Group Headers on Mobile:
   - Sticky positioning (stick to top while scrolling)
   - Collapse to system icon + name on small screens
   - Reduce padding on mobile

2. Card Layout on Mobile:
   - Single column grid (<640px)
   - Reduce internal padding
   - Stack stats vertically if needed
   - Smaller badges/tags

3. Touch Targets:
   - Expandable topics button: min 44px height
   - All clickable areas: min 44x44px
   - Add slight spacing between cards

IMPLEMENTATION:
```typescript
// In UnifiedSubjectCard.tsx
<Card 
  className={cn(
    "group transition-all",
    "hover:shadow-md hover:-translate-y-1",
    // Mobile optimizations
    "p-3 sm:p-4",  // Less padding on mobile
    "min-h-[100px] sm:min-h-[110px]",
  )}
>
  {/* Stats row responsive */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
    {/* Stats here */}
  </div>
</Card>

// In GroupedSubjectGrid.tsx
<div className="sticky top-0 z-10 bg-background/95 backdrop-blur">
  {/* Group header */}
</div>

```

```

---

### **ADDITION 2: LOADING STATES**


```

LOVABLE MENTIONED: "Keep skeleton/empty handling"

ADD TO PLAN: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Loading states for grouped grid:

1. Initial Load:
  - Skeleton group headers (3-4)
  - Skeleton cards (12-16)
  - Maintain grid spacing
2. Filter Changes:
  - Smooth transition between groups
  - Fade in/out animation
  - No layout shift
3. Empty States:
  - Per-group empty state
  - Overall empty state
  - Search no-results state

IMPLEMENTATION:

```typescript
// In GroupedSubjectGrid.tsx
{isLoading ? (
  <div className="space-y-8">
    {[1, 2, 3].map(i => (
      <div key={i}>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(j => (
            <Skeleton key={j} className="h-32" />
          ))}
        </div>
      </div>
    ))}
  </div>
) : (
  // Actual grid
)}

// Empty state per group
{groupSubjects.length === 0 && (
  <div className="text-center py-8 text-muted-foreground">
    No subjects found in {groupName}
  </div>
)}

```

```

---

### **ADDITION 3: ACCESSIBILITY (A11Y)**


```

LOVABLE DIDN'T MENTION: Accessibility features

ADD TO PLAN: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Accessibility requirements:

1. Keyboard Navigation:
  - All cards tabbable
  - Arrow keys to navigate grid
  - Enter/Space to select
  - Escape to collapse topics
2. Screen Readers:
  - Proper ARIA labels
  - Group headers announced
  - Stats read correctly
  - Selection state announced
3. Focus Management:
  - Visible focus rings
  - Focus trap in expanded topics
  - Return focus after actions

IMPLEMENTATION:

```typescript
// In UnifiedSubjectCard.tsx
<Card
  role="article"
  aria-label={`${subject.name}, ${subject.level}, ${subject.system}`}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick?.();
    }
  }}
>
  {/* Level badge */}
  <Badge aria-label={`Level: ${subject.level}`}>
    {subject.level}
  </Badge>

  {/* Stats row */}
  <div aria-label={`${subject.topicCount} topics, ${subject.mcqCount} MCQs`}>
    {/* Stats */}
  </div>

  {/* Expandable topics */}
  <Button
    aria-expanded={isExpanded}
    aria-controls={`topics-${subject.id}`}
  >
    View Topics
  </Button>

  {isExpanded && (
    <div 
      id={`topics-${subject.id}`}
      role="region"
      aria-label="Topic list"
    >
      {/* Topics */}
    </div>
  )}
</Card>

// In GroupedSubjectGrid.tsx
<section aria-labelledby={`group-${groupName}`}>
  <h2 id={`group-${groupName}`}>
    {groupName}
  </h2>
  <div role="list">
    {/* Cards */}
  </div>
</section>

```

```

---

### **ADDITION 4: PERFORMANCE OPTIMIZATION**


```

LOVABLE DIDN'T MENTION: Performance for 145+ subjects

ADD TO PLAN: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Performance optimizations:

1. Virtual Scrolling (Optional):
  - For very long lists (>100 subjects)
  - Only render visible cards
  - Use react-window or @tanstack/virtual
2. Memoization:
  - Memo UnifiedSubjectCard
  - Memo group calculations
  - useMemo for color generation
3. Lazy Loading:
  - Load groups on scroll
  - Defer topic lists until expanded
  - Progressive image loading

IMPLEMENTATION:

```typescript
// In UnifiedSubjectCard.tsx
export const UnifiedSubjectCard = React.memo(({ 
  subject, 
  variant, 
  ...props 
}: SubjectCardProps) => {
  // Memoize color calculation
  const colors = useMemo(
    () => getSubjectTheme(subject.name, subject.system),
    [subject.name, subject.system]
  );

  // Rest of component
}, (prev, next) => {
  // Custom comparison
  return (
    prev.subject.id === next.subject.id &&
    prev.variant === next.variant &&
    prev.selection?.isSelected === next.selection?.isSelected
  );
});

// In GroupedSubjectGrid.tsx
const grouped = useMemo(() => {
  // Grouping logic
}, [subjects, groupBy]);

// Optional: Virtual scrolling for huge lists
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: subjects.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 150, // Estimated card height
});

```

```

---

### **ADDITION 5: ANALYTICS TRACKING**


```

LOVABLE DIDN'T MENTION: Analytics for card interactions

ADD TO PLAN: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Track user behavior:

1. Card Clicks:
  - Subject viewed
  - System group
  - Source page (/subjects or /custom-syllabus)
2. Topic Expansions:
  - Which subjects expanded most
  - Topic click-through
3. System Preferences:
  - Most viewed systems
  - Popular subjects per system

IMPLEMENTATION:

```typescript
// In UnifiedSubjectCard.tsx
const handleClick = () => {
  // Track analytics
  trackEvent('subject_card_click', {
    subject_id: subject.id,
    subject_name: subject.name,
    system: subject.system,
    level: subject.level,
    variant: variant,
    page: window.location.pathname,
  });

  onClick?.();
};

const handleTopicExpand = () => {
  trackEvent('subject_topics_expanded', {
    subject_id: subject.id,
    topic_count: subject.topicCount,
  });

  setIsExpanded(!isExpanded);
};

// In GroupedSubjectGrid.tsx
useEffect(() => {
  // Track visible groups
  const visibleGroups = Object.keys(grouped);
  
  trackEvent('subject_grid_view', {
    total_subjects: subjects.length,
    groups_shown: visibleGroups.length,
    group_by: groupBy,
  });
}, [grouped, groupBy]);

```

```

---

### **ADDITION 6: ERROR HANDLING**


```

LOVABLE DIDN'T MENTION: Error states

ADD TO PLAN: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Error handling:

1. Failed MCQ Count Load:
  - Show topic count only
  - Add "Load failed" indicator
  - Retry button
2. Invalid Color Data:
  - Fallback to default theme
  - Log error for debugging
  - Don't crash card
3. Missing Required Props:
  - Graceful degradation
  - Show basic card
  - Log warning

IMPLEMENTATION:

```typescript
// In subjectTheme.ts
export function getSubjectTheme(
  subjectName: string, 
  systemName?: string
) {
  try {
    // Color calculation
    const colors = calculateColors(subjectName, systemName);
    return colors;
  } catch (error) {
    console.warn('Color calculation failed:', error);
    // Fallback theme
    return {
      main: 'hsl(211, 70%, 50%)',
      light: 'hsl(211, 70%, 95%)',
      border: 'hsl(211, 40%, 80%)',
      surface: 'hsl(211, 70%, 98%)',
    };
  }
}

// In UnifiedSubjectCard.tsx
if (!subject?.id || !subject?.name) {
  console.warn('Invalid subject data:', subject);
  return null; // Or minimal fallback card
}

```

```

---

### **ADDITION 7: TRANSITION ANIMATIONS**


```

LOVABLE MENTIONED: "Smooth transition between groups"

ADD MORE DETAIL: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Animation specifications:

1. Card Hover:
  - Transform: translateY(-4px)
  - Shadow: sm → md
  - Duration: 200ms
  - Easing: ease-out
2. Topic Expansion:
  - Height: auto with max-height
  - Opacity: 0 → 1
  - Duration: 300ms
  - Stagger children: 50ms each
3. Group Appear:
  - Fade in from opacity 0
  - Slide up 10px
  - Duration: 400ms
  - Stagger: 100ms per group
4. Filter Changes:
  - Fade out old cards
  - Fade in new cards
  - Maintain grid layout
  - No jarring jumps

IMPLEMENTATION:

```typescript
// In UnifiedSubjectCard.tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  whileHover={{ 
    y: -4,
    transition: { duration: 0.2 } 
  }}
>
  {/* Card content */}
</motion.div>

// In GroupedSubjectGrid.tsx
<AnimatePresence mode="wait">
  {Object.entries(grouped).map(([group, subjects], index) => (
    <motion.section
      key={group}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Group content */}
    </motion.section>
  ))}
</AnimatePresence>

```

```

---

## **📋 COMPLETE ADDITIONS SUMMARY:**


```

LOVABLE'S PLAN: ✅ 95% Complete

ADD THESE 7 POINTS: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ✅ Mobile Responsiveness
  - Sticky headers
  - Single column <640px
  - Touch targets 44px
  - Reduced padding
2. ✅ Loading States
  - Skeleton loaders
  - Smooth transitions
  - Empty states
3. ✅ Accessibility (A11Y)
  - Keyboard navigation
  - ARIA labels
  - Screen reader support
  - Focus management
4. ✅ Performance
  - Memoization
  - Virtual scrolling (optional)
  - Lazy loading
5. ✅ Analytics
  - Track card clicks
  - Track expansions
  - Track system preferences
6. ✅ Error Handling
  - Fallback themes
  - Graceful degradation
  - Retry mechanisms
7. ✅ Animations
  - Card hover effects
  - Topic expansion
  - Group transitions
  - Filter changes

TOTAL: Lovable's plan + 7 additions = PERFECT!

```

---

## **✅ FINAL VERDICT:**


```

LOVABLE'S PLAN: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Core Architecture: ✅ Perfect Component Design: ✅ Perfect Color System: ✅ Perfect Grouping Strategy: ✅ Perfect SEO Preservation: ✅ Perfect File Organization: ✅ Perfect

MISSING (Minor): Mobile details ⚠️ A11y features ⚠️ Performance tips ⚠️ Analytics ⚠️ Error states ⚠️ Animation specs ⚠️

WITH ADDITIONS ABOVE: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Production-ready ✅ Accessible ✅ Performant ✅ Trackable ✅ Resilient ✅ Polished

VERDICT: ✅ APPROVE + ADD 7 POINTS ABOVE

```

---

## **🚀 RECOMMENDED APPROACH:**


```

PHASE 1 (Core - Do First): ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Implement Lovable's base plan ✅ Add mobile responsiveness ✅ Add loading states ✅ Basic error handling

TIME: 1-2 days DELIVERABLE: Working unified cards + grouping

PHASE 2 (Polish - Do Next): ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Add A11y features ✅ Add analytics tracking ✅ Add animations ✅ Performance optimization

TIME: 1 day DELIVERABLE: Production-ready, polished

PHASE 3 (Optional - Later): ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Virtual scrolling (if >200 subjects) ✅ Advanced animations ✅ A/B testing variants

TIME: As needed

```



**MY 7 ADDITIONS:**
1. ✅ Mobile responsive details
2. ✅ Loading/skeleton states
3. ✅ Accessibility (A11Y)
4. ✅ Performance optimization
5. ✅ Analytics tracking
6. ✅ Error handling
7. ✅ Animation specifications

**COMPLETE PROMPT:**
Lovable's plan + 7 additions above = **PERFECT IMPLEMENTATION**

**VERDICT:** ✅ **APPROVE WITH ADDITIONS**

```