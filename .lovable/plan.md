

# Fix Plan: Tools Layout, Color Shedding, Syllabus Quotas, Mobile Syllabus Map

## Fix 1: Tools Page Grid Layout (src/pages/Tools.tsx)

The current grid uses `grid-cols-3` on mobile (360px), which is too dense and causes broken rendering. The tool cards are tiny and the layout appears glitched.

**Changes**:
- Change grid to `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6` with `gap-3`
- Increase card padding and make icons/text more readable
- Add `min-h-[120px]` to cards for consistent sizing
- Keep the existing category colors, Popular badge, and animation system

## Fix 2: Color Shedding Bug

The screenshots show horizontal glitch lines across the page - this is caused by the tool cards' background/border colors bleeding or not rendering properly on mobile browsers. The `motion.div` animations combined with semi-transparent borders and backgrounds can cause paint artifacts on low-end devices.

**Changes in src/pages/Tools.tsx**:
- Add `will-change-transform` to animated cards to force GPU compositing
- Reduce animation stagger delay to prevent rendering bottleneck
- Ensure all containers use `bg-background text-foreground` explicitly
- Add `overflow-hidden` to card containers to prevent border bleed

## Fix 3: Strict Syllabus Quota Math (src/services/testGenerationService.ts)

**Problem**: `Math.round()` on multiple subjects can sum to more than `questionCount` (e.g., 40% of 20 = 8, but multiple rounds add up to 22).

**Changes**:
- Replace `Math.round` with a largest-remainder allocation algorithm:
  1. Calculate `Math.floor((weight / totalWeight) * questionCount)` for each subject
  2. Sum all floors. Remainder = `questionCount - sum`
  3. Sort subjects by fractional part descending
  4. Distribute remainder 1 question at a time to highest-fraction subjects
- This guarantees quotas sum to exactly `questionCount`
- `fetchSubjectQuota` already slices to quota (line 122) - this is correct
- Keep the final safety net slice at line 223

## Fix 4: Mobile Syllabus Map (src/pages/TestSession.tsx)

**Problem**: Syllabus Map sidebar is `hidden lg:block` - invisible on mobile.

**Changes**:
- Import `Sheet, SheetContent, SheetTrigger, SheetTitle` from `@/components/ui/sheet`
- Add a `md:hidden` button near the ExamHeader (or inside ExamNavBar) with a `BookOpen` icon labeled "Syllabus"
- Wire it to a `<Sheet>` that opens from the bottom
- Inside `<SheetContent side="bottom">`, render the exact same syllabus map UI (progress bars, subject breakdown, "Now" badge)
- Add state `const [syllabusSheetOpen, setSyllabusSheetOpen] = useState(false)`

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Tools.tsx` | Responsive grid fix, card sizing, GPU compositing |
| `src/services/testGenerationService.ts` | Largest-remainder quota algorithm |
| `src/pages/TestSession.tsx` | Mobile syllabus Sheet |

