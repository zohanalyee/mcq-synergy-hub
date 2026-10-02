# /p/ guide pages: noindex audit (audit only, no changes made)

## 1. Why fpsc-islamabad and css-islamabad are noindex
This is intentional. The quality check is working as designed, and it is not a bug. A guide page can be indexed only if it has an intro of at least 60 words **and** at least 3 FAQs.

| Page | Intro words | FAQs | Result |
|---|---|---|---|
| fpsc-islamabad | 48 | 2 | fails both checks: noindex |
| css-islamabad | 58 | 2 | fails both checks: noindex |
| **ppsc-lahore** | 57 | 2 | fails both checks: **also noindex** (not on your list) |

These pages render as `noindex,follow`, which is the same type used on every other noindex page.

## 2. Why some noindex pages still accepted "Request Indexing"
The noindex type is the same everywhere, so it is not the cause. In URL Inspection, Google bases its decision on its **live test result**:
- If the live test sees noindex now, Google shows "Page cannot be indexed" and blocks the button. That is what happened with these two pages.
- The other pages that "showed noindex" were showing Google's **old saved crawl**. Their live test is clean now, so the request went through.

Separate inconsistency (a real bug): all three thin pages are still listed in the sitemap and in the build's prerender list. The page tells Google "don't index me" while the sitemap says "index me". Google treats this as a conflicting signal.

## 3. Status of the other pages you listed
All of them pass the check and are indexable:
mdcat-karachi (67 words / 4 FAQs), mdcat-sindh (62/3), mdcat-punjab (64/3), mdcat-lahore (65/4), nts-karachi (89/4), ppsc-punjab (98/4), ecat-punjab (92/4), biology-mcqs-class-12 (64/3), chemistry-mcqs-class-12 (61/4).
Note: mdcat-sindh, mdcat-punjab and biology-mcqs-class-12 are only just above the limit.

## 4. Content state of the two pages
These pages have real content but are on the short side: syllabus/eligibility, test centres, domicile, 3 prep links and 2 FAQs. They are borderline thin, not wrongly hidden. Lowering the limit would be the wrong fix.

## 5. Proposed fix (on approval)
For **fpsc-islamabad, css-islamabad and ppsc-lahore**, add content only. Use facts already on the page or general process facts. Mark anything unverified "not yet announced":
- Expand each intro to about 80–100 words: the test process stages, how to apply online, and the official websites (fpsc.gov.pk / ppsc.gop.pk).
- Add 2 FAQs to each page (4 in total), for example: "Is there negative marking in FPSC tests?", "How long after the test are results announced?", "What is the CSS MPT screening test?", "What is the CSS fee?" Each answer will be checked against the official website, or worded as "check the official advertisement".
- Leave the quality check exactly as it is.

Then:
- Remove the noindex pages from the sitemap and prerender lists automatically, using the same quality check. This way the sitemap and the page always agree.
- Run the build, then check that all three pages show `index,follow` in their raw HTML.
- After you publish: in Search Console, run "Test live URL" (it should show green), then click "Request indexing".

## Technical details
- Gate: `passesQualityGate()` in `src/data/programmaticSeo.ts` (intro ≥60 words, ≥3 FAQs, `indexable: true`).
- `PROG_SEO_SLUGS` in `scripts/prerender-routes.mjs` is a hand-copied list that contains the 3 thin slugs. `public/sitemaps/programmatic.xml` also contains them. The fix generates both from the same gate, or keeps them in sync with it.
- Only these files change: the `programmaticSeo.ts` entries, `prerender-routes.mjs`, and the sitemap generator. No layout, ads or route changes.
