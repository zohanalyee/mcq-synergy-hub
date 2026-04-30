## Goal

Make the app look stunning by default (visible Aurora, premium presets) and dramatically simplify the Settings dialog so a non-technical user only sees one-click themes — sliders/atmosphere are hidden behind an "Advanced" accordion.

---

## 1. Boost Aurora Background Visibility

**File:** `src/index.css` (lines ~158–168)

- Increase base `.aurora-blob` opacity from `0.18` → `0.55` (light mode default).
- Add a dark-mode override (`.dark .aurora-blob { opacity: 0.38; filter: blur(100px); }`) so blobs glow but don't wash out the dark UI.
- Slightly stronger blur (`blur(100px)`) for smoother bleed.

**File:** `src/components/AuroraBackground.tsx`

- Bump per-blob inline `background` alpha values: `--brand-from / 0.55` → `0.95`, `--brand-to / 0.5` → `0.85`, third blob → `0.8`. (CSS opacity multiplier still keeps things tasteful.)
- Increase blob size: `60vw → 75vw`, `55vw → 70vw`, `50vw → 65vw` so they bleed into the center of the viewport.
- Reposition third blob slightly more central (`bottom: -10%; left: 25%`) to fill the middle.
- Strengthen the radial wash on the container background (alpha `0.05` → `0.12`).

## 2. Premium Defaults

**File:** `src/contexts/AppearanceContext.tsx`

Update `defaultSettings`:
- `atmosphereMode`: keep `'flow'` (already premium), confirmed.
- `colorMix`: `'default'` (signature violet/pink/cyan) — already correct.
- `cardsOpacity`: 95 → 90 (slightly more glassy out of the box).
- `interfaceOpacity`: 85 → 80.

These defaults apply to any new visitor (no localStorage / no global override row).

## 3. Simplify the Settings Menu

**File:** `src/components/settings/AppearanceSettings.tsx` — full restructure.

New top-to-bottom order in the Appearance tab:

1. **Tiny sync status pill** (kept, unchanged).
2. **Ready-made Themes** (promoted to top, large cards):
   - 2×2 grid of big buttons for `Default`, `Sunset`, `Ocean`, `Forest`.
   - Each card ~72px tall, full gradient fill preview using `mixLibrary[id]`, label overlay.
   - Selected theme shows a ring + check icon.
   - One click calls a new helper `applyTheme(presetId)` that sets:
     - `colorMix = presetId`
     - `atmosphereMode = 'flow'` (guaranteed visible Aurora)
     - `cardsOpacity = 90`, `interfaceOpacity = 80`, `sidebarOpacity = 90`
     - Picks a sensible matching `accentColor` per theme (default→purple, sunset→orange, ocean→blue, forest→green).
   - Implemented inline in the component using existing `update*` setters (no context API change required).
3. **Live Preview** card (kept, moved just under themes).
4. **Accent color swatches** (kept — small row, still useful and visual, not technical).
5. **Advanced UI Controls** — wrapped in shadcn `<Accordion type="single" collapsible>` (collapsed by default). Inside:
   - Atmosphere mode toggle (Solid / Flow / Aero).
   - Interface / Sidebar / Cards opacity sliders.
   - Custom mix color pickers + Apply button.
6. **Admin "Set as Global Default"** button (kept, admin-only).
7. **Reset to Global Defaults** button (kept).

All removed pieces are preserved — they just live inside the Advanced accordion so the default view shows only themes + accent + reset.

---

## Technical Notes

- No DB changes, no context API additions. The "one-click theme" simply batches existing setters; the debounced cloud-save in `AppearanceContext` already coalesces them into a single upsert.
- Accordion uses the existing `@/components/ui/accordion` (shadcn). No new deps.
- `StaticBackground.tsx` (low-end fallback) already reads from `mixLibrary` so it benefits from premium presets automatically; no change needed there.
- Existing users with stored `appearance-settings` in localStorage keep their settings — only fresh users get the new defaults.

## Files Touched

- `src/index.css` — Aurora opacity/blur + dark-mode rule.
- `src/components/AuroraBackground.tsx` — bigger, brighter, more central blobs.
- `src/contexts/AppearanceContext.tsx` — bump default opacities.
- `src/components/settings/AppearanceSettings.tsx` — restructure (themes on top, advanced accordion at bottom).
