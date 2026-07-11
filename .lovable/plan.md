## Diagnosis (from live Bingbot fetch)

Fetched the exact URL's raw HTML with a Bingbot UA:

```
<title> tags:          1
<meta name=description>: 1
<link rel=canonical>:    1
```

**Conclusion:**

- **"More than one Meta Description (2 instances)" = STALE Bing data.** The live page has exactly one of each tag. `dedupe-og.mjs` already collapses duplicates at build time, and `topic-content.mjs` does NOT re-write meta tags over `inject-meta.mjs` (it only injects body content into `#root` + JSON-LD). No duplicate-tag bug exists on topic pages. This clears on Bing recrawl — no code change.
- **"Title too long" = REAL.** The live topic title is ~96 chars:  
`Forces And Machines MCQs - General Science Class 5 | Punjab Curriculum And Textbook Board | MCQsAI`  
The full board name blows past 60. This affects all 729 topic pages whose board/topic/subject names are long.

Also verified alongside: `/exams/*`, `/p/*`, `/features/ai-coach` titles are within range, single meta/canonical each; `/features/ai-coach` is live with `SoftwareApplication` + `FAQPage` schema.

## The fix: shorten the topic title template

The title is generated in **two places that must stay identical** (raw HTML === JS-rendered, no cloaking):

- `scripts/inject-meta.mjs` line 303 (raw prerendered HTML)
- `src/pages/BoardTopicPage.tsx` line 182 (`seoTitle`, React/Helmet) — `SEOHead` appends  `| MCQsAI`

Current: `${topic} MCQs - ${subject} Class ${classN} | ${board} | MCQsAI`

Change to drop the board name from the `<title>` (board stays in the description, H1 context, breadcrumb, and canonical, so no ranking signal lost):

New: `${topic} MCQs - Class ${classN} ${subject} | MCQsAI`

Example result: `Forces And Machines MCQs - Class 5 General Science | MCQsAI` (~58 chars).

Add a safety truncation for the still-long tail cases: if the composed title (before  `| MCQsAI`) exceeds 51 chars, trim the leading `${topic} MCQs` portion cleanly so the final title stays ≤60. Apply the identical helper in both files so raw and rendered titles match exactly.

### Files to change

1. `scripts/inject-meta.mjs` — update line 303 title template + add the shared truncation logic. Leave line 444 `seoTitle` (Quiz schema `name`) as-is or match it — schema name length is not a title-tag concern; I'll keep it consistent with the visible title for cleanliness.
2. `src/pages/BoardTopicPage.tsx` — update line 182 `seoTitle` with the same template + truncation so Helmet output matches the injected raw HTML.

### Verification

- Run `inject-meta` + `verify-prerender` and confirm the sample topic title is ≤60 and unchanged tag counts (1 title / 1 desc / 1 canonical).
- Spot-check 2-3 long-board topic pages' prerendered `<title>`.
- Confirm raw title === JS-rendered title (no cloaking) on one URL.

## No change needed

- Duplicate meta description: stale Bing data; recrawl clears it.
- `/exams/*`, `/p/*`, `/features/ai-coach`: already correct in the current deploy.
  &nbsp;

**Diagnosis approved. Fix karein:**

&nbsp;

**1. Topic-page title template se board name hata dein (chhota title k liye), description/H1/breadcrumb/**canonical mein board name waisa hi rahne dein — koi SEO signal khona nahi chahiye

2. Safety truncation add karein (agar 51 chars se zyada compose ho to trim ho)

3. inject-meta.mjs aur BoardTopicPage.tsx dono mein identical fix karein taake raw aur JS-rendered title match karein (no cloaking)

&nbsp;

Build + verify (inject-meta, verify-prerender) k baad, 2-3 lambe-board-naam wale sample topics ka title check kar k confirm karein ≤60 characters hai, aur raw==rendered match confirm karein.

&nbsp;

Approve ho jaye to publish kar dein.