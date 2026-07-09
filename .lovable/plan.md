# SEO Recovery Plan — post-Cloudflare-403 fix

## ✅ Section 0 — Crawler access verification (DONE, no code)

Confirmed live at the edge with crawler user-agents:


| URL                                           | Googlebot | GPTBot |
| --------------------------------------------- | --------- | ------ |
| `/`                                           | 200       | 200    |
| `/mock-tests/sindh-teaching-license-exam-...` | 200       | 200    |
| `/subject-content/physics`                    | 200       | 200    |
| `/exams/mdcat`                                | 200       | 200    |


The 403 block is gone. **GSC URL Inspection still reports `ACCESS_FORBIDDEN**` because it returns the *last crawl* state (June 12–28, pre-fix). The API cannot do a real-time live fetch, so this clears only when Google re-crawls — nothing to change in code.

---

## Manual steps only you can do (no API path exists)

- **"Validate Fix" for the 1,427 blocked URLs** — Google Search Console exposes **no API** to trigger this. Do it in the GSC UI: *Indexing → Pages → "Blocked due to access forbidden (403)" → Validate Fix*. This tells Google to re-crawl the batch. I'll re-run URL-Inspection checks afterward to confirm recovery.
- **www → apex 301** (Section A below) is an **edge/Cloudflare redirect setting**, not a codebase change — I cannot flip it from here.

---

## Section-by-section fixes (each needs your go-ahead before I build)

### A. www → apex: 302 → 301  *(Cloudflare action, I only verify)*

Currently `https://www.mcqsai.com/` → `https://mcqsai.com/` is **302**. Convert to **301 permanent** in Cloudflare (Bulk Redirects or a Redirect Rule, status 301). After you set it, I'll `curl` to confirm `301` and that the chain is a single hop. **No repo change.**

### B. Per-page unique meta descriptions for board hub pages  *(code)*

**Root cause:** board *topic leaf* pages already get unique descriptions via `inject-meta.mjs`, but board **hub** pages — `/boards/<board>` (landing), `/boards/<board>/class-N` (class), `/boards/<board>/class-N/<subject>` (subject) — are **not** in the injection allow-list, so a raw crawler fetch gets the homepage shell's generic fallback description. That's the "39 identical descriptions" in GSC.

**Fix:** extend `scripts/inject-meta.mjs` with a new generator that:

- Derives every hub path (board / class / subject) from the same `get_indexable_board_topic_paths` RPC already used for topics (dedupe parent paths).
- Emits the exact unique templated description each page's `SEOHead` already renders client-side, e.g.:
  - Landing: `Free {board} MCQs with answers for all classes and subjects…`
  - Class: `Browse {board} {class} subjects. Practice MCQs for all subjects.`
  - Subject: `Browse {subject} topics for {class} ({board}). Practice MCQs topic by topic.`
- Writes self-referencing canonical / og:url / twitter:url + category OG image, same as the existing `patch()` helper.

No component/logic changes — build-time static-HTML meta only.

### C. IndexNow protocol  *(code)*

Nothing exists in the repo today. Add:

- A static key file `public/{indexnow-key}.txt` at site root (32-char key).
- A Supabase edge function `indexnow-ping` that POSTs changed URLs to `https://api.indexnow.org/indexnow` (Bing/Yandex).
- Wire it to fire on content publish/update (mock tests, blog, opportunities) — reusing existing publish paths. I'll confirm the exact trigger points with you before wiring.

### D. Remaining audit sections (lower priority, separate approvals)

- **Schema/JSON-LD:** add `FAQPage` to board topic leaf pages for AEO citation.
- **Internal linking:** hub→leaf and cross-topic link improvements.
- **Thin-content check:** re-audit against the existing ≥5-approved-MCQ noindex gate.
- **hreflang** for en/ur/sd (noted in audit as missing).

---

## Suggested order

1. You trigger **Validate Fix** in GSC + set **301** in Cloudflare (A).
2. I build **B (board hub meta)** on your approval.
3. I build **C (IndexNow)** on your approval.
4. We tackle **D** section by section.

I'll pause for your confirmation before each coded section (B, C, D).

&nbsp;

# **Dono manual steps confirm ho chuke hain:**

1. GSC "Blocked due to access forbidden (403)" validation "Started" status mein hai, 1.43k pages Google gradually re-crawl kar raha hai

2. [www.mcqsai.com](http://www.mcqsai.com) → [mcqsai.com](http://mcqsai.com) redirect ab verified 301 hai (PowerShell se test kiya, StatusCode 301 confirm hua)

Please ab Section B par kaam shuru kar dein — board hub pages (landing/class/subject level) k liye unique meta descriptions generate karna, jaisa aap ne propose kiya tha (get_indexable_board_topic_paths RPC se hub paths derive karke, templated unique descriptions + canonical/og:url emit karna).

Build ho jaye to bata dein, review kar k approve kar dun ga.