# Batch 7 — Featured Exams block (homepage + /exams), admin-controlled

Plan only. Nothing changes until you approve.

## 1. What the audit found

- **Homepage (`src/pages/Index.tsx`)**: order is: the dismissible "Exciting Update Coming Soon" strip (`UpcomingFreeBanner`), then the main section (a typing headline, the H1, then the big Mock Tests / Subject buttons). It already uses framer-motion fade-ins. Lower sections load later (`DeferredSection`, lazy-loaded testimonials/stats).
- **/exams (`src/pages/exams/ExamsHub.tsx`)**: a fixed card list written in code, plus breadcrumb → H1 → intro → buttons. No database reads.
- **How static HTML is made**: pages that render without waiting for the database are pre-built by `scripts/prerender-routes.mjs` + `src/prerender.tsx`. Pages that need the database get their head tags from `inject-meta.mjs`. The pre-build step (`package.json` prebuild) already saves database values into JSON snapshots before each build: `fetch-exam-facts.mjs` → `src/data/examFactsSnapshot.json`, `fetch-whatsapp-channel.mjs` → `src/data/whatsappChannelSnapshot.json` (keeps the old file if the read fails). The same snapshot pattern works for featured cards.
- **Exam dates in the snapshot**: STHP has `applyBy: "29 October 2026"` (text only, with no ISO date field). NTHP OGDC round has `closesIso: "2026-12-15"`. Both are used to work out each card's deadline.
- **WhatsApp link**: `useWhatsAppChannel()` = snapshot first, then a live read. The current snapshot is `""`, because no URL is saved in admin yet. The fallback URL you gave will be used whenever it is empty.
- **system_settings access**: visitors who aren't signed in can read only the `whatsapp_channel_url` key, under the RLS policy from Batch 5. Putting cards in system_settings would mean making a second key public. A separate table is cleaner (see §3).
- **Event helpers**: `src/lib/growthEvents.ts` (`trackEvent`, `trackWhatsAppJoin`, …) are queued until the delayed GA4 loader runs. Nothing loads earlier.
- **Old 2027 date (point 8)**: in the project files, the only "2027-12-15 / 15 Dec 2027" text is in `src/pages/exams/NthpGuide.tsx` (FAQ and note). It explains on purpose that the poster's 2027 is a typo. That is correct and should stay. `examFactsSnapshot.json` already says 2026-12-15. No generated sitemap or JSON file in the project has 2027-12-15. The live site's static HTML for the NTHP listing page was built before your fix, so it will show the corrected date after the next publish. I will check this in Build step 1 using the published HTML.
- **To confirm first in Build** (not yet checked): that `/` and `/exams` are in the list of pre-built pages. I will confirm by reading the static HTML for both.

## 2. Recommendation: a new table `featured_cards` (not a system_settings JSON)

Why: each card gets its own row, so your phone edits can't break the other cards. Only active cards are public through RLS. Sorting works per row. No change to the system_settings read policy.

Columns: `title`, `subtitle` (short line), `badge` (APPLY NOW | LIVE | CLOSING SOON | PRACTICE NOW | COMING SOON), `href` (an internal `/path` or an `https://` official URL), `deadline_date` (date, optional), `exam_slug` (optional; when set, the deadline comes from exam_pages), `closed_days` (int, default 0: the card hides right after the deadline; N = show "Closed" for N days), `sort_order`, `is_active`, `icon` (a name from the allowed list), `placements` (home / exams / both), plus timestamps.

Global switch: `system_settings.featured_block_enabled` (true/false), which hides the whole block on both pages in one tap. This key is also made publicly readable (that one key only).

## 3. Automatic badge and date rules (one shared helper, Pakistan time)

New `src/lib/featuredCards.js` (shared by the browser and the build, like `opportunityExpiry.js`):
- Deadline = the card's own date, else the date from exam_pages (`closesIso`, or `applyBy` turned into a date).
- "Today" uses UTC+05:00.
- Before the deadline: subtext "X days left" ("Last day" on deadline day). If 7 days or fewer are left, the badge becomes CLOSING SOON.
- After the deadline: hidden, or "Closed" for `closed_days` days, then hidden.
- No deadline: badge as set, no countdown.
- Empty or all-inactive: the block is not shown at all (no empty space), so the page looks exactly as it does today.

## 4. Placement and static HTML

- **Homepage**: insert `<FeaturedExams placement="home">` right after the H1/typing headline and before the Mock Tests / Subject buttons. On mobile it shows as a compact list of 3 cards in fixed-height rows (about 64px each), so 2–3 are visible on the first screen. On desktop it is a 3-column row. No framer-motion on it.
- **/exams**: insert below the intro paragraph and above the existing buttons.
- **Static HTML**: new prebuild script `scripts/fetch-featured-cards.mjs` writes `src/generated/featuredCards.json` (keeps the old file if the read fails). The component renders from this snapshot on first paint, so the cards appear in pre-built HTML as real `<a href>` links. Then it refreshes from the live table, so admin edits show up without a rebuild.
- **Hydration safety**: the badge and "days left" are worked out from a date that is fixed when the build runs and passed to the page, then recalculated after the page loads. Fixed heights mean a text change causes no layout shift. If a card expires between build and visit, it changes to "Closed" (same height) rather than disappearing during loading, and is removed after load. That causes no shift because the block keeps its reserved height for the snapshot count.
- No change to the title, meta or H1 on any page.

## 5. Visual design (CSS only, existing tokens)

- Card: `bg-card`, a 1px gradient border built from the existing `bg-brand-gradient` (violet→magenta→cyan), and a soft `shadow-brand` glow. Same rounded corners as the existing cards.
- LIVE / APPLY NOW: a small dot with a pulse animation (`transform: scale` + `opacity` only).
- CTA: a light shimmer sweep done with a moving pseudo-element (`transform: translateX`).
- COMING SOON: a slow background-position gradient drift on a light layer, with the "Get WhatsApp alert" CTA → channel URL + `?utm_source=homepage&utm_medium=featured_card` (on /exams: `utm_source=exams`).
- `@media (prefers-reduced-motion: reduce)` turns all of these off.
- Uses semantic tokens only, so it works in light and dark mode. Icons come from lucide-react, which is already installed (fixed list: GraduationCap, Building2, FileText, Timer, Bell, Sparkles). No images, no new packages, no new fonts.

## 6. Launch cards (seeded by the migration)

| # | Title | Badge | Deadline source | Link | Line |
|---|---|---|---|---|---|
| 1 | Sukkur IBA STHP 2027 | APPLY NOW | exam_pages `sthp` (29 Oct 2026) | /exams/sthp | Free practice PDF + full mock test. Apply before the deadline. |
| 2 | IBA Karachi NTHP (OGDC) | APPLY NOW | exam_pages `nthp` (15 Dec 2026) | /exams/nthp | Free practice PDF and mock test for the NTHP round. (No mention of STS.) |
| 3 | IBA Community Colleges & Schools (STS) | PRACTICE NOW | none | /exams/sts | Mock tests for all announced posts are ready. Get a WhatsApp alert for the next announcement. |

No Junior Clerk card. No COMING SOON card is created now; the type stays available in admin. The PDF pages stay linked from the hub pages as they are today. The cards link only to the hubs, so each card stays one clean link.

## 7. Admin screen (mobile-first)

New `src/components/admin/FeaturedCardsManager.tsx`, shown next to the existing Exam Pages manager:
- A list of cards, each with an on/off switch, up/down arrows (same as navigation_items), an Edit button, and a preview of the automatic badge/countdown.
- Edit sheet: native `<select>` for badge, icon and placement (per the dialog rule). Date field. Optional exam-page dropdown. "Closed for N days" number. Checks that the link is a `/path` or an `https://` URL.
- At the top: the "Show Featured block" master switch.

## 8. Measurement

- In `growthEvents.ts`: `trackFeaturedClick(slot, label, badge)` → `featured_click`, and `trackFeaturedWhatsApp(slot)` → `featured_whatsapp_click`. `slot` = `home-1`, `exams-2`, etc. No personal data.
- They go through the existing queue and delayed GA4 loader. No timing changes.
- Both can be marked as key events in GA4 (Admin → Events → star) after they first appear, usually within 24h. That is a manual step for you.

## 9. Sitemap, cache, publishing

- Sitemaps: **no changes** (cards only link to pages that are already listed).
- Cache: no new rules. Homepage HTML is cached for up to about 4h on the edge (as you stated; I haven't re-checked it in Cloudflare). After an admin edit, the live refresh shows the new cards about 1–2 seconds after a visitor opens the page, even when the HTML is cached. Google's static copy updates on the next publish, or once the 4h cache expires after a publish. A Cloudflare purge of `/` and `/exams` is optional, for urgent changes only.

## 10. Risks and what NOT to do

- **Speed**: the live read is one small request, made after first paint. It is never blocking and never on the critical path. Do not load cards with framer-motion. Do not add images or a carousel/slider library. Do not autoplay rotation.
- **Layout shift**: fixed row heights and space reserved for the snapshot count. Do not show the block only after the live data arrives.
- **Stale cards**: automatic hide/Closed in Pakistan time. If the snapshot is old, the browser recalculates.
- **Hydration**: date fixed at build, recalculated after load (see §4).
- **Don't**: change the H1/title/meta, move the "Coming Soon" banner, touch the loader delays, or put cards in sitemaps.
- **Not touched**: questions, tests, quality gate, AI budget code, external_opportunities.

## 11. Technical details (files)

- New migration: table `featured_cards` + GRANT select to anon/authenticated, all to service_role + RLS (public reads active rows only; admins manage via `is_admin()`) + updated_at trigger + 3 seed rows. Plus `system_settings.featured_block_enabled=true` and a read policy for that one key.
- New: `src/lib/featuredCards.js` (+ `.d.ts`), `src/lib/featuredCards.test.mjs`, `scripts/fetch-featured-cards.mjs`, `src/generated/featuredCards.json`, `src/hooks/useFeaturedCards.ts`, `src/components/home/FeaturedExams.tsx`, `src/components/admin/FeaturedCardsManager.tsx`.
- Edited: `src/pages/Index.tsx` (one line placing the block), `src/pages/exams/ExamsHub.tsx` (one line), `src/lib/growthEvents.ts` (2 helpers), `src/index.css` (keyframes + reduced-motion), `package.json` prebuild (add the fetch script), admin page that hosts the manager, `AGENTS.md` (one rule).
- **Tests** (one per rule): "X days left" in Pakistan time across UTC midnight; CLOSING SOON at 7 days or fewer; hidden after the deadline with closed_days=0; "Closed" kept for N days; exam_slug date takes priority when the card has no own date; STHP `applyBy` text → 2026-10-29; NTHP → 2026-12-15; inactive/empty list → nothing shown; a bad link is rejected.

## 12. Rollout and undo

1. Run the migration (with the 3 cards) → build → check the static HTML of `/` and `/exams` for the 3 `<a href>` links, H1/title/meta unchanged byte-for-byte, and no change in sitemaps.
2. Preview on a phone-size screen (light and dark, reduced motion).
3. You publish. Undo: switch the master toggle off (instant), or turn single cards off.

## 13. Mobile owner checklist

- **Add**: Admin → Exam Pages → Featured Cards → "+ Add" → title, line, badge, link, optional date or exam page → Save.
- **Reorder**: tap the ↑/↓ arrows on a card.
- **Switch off**: tap the card's switch, or "Show Featured block" to hide all.
- **Check**: open the homepage. The change appears within seconds. Google's copy updates after the next publish.

## 14. Lighthouse before/after (mobile)

- Before: 3 mobile Lighthouse runs each on `https://mcqsai.com/` and `/exams` (median LCP, TBT, CLS, INP-proxy). Record them in `docs/batch-7-measurement.md`.
- After publish: the same 3 runs. Pass criteria: CLS unchanged (≤0.01 added), LCP no worse than +100ms of median noise, TBT no worse, no new network request before load other than the existing one. If it fails: master switch off, then investigate.
- CrUX field data needs about 28 days to show the change; no claim will be made before then.

## Open question

- STHP card line: may it say "Apply by 29 Oct 2026" text in addition to the countdown? Default: countdown only.
