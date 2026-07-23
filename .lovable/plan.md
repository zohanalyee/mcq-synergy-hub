# Phase 5 Implementation Plan — Week 1 (Observe-Only)

## Decisions received

1. **Edge layer:** Cloudflare/edge access available → preferred path.
2. **Approach:** Approve ad-hoc rate-limiting.
3. **Rollout:** Observe-first 4-week sequencing.
4. **Honeypot:** Add fake public endpoint now.

## Scope of this plan

Build only the **observation/measurement layer** (Week 1 of proposal). No blocking rules are activated yet. Cloudflare WAF rules will be provided as copy-paste templates for Log mode; user enables them manually in Cloudflare Dashboard.

## What will be built

### 1. Database: `scraper_signals` table

Stores signals from the honeypot and any future rate-limit events.

Fields:

- `id`, `created_at`, `updated_at`
- `ip_hash` — SHA-256 hash of caller IP (GDPR-safe, no raw IPs)
- `user_agent` — request User-Agent
- `endpoint` — which endpoint was hit (`honeypot_dump` initially)
- `signal_type` — `honeypot`, `rate_limit_trigger`, etc.
- `metadata` — JSONB for extra context (country, ASN if available, request path)

Access:

- `anon` can INSERT only via the honeypot edge function (service_role insert from function).
- `authenticated` and `anon` cannot SELECT.
- `service_role` has ALL.
- Admin-only SELECT policy using `is_admin()`.

### 2. Edge function: `honeypot-questions-dump`

- Path: `supabase/functions/honeypot-questions-dump/index.ts`
- Public, `verify_jwt = false`.
- Returns HTTP 200 with realistic-looking but useless sentinel JSON (`{ warning: "scraping detected", items: [] }`).
- Logs every call to `scraper_signals` via service_role client:
  - hashes the caller IP (`x-forwarded-for` first entry)
  - stores UA, endpoint name, signal_type = `honeypot`
- Includes proper CORS headers.
- No AI calls, no expensive operations.

### 3. Admin tab: "Scraper Signals"

- New tab under Admin → Overview (next to Lifecycle).
- Component: `src/components/admin/ScraperSignalsDashboard.tsx`
- Shows:
  - Total honeypot hits in last 24h / 7d / 30d
  - Top IP hashes by hit count
  - Recent signals table
  - Common User-Agent strings
- Uses `supabase--read_query` or RPC for admin fetch.

### 4. Cloudflare WAF rule templates (user-pasteable)

Provide exact rule expressions and actions for the user's Cloudflare Dashboard:

**Rule A — Honeypot escalation (Log mode for Week 1):**

```
(http.request.uri.path eq "/rest/v1/rpc/honeypot_questions_dump")
Action: Log
```

**Rule B — High-value RPC rate limit (Log mode for Week 1):**

```
(http.request.uri.path matches "^/rest/v1/rpc/(get_board_topic_mcqs|get_practice_questions|get_preview_questions)$" and not cf.client.bot)
Action: Log
```

**Rule C — Content_items table pagination (Log mode for Week 1):**

```
(http.request.uri.path matches "^/rest/v1/content_items" and http.request.uri.query matches "(select=|limit=)")
Action: Log
```

These will be documented in `docs/phase-5-cloudflare-rules.md` with screenshots-ready steps.

## What is NOT in this plan

- No blocking/429 responses yet.
- No reverse-DNS verified-bot bypass logic yet (Week 3).
- No edge-function fallback `rpc-gateway` (Cloudflare path is available).
- No changes to existing client code paths.

## Budget / credit impact

- Database migration: negligible.
- Honeypot edge function: zero AI, minimal compute.
- Admin dashboard: read-only, no AI.
- **Total expected AI credit cost: 0.**

## Sequencing after Week 1

- Week 2: flip Cloudflare rules to Log mode (templates provided).
- Week 3: flip to Block/Challenge with verified-bot bypass.
- Week 4: tune thresholds based on `scraper_signals` data.

## Deliverables

1. Migration file for `scraper_signals` table.
2. `supabase/functions/honeypot-questions-dump/index.ts`
3. `src/components/admin/ScraperSignalsDashboard.tsx`
4. Admin tab registration update.
5. `docs/phase-5-cloudflare-rules.md` with copy-paste WAF rules.

## Checkpoint

If credits run low after any step, we stop and the system remains safe: honeypot collects data, no blocking is active, no user-facing changes.

&nbsp;

# **Plan approved** — Week 1 (observe-only) shuru karein. Sab safe/zero-risk hai jaisa propose kiya. 

Build/typecheck clean hone ke baad, mujhe:

1. Cloudflare WAF-rule-templates dikhayen taake main khud Cloudflare-Dashboard mein Log-mode wale rules add kar sakoon

2. Admin panel mein "Scraper Signals" tab kahan milega batayen

Checkpoint-approach maintain karein — credits khatam hon to clean-jagah par ruk jayen.