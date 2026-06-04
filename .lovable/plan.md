## Goal

Two improvements to the Competitive Exam Practice area:
1. Make each mock-test card fully clickable to its SEO detail page (stretched-link pattern) while keeping inner buttons working.
2. Upgrade the detail page: a prominent top "Start Exam" button, plus textual subject-description editing in the custom syllabus (max 2 edits, "Customized" badges, AI sync, robust reset).

No new exams. No backend prompt rewrite. No DB schema change needed.

---

## Part 1 — Fully clickable card (stretched link)

File: `src/components/mock-tests/JobTestCard.tsx`

- Add `position: relative` to the card container `<div>` (the one with `glass-card themed-card`).
- Change the title `<Link to={detailHref}>` so it stretches over the whole card using `after:absolute after:inset-0 after:content-['']` (Tailwind stretched-link). Remove the `onClick stopPropagation` from the title link — instead, the inner interactive controls sit above it.
- Keep the title text itself the SEO-friendly `<Link>` (no wrapping the whole card in an `<a>`).
- Raise interactive controls above the stretched link with `relative z-10`:
  - "Syllabus" button row container
  - "Custom" button
  - The bottom "Start Exam" footer section (the start button + arrow circle)
  - The expanded syllabus panel and customization panel
- The hover lift (`whileHover`) stays. When `detailHref` is absent, fall back to current behavior (no stretched link).

Result: clicking anywhere on the card opens the detail page; the three controls keep their own actions.

---

## Part 2 — Detail page enhancements

File: `src/pages/MockTestDetail.tsx`

### 2a. Prominent top Start button
- Below the intro paragraph in the hero, add a large primary button "Start Exam" (with the existing generation flow). It triggers the same start logic the bottom `JobTestsTab` card uses. Implementation: lift a shared start handler — simplest approach is to render a primary button that calls into the existing `JobTestsTab` start flow. Since `JobTestsTab` encapsulates the generation, we will add an `autoStartRef`/callback or expose a lightweight `onStartTop` by reusing `handleStartJobTest`. Concretely: extract the start logic is overkill — instead add a prop to `JobTestsTab` (`renderTopCTA?: boolean`) is messy.
  - Chosen approach: add an optional `startSlot` is also messy. We will instead add a button in the hero that scrolls to and clicks the existing start, OR better: pass a callback. Final decision: add an optional prop `onReady?: (start: () => void) => void` to `JobTestsTab` that hands the parent a bound `start` function for the single test, so the hero button can call it directly and show the same generating state.
- The top button shows a loading state while generating.

### 2b. Editable subject descriptions
File: `src/components/mock-tests/CustomSyllabusEditor.tsx`

- Add an `originalSubject` to each section by capturing the official subject text per index (official sections already derived from `officialSyllabus`).
- Replace the static subject `<span>` with an editable `<Input>` for logged-in users (guests keep read-only text with a hint to sign in). The input edits `sections[idx].subject`.
- Weightage number input and enable/disable switch stay as-is.

### 2c. Strict 2-change limit
- A subject is "altered" when its current `subject` text differs (trimmed, case-sensitive) from its official original text.
- Compute `alteredCount` from sections vs official.
- When a user types in a subject input that is currently unaltered AND `alteredCount` already equals 2, block the edit: keep the input disabled for not-yet-altered rows once the limit is hit, and on attempted focus/typing show a toast: "Limit reached: You can only alter up to 2 subjects." Already-altered rows remain editable (so they can be refined or reverted).

### 2d. Visual cue
- Next to any altered subject input, show a small `Badge` "Customized" (quote-style/secondary variant) so non-official items are obvious.

### 2e. AI integration sync
- No generator change required: `getEffectiveSyllabus()` already maps `sections[].subject` → `topic`, and `JobTestsTab` sends `topic: item.subject` to the `generate-test` edge function, preserving weightage via the Largest Remainder quota and the existing "Simple Pakistani competitive-exam English" prompt rules. Saving the edited subject text is sufficient for the AI to read the new descriptions.
- The saved `sections` jsonb already stores `subject` as free text, so edits persist with the existing `saveCustomSyllabus`.

### 2f. Robust reset
- "Reset to official" already calls `deleteCustomSyllabus` and restores `official`. Confirm it also clears the textual edits and notes on the UI instantly (it resets `sections` to `official`, `notes` to "", and `hasSaved` to false). Ensure the altered count resets to 0 and badges disappear.

---

## Technical notes

- No database migration: `job_test_custom_syllabus.sections` is `jsonb` and already holds the (editable) `subject` string; textual edits and weightage are stored within it.
- `CustomSyllabusSection` type stays `{ subject, percentage, enabled }`; the "altered" status is derived at render time by comparing against the official sections (by index), not stored separately.
- Stretched-link is pure CSS/Tailwind; no router or logic change beyond z-index layering.

## Files touched

- `src/components/mock-tests/JobTestCard.tsx` — stretched link + z-index layering.
- `src/pages/MockTestDetail.tsx` — top Start button wiring.
- `src/components/mock-tests/JobTestsTab.tsx` — expose bound start callback for the top CTA.
- `src/components/mock-tests/CustomSyllabusEditor.tsx` — editable subjects, 2-edit limit, badges, reset behavior.
