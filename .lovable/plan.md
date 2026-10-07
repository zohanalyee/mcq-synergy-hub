# 403 report: sampled analysis (7 Oct 2026, audit only, no changes made)

Source: your export "Blocked due to access forbidden (403)", 1,000 URLs, all last crawled 23 Jun – 21 Jul 2026 (before the 12 Sep Cloudflare fix).
Sample: 57 URLs, stratified by page type and www vs non-www. Each one was fetched live today with a Googlebot user agent, following redirects. 3 were also fully opened in a browser, the way Google's renderer sees them.

**Headline: none of the 57 returns 403 any more, and none returns 404 or an error.** Every URL now loads (status 200). The "C" items below aren't broken pages. They come from 3 site-wide causes, where the first version Google receives (before scripts run) looks like a copy of the homepage.

## Breakdown

| Bucket | Count | Share | Meaning |
|---|---|---|---|
| A. Redirect leftover | 6 | 10.5% | www URLs; a proper 301 to the working non-www page. Will self-resolve. |
| B. Thin, noindex as intended | 2 | 3.5% | O-Level topics under the question threshold. Working as designed. |
| C. Real problem (3 root causes) | 25 | 43.9% | Loads fine, but the first version Google gets is the homepage shell. |
| D. Already fine, stale entry | 24 | 42.1% | Own title, index,follow, correct canonical. Nothing to do. |

Projected to the full report (about 1.54k): roughly 54% (A+D) need nothing, about 3–4% are intended thin pages, and about 44% fall under the 3 causes below. Fixing those 3 causes fixes them in bulk; no one-by-one work is needed.

## Category C: the 3 root causes, with sample URLs

**C1. Topic pages left out of the build (6 of 24 non-www topic URLs, about 25%)**
The build step that writes each topic page's own title, tags and questions asks the database for the topic list without paging. It gets the first 1,000 rows only. Topics after row 1,000 get the generic homepage version: homepage title "AI-Powered MCQ Practice Platform", canonical pointing to the homepage. Once scripts run, the page corrects itself (confirmed: cell-cycle shows its own title, index,follow, own canonical). The sitemap builder already pages correctly, so the indexable list holds 1,117 topics while this step sees at most 1,000 rows. It also includes thin topics, so the real gap is bigger.
- /boards/sindh-text-book-board/class-9/biology/cell-cycle
- /boards/sindh-text-book-board/class-8/english-class-8/hockey (it's in the sitemap)
- /boards/sindh-text-book-board/class-9/physics/dynamics
- /boards/sindh-text-book-board/class-7/mathematics-class-7/linear-equations
- /boards/sindh-text-book-board/class-5/english-class-5/our-national-flag
- /boards/oxford-cambridge-o-level-lower-secondary/class-7/mathematics/statistical-data-handling

**C2. Old /N/ topic paths (11 sampled: 6 non-www, 5 www)**
These aren't a server 301. They return 200 with the homepage version, and only switch to /class-N/ in the browser (confirmed: /boards/sindh-text-book-board/9/chemistry/solutions → /class-9/chemistry/solutions after scripts run). Google may or may not treat this as a redirect. Examples:
- /boards/oxford-cambridge-o-level-lower-secondary/10/biology/human-nutrition
- /boards/sindh-text-book-board/3/english-class-3/blessings-of-allah
- /boards/punjab-curriculum-and-textbook-board/11/physics/vectors-and-equilibrium
- /boards/punjab-curriculum-and-textbook-board/12/chemistry

**C3. Old /subject/<id> and /subject-content/<id> pages (8 sampled)**
This is the Turn 2 issue already on the roadmap. The first version is the homepage shell. After scripts run, it becomes a real subject page (e.g. "Mathematics MCQs with Answers") with its own canonical. Google sees these as duplicates of the homepage, and the real subject URL is never named.

## Proposed fixes (for approval, one build turn)

1. **C1:** page through the topic list in the build step, the same way the sitemap builder already does, so every topic gets its own static title, tags, questions and canonical.
2. **C2:** add a real server-level 301 for `/boards/<board>/<N>/...` → `/boards/<board>/class-<N>/...` in the redirect rules file, covering topic, subject and class levels.
3. **C3:** (Turn 2) give each old subject URL its own title and a canonical pointing to the real subject page, or a server redirect to it where it maps one-to-one. I'll confirm which before building.
4. After you Publish: in Search Console, open the 403 report and click "Validate fix". All 1,000 entries are older than the Cloudflare fix, so validation should clear most of them in one pass.

No other changes. Nothing has been edited in this audit.
