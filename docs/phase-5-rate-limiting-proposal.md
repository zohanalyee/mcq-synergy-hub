# Phase 5 — Rate-Limiting & Scraping Protection Proposal

**Status:** Proposal only. No code changes in this turn.
**Date:** 2026-07-21
**Author:** Lovable agent (for user approval)

---

## 1. Why we're looking at this

Two forces pulling in opposite directions:

- **Crawler openness (D2b / D3.5 win):** Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot MUST be able to fetch every prerendered board/topic/mock-test page freely. Our recent SEO gains depend on this.
- **Scraper defense:** The same anon RPCs that power our client also expose ~30k+ MCQs, job listings, scholarships, and board results as structured JSON. A single scraper with a loop can pull the entire content library in <1 hour.

Goal: **block the bulk-scraper, never touch the crawler.**

---

## 2. Current exposure (audit)

### 2a. Anon-readable RPCs (high value to scrapers)

| RPC / endpoint | Payload per call | Scraper appeal |
|---|---|---|
| `get_board_topic_mcqs` | Up to ~50 full MCQs w/ answers + explanations | **Very high** — this is our crown jewel |
| `get_practice_questions` | 10–50 MCQs per subject | High |
| `get_preview_questions` | 5 MCQs per test | Medium |
| `content_items` direct SELECT (RLS = approved=true) | Unlimited via PostgREST pagination | **Very high** |
| `external_opportunities` SELECT | Full job/scholarship rows | Medium |
| `get_platform_stats` | Aggregated counts only | Low |

### 2b. Traffic pattern baseline

Normal human pageview cost:
- 1 HTML fetch + 3–8 RPC calls (auth check, mastery, questions, stats).
- Peak organic user: ~40 RPC calls / minute.

Scraper burst signature:
- 200–2000 RPC calls / minute from one IP, no HTML fetches, no static asset fetches, no cookies.

The signal is very clean — humans and crawlers both fetch HTML + assets; scrapers usually don't.

---

## 3. Proposal

### 3.1 What we will NOT rate-limit

- Static prerendered HTML (`/`, `/mock-tests/*`, `/class-N/*`, `/exams/*`, `/tools/*`, etc.).
- `/sitemap*.xml`, `/robots.txt`, `/llms.txt`.
- `/og/*.jpg` and other public assets.
- Any request from a verified crawler UA (see 3.4).

Rationale: crawlers must never see a 429. One bad week of 429s to Googlebot can undo months of SEO work.

### 3.2 What we WILL rate-limit

Anon RPC calls to high-value endpoints (§2a), per IP, at the edge.

**Preferred layer — Cloudflare / hosting edge:**
- Rule 1: `path matches ^/rest/v1/rpc/(get_board_topic_mcqs|get_practice_questions|get_preview_questions)$` AND `cf.client.bot = false` AND no verified-bot UA → limit **60 req/min per IP**, action = 429 with `Retry-After: 60`.
- Rule 2: `path matches ^/rest/v1/content_items` with `?select=` or `?limit=` → limit **30 req/min per IP**.
- Rule 3: Any single IP exceeding **1000 RPC calls / 10 min** → 5-min block, log to audit.

**Fallback layer (if edge rules aren't possible):**
- New edge function `rpc-gateway` wraps the top 3 RPCs. Uses an in-memory token bucket keyed by `x-forwarded-for`. Bucket: 60 tokens, refill 1/sec. Overflow → 429.
- Trade-off: adds ~30ms latency, cold-start risk, and per-instance memory (not shared across regions). Only use if Cloudflare rules aren't an option.

### 3.3 Honeypot RPC

- Add `get_all_questions_dump` — publicly discoverable in schema, returns 200 with sentinel data (`{ warning: "scraping detected", ... }`) and logs the caller IP + UA to a new `scraper_signals` table.
- No real client ever calls it. Any hit = confirmed scraper → auto-escalate that IP to Rule 3 block.

### 3.4 Verified-bot allowlist (bypass)

For UAs matching `Googlebot|Bingbot|GPTBot|ClaudeBot|PerplexityBot|Applebot|DuckDuckBot`:
- Perform reverse-DNS check on first request from that IP; cache result 24h.
- If reverse DNS resolves to `*.googlebot.com` / `*.search.msn.com` / `*.openai.com` etc. → allowlist IP, skip all rate limits.
- If reverse DNS fails → treat as spoofed UA, apply strictest limits.

Reverse DNS check is the industry-standard defense against UA spoofing (Google, Bing, OpenAI all document it).

### 3.5 Monitoring & observability

- Every 429 logged to `ai_usage_logs.metadata` with `{ reason: 'rate_limit', ip_hash, endpoint }` (hash IP, don't store raw — GDPR-safe).
- Weekly admin view: top-10 blocked IPs, top-10 hit endpoints, false-positive candidates (IPs with >5 blocks but also HTML fetches in same session).

---

## 4. Trade-offs & risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| False-positive on shared IP (school lab, office, mobile carrier NAT) | Medium | Short block window (60s), never permanent. Rule 3 hard-block only after 1000 calls / 10 min — normal humans never reach this. |
| Verified crawler mis-classified | Low | Reverse-DNS check + explicit allowlist. Monitor Search Console for coverage errors weekly. |
| Cloudflare rule mis-fires on legitimate SPA usage | Low | Rules exclude verified bots and only target 3 specific RPCs. Normal user peaks at ~40 RPC/min; limit is 60. |
| Scraper switches to residential-proxy rotation | High (sophisticated actors) | Rate limits still bite per-IP; honeypot catches distributed scrapers. Full defense against proxy rotation needs paid bot-management (out of scope). |
| Added edge-function latency (fallback path only) | Medium | Skip fallback if Cloudflare rules work. |

---

## 5. Platform constraint disclosure

Per project memory: **the backend has no standard rate-limiting primitive.** Any implementation is ad-hoc. This proposal chooses the least-ad-hoc option (Cloudflare edge rules) over a custom edge function wrapper, but both are non-standard and will need explicit user approval before any code is written.

---

## 6. Recommended sequencing (when approved)

1. **Week 1 — observe only:** Ship `scraper_signals` table + honeypot RPC. Zero blocking. Just measure what the current scraper traffic looks like for 7 days.
2. **Week 2 — soft limits:** Cloudflare rules in "Log" mode (don't block, just log matches). Verify no crawler hits.
3. **Week 3 — enforce:** Flip Cloudflare rules to "Block". Watch Search Console + Analytics for 48h.
4. **Week 4 — tune:** Adjust thresholds based on real false-positive rate.

Total code footprint if all phases ship: ~1 migration, ~1 edge function, ~1 admin dashboard tab. Small.

---

## 7. Decision points for the user

Please confirm before we write any code:

1. **Do you have Cloudflare (or equivalent edge) access** to add rules at the hosting layer? If yes → preferred path. If no → fallback path (edge function).
2. **Approve the ad-hoc rate-limit approach** given the no-standard-primitive constraint?
3. **Approve the observe-first sequencing** (Week 1 = no blocking), or ship enforcement immediately?
4. **Honeypot RPC** — OK to add a fake public endpoint, or would you rather skip it?

Once you answer these, Phase 5 implementation is 1–2 turns of work. Until then, no code changes.
