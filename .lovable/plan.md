# Pending Work — Phased Plan

Sequence chosen for lowest-risk → highest-value, cheap items first.

---

## Phase 1 — OG Image Audit (Quick, read-only)

**Goal:** Confirm og:image tags are present in live raw HTML and not stripped by `dedupe-og.mjs`.

**Steps:**

1. `curl -s` raw HTML for 3 sample URLs:
  - `https://mcqsai.com/` (homepage)
  - `https://mcqsai.com/mock-tests` (category)
  - `https://mcqsai.com/jobs` (category with dedicated banner)
2. Verify: exactly one `og:image` tag, absolute HTTPS apex URL, category-correct banner.
3. Verify banner files exist in `/public/og/` and are reachable (HTTP 200, valid JPEG).
4. Re-read `scripts/dedupe-og.mjs` logic to confirm it **keeps the last** occurrence (Helmet-injected) — not accidentally dropping the only one.
5. Deliverable: short report + Facebook Sharing Debugger + WhatsApp cache-refresh steps.

**No code changes unless a bug is found.** If found, minimal fix + re-scrape guide.

---

## Phase 2 — Header AI Coach Link (Tiny UI)

**Goal:** Add `AI Coach` to top-level desktop + mobile nav.

**Steps:**

1. `src/components/header/DesktopNavigation.tsx`: add `AI Coach → /features/ai-coach` in the `More` dropdown (keeps primary 6 slots intact on smaller desktops).
2. Mobile nav component: add same entry with a `New` badge to match footer.
3. Icon: reuse `Sparkles` or `Brain` from lucide (consistent with Coach branding elsewhere).

No routing / backend changes.

---

## Phase 3 — Phase 4b: Per-User AI Top-Up (Backend + guardrails)

**Goal:** Trigger AI generation ONLY when a specific user has exhausted the DB pool for a given test/subject. New questions land in DB permanently.

**Design:**

- In `JobTestsTab.tsx` sampling loop (already mastery-ranked), after pool-fetch:
  - If `unseen + learning + review < target * 0.5` AND `mastered ≥ pool_size * 0.7` → treat as "exhausted for this user".
  - Trigger `generate-job-test` in background with a `topup_reason: 'user_exhausted'` flag.
- New table `user_ai_topup_log(user_id, job_test_id, subject, created_at)` for caps.
- **Guardrails (hard-coded, tunable via `system_settings`):**
  - Per-user: max **2 top-ups/day**, **10/month** across all tests.
  - Per-user/test cooldown: **6 hours**.
  - Global daily quota guard: reuse existing `checkQuota` in `_shared/quotaManager.ts`.
  - Only for authenticated users (guests never trigger).
- Generated questions saved with `admin_approved = true` (already default in pipeline) so they're immediately reusable across users.

**Migration:**

- `user_ai_topup_log` table + RLS + GRANTs.
- `system_settings` row: `user_topup_config` = `{ daily: 2, monthly: 10, cooldown_hours: 6, min_pool_ratio: 0.5 }`.

**Edge fn change:** `generate-job-test` accepts optional `triggering_user_id` + `topup_reason`, writes log row on success.

---

## Phase 4 — Phase 4c: Admin Lifecycle Dashboard (Read-only, DB-heavy)

**Goal:** Per-question visibility: origin, usage across tests, attempts, unique users, mastery distribution, overused flag.

**Backend (RPCs, `SECURITY DEFINER`, admin-only via `is_admin()`):**

1. `get_question_lifecycle(p_question_id uuid)` → single-question detail:
  - source (AI/manual/telegram), created_at, subject, tests using it, total attempts, unique users, mastery counts (learning/review/mastered), avg accuracy, `is_overused` (attempts > 500 OR unique_users > 200).
2. `get_lifecycle_overview(filters)` → paginated list for the dashboard grid.
3. `get_test_lifecycle(p_job_test_id)` → per-test rollup.
4. `get_user_lifecycle(p_user_id)` → per-user attempted question list (admin drill-down).

**UI:** New admin tab `Content Lifecycle` under `AdminTabs.tsx`:

- Filter bar (subject, source, overused, date range).
- Table with sortable columns + row-expand for mastery distribution.
- Sub-views: "By Test" / "By User" toggles.

No writes; purely observational.

---

## Phase 5 — Rate-Limiting / Scraping Protection Audit (Proposal only)

**Goal:** Written proposal, no code. Balance crawler openness (D2b) vs bulk-scraper defense.

**Audit scope:**

1. Enumerate anon-readable RPCs/tables reachable from browser (list from schema).
2. Identify high-value targets for scrapers: `get_board_topic_mcqs`, `get_practice_questions`, `get_preview_questions`, `content_items` direct SELECT.
3. Traffic pattern review: what's a "normal" pageview cost vs a scraper burst.

**Proposal outline (to present, not implement):**

- **Do NOT rate-limit** static prerendered HTML (crawlers must fetch freely).
- **Do rate-limit** anon RPC calls at the edge:
  - Cloudflare / hosting-layer rules preferred (per-IP: 60 req/min for RPC endpoints).
  - Fallback: Supabase edge function `rpc-gateway` wrapping high-value RPCs with in-memory per-IP token bucket.
- **User-Agent allowlist bypass** for verified bots (Googlebot, Bingbot, GPTBot, ClaudeBot) — reverse-DNS check.
- **Honeypot RPC** returning 200 with sentinel data to detect scrapers.
- **Monitoring**: log 429s to `ai_usage_logs` metadata for observability.
- Tradeoffs section: false-positive risk on shared IPs (schools, offices), mitigation via short block windows (60s) not permanent bans.
- Confirm current per-project no-standard-rate-limiting-primitive constraint; user must approve ad-hoc approach.

Deliverable: markdown proposal in chat; wait for approval before any code.

---

## Execution Order & Checkpoints

1. **Phase 1** (OG audit) — ~1 turn, mostly curl + read.
2. **Phase 2** (Header link) — ~1 turn, 2 file edits.
3. **Phase 3** (4b top-up) — 2-3 turns: migration → edge fn → client wiring.
4. **Phase 4** (4c dashboard) — 2-3 turns: RPCs → UI tab → polish.
5. **Phase 5** (rate-limit proposal) — 1 turn, doc only.

Stop at any clean checkpoint if budget runs low; each phase is independent and shippable.

&nbsp;

&nbsp;

Plan approved — jaisa sequence diya hai waisay hi shuru karein: Phase 1 (OG-audit) se Phase 5 (rate-limit proposal) tak, ek-ek karke. Har phase complete hone par summary dein, main review/approve karta rahunga. Agar credits/budget beech mein khatam ho, clean checkpoint par ruk jayen — baaqi agli baar continue karenge.