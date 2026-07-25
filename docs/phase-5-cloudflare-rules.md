# Phase 5 — Cloudflare WAF Rule Templates

**Status:** Week 1 (observe-only) — Log mode only. No blocking yet.  
**Last updated:** 2026-07-25

> ⚠️ **Free-plan constraint:** Cloudflare Free plans do **not** allow the `matches` (regex) operator. The expressions below use only Free-plan-compatible operators: `eq`, `contains`, and `in`.  
> ⚠️ **"Log" action is Enterprise-only:** On Free/Pro plans the `Log` action is unavailable. Use **Action: Skip** → **WAF components to skip: All rate limiting rules** instead. This records the request in Cloudflare Security Events without blocking it and without affecting your existing custom rules.

---

## What these rules do

These rules match high-value RPC endpoints that scrapers love and log every match. During Week 1–2 they **only log**; they do not block. Once you are comfortable that legitimate crawlers (Googlebot, Bingbot, etc.) are not being matched, you can flip them to **Block/Challenge** in Week 3.

## Where to paste these rules

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → your domain → **Security** → **WAF** → **Custom rules**.
2. Click **Create rule**.
3. Give it a name, paste the expression, set the action, and save.

---

## Recommended: 1-slot combined rule (Free plan)

If you only have **1 free custom-rule slot** left, use this single rule. It covers the honeypot, high-value RPCs, and bulk `content_items` pagination in one expression.

**Name:** `Phase 5 — Scraper observation (1 slot)`

**Expression:**
```
(
  http.request.uri.path eq "/functions/v1/honeypot-questions-dump"
  or http.request.uri.path in { "/rest/v1/rpc/get_board_topic_mcqs" "/rest/v1/rpc/get_practice_questions" "/rest/v1/rpc/get_preview_questions" }
  or (
    http.request.uri.path eq "/rest/v1/content_items"
    and (
      http.request.uri.query contains "select="
      or http.request.uri.query contains "limit="
    )
  )
)
and not cf.client.bot
```

**Action:** `Skip` → **WAF components to skip:** `All rate limiting rules`

**Notes:**
- `cf.client.bot` excludes verified good bots (Googlebot, Bingbot, etc.).
- This is observe-only. The request still reaches Supabase and is logged by the honeypot edge function.
- If the rule does not deploy with `in`, replace the `in` line with three separate `eq` conditions joined by `or` (see Rule B alternative below).

---

## Rule A — Honeypot endpoint

**Name:** `Phase 5 — Honeypot hit log`

**Expression:**
```
(http.request.uri.path eq "/functions/v1/honeypot-questions-dump")
```

**Action:** `Skip` → **WAF components to skip:** `All rate limiting rules`

**Notes:**
- This is the decoy Edge Function we deployed in Supabase (`honeypot-questions-dump`).
- Any hit = confirmed scraper (no real client calls this).
- After Week 2 you can change the action to `Block` with a 429 response.

---

## Rule B — High-value MCQ RPCs

**Name:** `Phase 5 — High-value RPC rate limit (log mode)`

**Expression (preferred, uses `in`):**
```
(
  http.request.uri.path in { "/rest/v1/rpc/get_board_topic_mcqs" "/rest/v1/rpc/get_practice_questions" "/rest/v1/rpc/get_preview_questions" }
  and not cf.client.bot
)
```

**Alternative expression (if `in` fails on your plan, use `eq` + `or`):**
```
(
  (
    http.request.uri.path eq "/rest/v1/rpc/get_board_topic_mcqs"
    or http.request.uri.path eq "/rest/v1/rpc/get_practice_questions"
    or http.request.uri.path eq "/rest/v1/rpc/get_preview_questions"
  )
  and not cf.client.bot
)
```

**Action:** `Skip` → **WAF components to skip:** `All rate limiting rules`

**Notes:**
- `cf.client.bot` excludes verified good bots (Googlebot, Bingbot, etc.) from being logged.
- In Week 3, change action to `Block` and add a rate-limiting condition (see tuning section below).

---

## Rule C — Content items table pagination

**Name:** `Phase 5 — content_items pagination log`

**Expression:**
```
(
  http.request.uri.path eq "/rest/v1/content_items"
  and (
    http.request.uri.query contains "select="
    or http.request.uri.query contains "limit="
  )
)
```

**Action:** `Skip` → **WAF components to skip:** `All rate limiting rules`

**Notes:**
- Catches bulk scraping of the `content_items` table via PostgREST pagination.
- Normal users rarely hit this pattern without also fetching HTML/assets.

---

## Rule D (optional) — Bulk RPC burst detection

**Name:** `Phase 5 — RPC burst detection (log mode)`

**Expression:**
```
(
  http.request.uri.path contains "/rest/v1/rpc/"
  and not cf.client.bot
)
```

**Action:** `Skip` → **WAF components to skip:** `All rate limiting rules`

**Notes:**
- Broader net to see overall RPC scraping behavior.
- **Skip this if you only have 1 custom-rule slot left** — use the combined 1-slot rule instead.
- Use this for the first 7 days to establish a baseline before enabling Rule B blocking.

---

## Tuning for Week 3 (Block mode)

When you are ready to enforce, change the action on Rule B to **Block** and add a rate-limiting expression. Free-plan version:

```
(
  http.request.uri.path in { "/rest/v1/rpc/get_board_topic_mcqs" "/rest/v1/rpc/get_practice_questions" "/rest/v1/rpc/get_preview_questions" }
  and not cf.client.bot
  and not (
    http.user_agent contains "Googlebot"
    or http.user_agent contains "Bingbot"
    or http.user_agent contains "GPTBot"
    or http.user_agent contains "ClaudeBot"
    or http.user_agent contains "PerplexityBot"
    or http.user_agent contains "Applebot"
    or http.user_agent contains "DuckDuckBot"
  )
)
```

**Action:** `Block`  
**Response code:** `429`  
**Response body (optional):** `Too many requests`

### Verified-bot bypass (recommended)

For stricter spoofing protection, perform reverse-DNS checks on the listed bot User-Agents before allowing them. This is documented by Google, Bing, and OpenAI:
- Googlebot: `*.googlebot.com`
- Bingbot: `*.search.msn.com`
- OpenAI/GPTBot: `*.openai.com`
- Anthropic/ClaudeBot: `*.anthropic.com`

Cloudflare Enterprise customers can use **Bot Management** for this automatically. Free/Pro users can use a Cloudflare Worker or Page Rule to verify reverse DNS.

---

## Monitoring

After enabling rules:
1. Watch the **Scraper Signals** tab in Admin → Overview for honeypot hits.
2. Check Cloudflare **Security Events** for rule match counts.
3. Monitor Google Search Console coverage for 429 spikes on crawler URLs.
4. If false positives appear, switch back to Skip mode and tune the expression.

---

## Rollout timeline

| Week | Action |
|------|--------|
| Week 1 | Add the combined 1-slot rule (or rules A–C) in **Skip** mode. Honeypot collects data. |
| Week 2 | Keep Skip mode; review Security Events + Scraper Signals. |
| Week 3 | Flip Rule B to **Block**; keep Rule A in Skip or Block. |
| Week 4 | Tune thresholds and add verified-bot bypass if needed. |

---

## Important reminders

- **Never block prerendered HTML routes** (`/`, `/class-N/*`, `/mock-tests/*`, `/boards/*`, etc.). Crawlers need these.
- **Never block `/sitemap*.xml`, `/robots.txt`, `/llms.txt`, or `/og/*.jpg`.**
- Keep the `cf.client.bot` and verified-bot UA conditions to avoid harming SEO.
