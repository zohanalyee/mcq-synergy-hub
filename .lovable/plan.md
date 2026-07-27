# Batch 2 Audit — Backend (Supabase) + Security

Sirf **audit/report** hai — is turn mein koi fix nahi. Har finding: kya masla → kyun matter karta hai → severity → recommended fix. Guest-mode ka security-lens bhi neeche alag section mein hai.

---

## Severity legend

- **P0 (Critical)** — data leak / privilege escalation risk. Fix asap.
- **P1 (High)** — real risk but limited blast radius, or best-practice violation.
- **P2 (Medium)** — hardening / hygiene.
- **P3 (Low)** — cosmetic / informational.

---

## 1. Row-Level Security (RLS) — table-level

**F-B1 · Two tables have RLS ON but ZERO policies — [P2]**

- Tables: `telegram_media_buffer`, `telegram_media_groups`.
- Effect: anon/authenticated → 0 rows visible (RLS defaults to deny). Only `service_role` (edge functions) can read/write. So **not a data leak** — but it's silent: any future client-side query will just return empty with no error.
- Fix: add an explicit "service-role only, deny all others" comment-policy OR document that these are edge-function-only tables. No urgent action.

**F-B2 · All 77+ public tables have RLS enabled — good baseline [OK]**

- Linter did NOT flag any `rls_disabled_in_public` — this is a strong posture.

---

## 2. SECURITY DEFINER function exposure

**F-B3 · ~100 SECURITY DEFINER functions callable by `anon`/`authenticated` — [P1]**

- Supabase linter flagged 45 anon-executable + 55 authenticated-executable definer functions.
- Kya matter karta hai: SECURITY DEFINER = "runs as owner, bypasses RLS". Agar aisi kisi function ka body user-controlled input use kare bina sanitize kiye, ya wrong table return kare, to yeh RLS bypass ka rasta ban sakta hai.
- Yeh number **inflated** hai kyunki `is_admin()`, `has_role()`, `record_question_usage`, `get_platform_stats`, etc. sab intentionally public hain. But 100 is a LOT to audit manually.
- Fix (phased):
  1. Ek CSV export banayen: function name, arguments, body-length, called-from (client/edge/trigger).
  2. Three buckets: (a) intentional public RPCs, (b) admin-only (should have `is_admin()` guard inside), (c) trigger-only (revoke EXECUTE from PUBLIC).
  3. Bucket (c) sabse pehle lock down karein — no client should be calling them.

**F-B4 · Honeypot INSERT policy uses stale endpoint name — [P2, cleanup]**

- Policy on `scraper_signals`: `with_check: endpoint = 'get_all_questions_dump'`.
- Actual endpoint: `honeypot-questions-dump`. Matlab **honeypot function ke inserts abhi is anon-INSERT policy se pass NAHI ho rahe** — they only succeed because the edge function uses the service-role key (which bypasses RLS anyway). So it works, but the policy is misleading.
- Fix: update policy `with_check` to `endpoint = 'honeypot-questions-dump'`.

---

## 3. Anonymous / public writable paths

Yeh saari tables anon INSERT allow karti hain — audited each `WITH CHECK`:


| Table                        | Guardrail                                      | Verdict                                                        |
| ---------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| `contact_submissions`        | length limits + `user_id = auth.uid() OR null` | ✅ Good                                                         |
| `user_inquiries`             | length limits                                  | ⚠️ **F-B5**: no email format check, no rate limit — spammable  |
| `user_feedback` (guest)      | `is_guest=true AND user_id IS NULL`            | ⚠️ **F-B6**: no content-length caps, no rate limit — spammable |
| `empty_topic_analytics`      | strict field checks + `view_count=1`           | ✅ Good                                                         |
| `scraper_signals` (honeypot) | stale endpoint name                            | See F-B4                                                       |


**F-B5 · `user_inquiries` — anon spam risk [P1]**

- No email regex, no cooldown, no captcha requirement enforced at DB level.
- Impact: form-spam bot can flood table → admin inbox noise + DB bloat.
- Fix: (a) hCaptcha token verification in an edge function wrapper, (b) DB-level rate-limit trigger (max N inserts per IP/hour), (c) email regex CHECK on the column.

**F-B6 · Guest `user_feedback` — spam / abuse risk [P1]**

- Anyone can post feedback rows tied to no user. No length cap in policy.
- Impact: public reviews page can be seeded with spam/abusive content if display doesn't moderate.
- Fix: add length caps to the WITH CHECK, add moderation flag `is_approved` default false for guest rows, only render `is_approved=true` publicly.

---

## 4. Edge Function auth posture

**F-B7 · Every edge function has `verify_jwt = false` — [P1 for a subset]**

- Confirmed: **all 29 functions** are `verify_jwt = false` in `supabase/config.toml`.
- This is the recommended Lovable pattern (auth is validated in-code via `getClaims`), BUT it means each function MUST manually validate the JWT if it does user-scoped work.
- Need a per-function audit: which ones do sensitive work without a `getClaims`/`getUser` check?
- Quick sweep suggested (not done yet, will do in a fix pass): `generate-job-test`, `generate-test`, `convert-document-mcqs`, `rag-search`, `process-pdf-queue`, `process-book`, `process-jobtest-queue`, `process-agent-tasks` — these call AI (cost money) and should verify JWT + rate-limit per user.
- Fix: create a shared `requireUser(req)` helper in `_shared/` and adopt it across expensive/state-changing functions.

**F-B8 · Public webhooks — signature verification unknown — [P1 audit-followup]**

- `telegram-webhook`, `external-agent-webhook`, `honeypot-questions-dump` are intentionally public.
- Need to confirm each verifies its secret/signature header. If Telegram webhook doesn't check the secret token, anyone can spoof messages.
- Fix: audit each and enforce signature/secret checks.

---

## 5. Secrets & service-role hygiene

**F-B9 · No service_role_key found in client bundle — [OK]**

- `src/integrations/supabase/client.ts` uses the anon key only. ✅

**F-B10 · Unknown: which secrets are still set but unused — [P2]**

- We know `EXTERNAL_JOBS_GEMINI_KEY` is still used (rotation fallback).
- Recommended follow-up: run `fetch_secrets` and cross-check against grep for `Deno.env.get(...)` in `supabase/functions/`. Delete any orphaned secrets (reduces the 100-secret cap headroom).

---

## 6. Platform & auth config

**F-B11 · Leaked Password Protection is disabled — [P1]**

- Linter WARN 103. This is a one-click toggle in Supabase Auth settings — prevents users from signing up with passwords found in known breach lists.
- Fix: Enable in dashboard (Auth → Password Policy).

**F-B12 · Postgres version has pending security patches — [P1]**

- Linter WARN 104. Non-code fix — schedule a Supabase Postgres upgrade window.

**F-B13 · Two public storage buckets allow listing — [P2]**

- Linter WARN 3-4. Which buckets exactly need confirming. If they're OG images / public assets, this is fine. If they contain user uploads, it's a leak.
- Fix: identify the two buckets and either lock listing or confirm intentional.

---

## 7. Realtime / broadcast exposure

Not audited yet in depth. Follow-up: which tables are in `supabase_realtime` publication? Realtime respects RLS SELECT policies, so if any table has `SELECT` open to `anon` + realtime enabled, that stream is public. Cheap check, will add to fix pass.

---

## 8. Guest-Mode — SECURITY lens

(UX/growth lens goes in Batch 3.)

**F-B14 · Guest quiz state lives in `sessionStorage` only — [OK, by design]**

- `src/lib/guestSession.ts` → keys like `mcqsai_guest_session_{id}`. No PII, tab-scoped, expires with tab. ✅

**F-B15 · Guest question-count cap enforced client-side only — [P2]**

- `useStartQuickTest.ts` → `effectiveCount = !user ? Math.min(count, 20) : count`. A savvy guest can bypass by calling the AI endpoint directly.
- Because the AI generation for guests is skipped in that hook (`if (deficit > 0 && user)`), the cost blast is limited — BUT `generate-test` / `generate-job-test` edge functions themselves accept unauthenticated calls (verify_jwt=false + no getUser guard confirmed for some). See F-B7.
- Fix: enforce per-IP guest cap inside the edge function (small counter table keyed by IP + day).

**F-B16 · Guest-writable tables (spam surface) — see F-B5, F-B6 — [P1]**

- The two guest write paths (`user_inquiries`, `user_feedback` guest rows) are the highest-value abuse targets. Both need rate-limit + captcha + length caps.

**F-B17 · Guest read paths are fine — [OK]**

- Public reads (content_items approved, blog_posts published, external_opportunities) are appropriately scoped by `approved=true` / `is_active=true` filters in policies.

---

## Prioritized fix roadmap (my recommendation)

**Quick wins (< 1 credit each, low risk)**

- G2A: F-B4 (fix honeypot policy endpoint name)
- G2B: F-B11 (enable Leaked Password Protection — user action, 1 click)
- G2C: F-B13 (identify + lock down public bucket listing)

**High-impact (1-2 credits each)**

- G2D: F-B5 + F-B6 + F-B16 (harden guest write paths: length caps, captcha, moderation flag)
- G2E: F-B7 subset (add `requireUser` to expensive AI edge functions)
- G2F: F-B8 (verify webhook signatures)

**Larger project (audit-first, then batch)**

- G2G: F-B3 (SECURITY DEFINER function inventory + revoke unused EXECUTE)
- G2H: F-B12 (Postgres upgrade — schedule with downtime)

---

## Open questions for you

1. **Guest inquiry/feedback rate-limiting**: kya aap chahte hain captcha (hCaptcha, jo already sign-in par hai) inquiry form par bhi lagega? Ya sirf DB-side per-IP throttle kaafi hai?
2. **Public buckets**: kya aap ko yaad hai konse 2 storage buckets public hain? Ya main confirm karlun next fix pass mein?
3. **SECURITY DEFINER inventory**: yeh 1 credit ka read-only audit hai (CSV output). Chalayen abhi ya baad mein?
4. **Postgres upgrade**: yeh Supabase dashboard se hoga aur brief downtime la sakta hai — aap khud karenge ya hum saath schedule karein?

Aap batao — pehle quick wins (G2A/B/C) shuru karun, ya poori Batch 2 approve karke sequential order mein sab karein?

&nbsp;

Jawab: approved! please complete it in one 1 credit remain build we will consume more credits  tomorrow now just one credits.

1. Haan, captcha yahan (inquiry-form) bhi laga dein.

2. Public-buckets — mujhe yaad nahi, aap khud confirm kar lein.

3. SECURITY DEFINER deep-scan — haan, HAR HAFTE (weekly) karte rahenge, is turn mein bhi chala dein.

4. Postgres-upgrade (F-B12) ke baare mein confusion hai — yeh "Leaked Password Protection" se ALAG cheez hai. Please confirm karein: kya Postgres-version-upgrade FREE-plan mein bhi available hai, ya yeh bhi paid-feature hai? Agar free hai, to kitna downtime expected hai, aur best-time kab schedule karein (raat/low-traffic-hours)?

Quick-wins (G2A, G2B, G2C) + G2D (guest-spam-hardening with captcha) + G2E (AI-function login-checks) + G2F (webhook-verify) — sab approve, sequential-order mein shuru kar dein.

G2G (SECURITY DEFINER weekly-scan) bhi abhi chalayen.