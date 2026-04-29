## Scope

The cards in your screenshots ("AI Content Studio" tag + full-width blue "View Details") are rendered by `**src/components/external/ExternalOpportunitiesSection.tsx**` — used on both `/jobs` and `/scholarships` for the "External Jobs" / "External Scholarships" sections. (Internal `JobCard`/`ScholarshipCard` already use the compact `GlassCard` style and are not what's shown.)

So this overhaul is a single-file redesign of `ExternalOpportunitiesSection.tsx`.

## Design changes

### 1. Hover physics & depth

- Card: `transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10`
- Keep the existing decorative gradient blob (already provides "alive" glow), make it slightly stronger on hover.
- Add a subtle gradient ring on hover via `hover:ring-1 hover:ring-primary/20` for the "gradient border" feel.

### 2. Header & logo

- Wrap the logo in a **squircle** container: `rounded-xl border border-gray-100 dark:border-white/10 shadow-sm bg-white p-1` with `w-12 h-12` (object-contain inside, so logos breathe instead of being cropped/stretched).
- **Hide** the "AI Content Studio" / `source_name` chip from the visible card. (Keep the data — render it only as a tiny `title` tooltip on the logo for transparency, or omit entirely.)
- Promote the category pills (Govt / Private / International / Federal) to **modern pastel pill badges**: `rounded-full px-2.5 py-0.5 text-[10px] font-semibold` with vibrant pastel backgrounds (Govt=emerald, Private=indigo, International=violet, Federal=amber). Already mostly pastel — just round to full pill, tighten padding, drop heavy borders.

### 3. Typography & spacing

- Title: `text-base font-semibold text-gray-900 dark:text-foreground line-clamp-2 leading-snug`.
- Description: keep `line-clamp-2`, `text-xs text-muted-foreground`.
- Organization / Location rows: `text-sm text-gray-500 dark:text-muted-foreground` with `h-3.5 w-3.5` Lucide icons (`Building2`, `MapPin`), tighter `gap-2`, no background plates.

### 4. Footer redesign (the critical bit)

- **Remove** the full-width blue `<Button>View Details</Button>`.
- Replace with a flex row `justify-between items-center pt-3 border-t border-border/40`:
  - **Left — Deadline badge**:
    - No deadline → muted `Calendar` + "No deadline" pill (`bg-muted/40 text-muted-foreground`).
    - Expired → `bg-gray-100 text-gray-500 line-through`.
    - ≤ 7 days → `bg-red-50 text-red-700 ring-1 ring-red-200` with `Hourglass` icon + pulse dot.
    - ≤ 30 days → `bg-orange-50 text-orange-700` with `Clock` icon.
    - > 30 days → `bg-emerald-50 text-emerald-700` with `Calendar` icon.
    - Shape: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium`.
  - **Right — Pill icon-CTA**:
    - For external jobs/scholarships → `<Link>` to `/opportunity/<slug>`.
    - Style: `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 group-hover:translate-x-0.5`.
    - Label: type === "job" ? "Apply" : "View" + `<ArrowRight className="h-3.5 w-3.5" />`.
- Drop the now-redundant in-content deadline block (lines 218–234) since the deadline moves to the footer badge.

### 5. Misc cleanup

- Keep "Pending Review" badge but move it into the header pill row (so footer stays clean).
- Card body padding: `CardHeader pb-2`, `CardContent pt-0 pb-3 px-5` for slightly more breathing room.

## Files to edit

- `src/components/external/ExternalOpportunitiesSection.tsx` — only file changed.

## Out of scope

- Internal `JobCard.tsx` / `ScholarshipCard.tsx` (GlassCard-based) — they already match the compact aero aesthetic and aren't what's shown in your screenshots. Let me know if you also want them redesigned to this new style and I'll do a follow-up.

## Risk

Very low — single presentational file, no logic/data changes, both `/jobs` and `/scholarships` consume this component identically. 

**This plan is absolutely BRILLIANT and 100% APPROVED! 🚀**

You correctly identified that the target is `ExternalOpportunitiesSection.tsx`. Your plan for the Squircle logos, modern pastel pills, dynamic deadline badges (especially the red/orange/green alert logic based on days left), and the sleek footer CTA is exactly the 'Enterprise SaaS' aesthetic I am looking for.

**Please execute this redesign in** `ExternalOpportunitiesSection.tsx` **immediately.** *(Note: Let's leave the internal* `JobCard` *and* `ScholarshipCard` *out of scope for now. We will evaluate them later once we see how stunning this external section looks!)*

Go ahead and deploy these changes!