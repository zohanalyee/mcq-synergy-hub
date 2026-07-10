## D2c / D3.5 — Prerender topic content for non-JS AI crawlers

**Goal:** Emit real, crawlable MCQ + `Quiz`/`FAQPage` content in the *raw* (non-JS) HTML of every indexable board/topic page, so ChatGPT / Claude / Perplexity (which do not execute JS) can read and cite our MCQ/FAQ content. Today they only see the empty prerender shell.

### Why NOT full React Query hydration in `prerender.tsx`

`renderToString` (vite-prerender-plugin) is synchronous and cannot await the Supabase queries that `BoardTopicPage` depends on. Forcing async data into the prerender path is exactly the fragile route the codebase already avoids for DB-driven detail pages — high build-stability risk for 729 routes. So we reuse the **already-proven, idempotent `scripts/inject-meta.mjs**` post-build step, which today fetches from Supabase and writes per-URL `dist/<path>/index.html` with a corrected `<head>`. We extend it to also inject **body content + content JSON-LD**.

### Scope

1. **Fetch (build time, anon):** For each URL in `src/generated/indexableTopics.json`, resolve `topic_id`/`canonical_slug` and call the anon `get_board_topic_mcqs` RPC (`p_limit: 50`) — the same source the live page uses. Batch with limited concurrency; skip on any per-URL error (never fail the build).
2. **Static content block:** Build a semantic, crawlable HTML fragment (plain `<h1>`, `<h2>`, `<ol>`/`<article>` per MCQ: question text → options → **correct answer** → explanation, plus a "Related topics"/"Explore more" anchor list mirroring D3). Inject it into the `#root` container of that URL's `index.html`. On hydration in a real browser React replaces `#root`, so users are unaffected; only non-JS crawlers read the static block.
3. **Content JSON-LD:** Regenerate the exact `Quiz` and `FAQPage` schema already produced in `BoardTopicPage` (same shape: `Quiz` with `numberOfQuestions`; `FAQPage` from ≥3 approved Q+answer+explanation, capped 10) and inject into `<head>`. Reuse the same `cleanQuestionText` sanitization logic.
4. **Guardrails (reuse existing rules):** Only inject full content for topics in the indexable manifest (≥5 approved MCQs). Thin topics keep `robots=noindex` and get no content block — no thin-content regression. No cloaking: the injected content equals what a JS visitor sees.
5. **Verification script:** Extend `scripts/verify-prerender.mjs` to assert, for a sample of topic URLs, that raw `dist/<path>/index.html` contains: `h1`, ≥1 rendered MCQ question, `"@type":"Quiz"`, and `"@type":"FAQPage"`.

### Technical notes

- Edited files: `scripts/inject-meta.mjs` (add topic-content injection using `indexableTopics.json` + `get_board_topic_mcqs`), a small shared JSON-LD/HTML builder helper (mirrors `BoardTopicPage` schema so the two never drift), `scripts/verify-prerender.mjs` (assertions). No app runtime code changes, no DB/schema changes, no new colors/fonts/layout.
- Escape all DB text (HTML-entity encode) before writing into static HTML.
- Idempotent + fail-safe: any RPC/network hiccup logs and skips that URL, build still succeeds.
- Concurrency-limited fetch (e.g. 8 at a time) to stay well within anon rate limits across 729 topics.

### Acceptance

- Raw (non-JS) fetch of a populated topic URL returns rendered MCQ content + `Quiz` + `FAQPage` JSON-LD.
- Thin/empty topics remain `noindex` with no injected content.
- No cloaking (raw content ⊆ JS-rendered content).
- Build + typecheck clean; existing prerender/meta output for other routes unchanged.
- `verify-prerender.mjs` passes the new topic-content assertions.

&nbsp;

**Plan approved** — safe, existing inject-meta.mjs system ko extend karna sahi approach hai.

Implement kar dein. Complete hone k baad batayen — build/typecheck clean confirm karke, aur verify-prerender.mjs se sample topics par MCQ + Quiz + FAQPage confirm karke.

Publish se pehle mujhe review karne dein.