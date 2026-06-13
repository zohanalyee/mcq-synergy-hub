# MCQsAI — AdSense Readiness Audit & Roadmap

Evidence-backed. **No code has been changed.** Approve to implement P0.

## 1. Indexable board URLs by approved-MCQ depth (live DB)

Query: active educational systems, class-numbered levels, `content_items.status='approved' AND category='mcq'` joined by `topic_id`.

| Approved MCQs | URLs | Share |
|---|---|---|
| **0** | **921** | 66.5% |
| 1–4 | 9 | 0.6% |
| 5–9 | 172 | 12.4% |
| 10+ | 284 | 20.5% |
| **Total** | **1,386** | 100% |

≥5 threshold keeps **456**, removes **930** (921 empty + 9 near-empty).

## 2. Google quality-classification estimate

- **Thin content:** ~930 pages (0–4 MCQs). The 921 zero-MCQ pages render only an H1 + a templated "No MCQs available for X yet" paragraph + an AI-generate button — almost no unique body text.
- **Low value content:** the same ~921 are the AdSense "Low Value Content" trigger. They are `index,follow` today (see finding 3a) and reachable via `RelatedTopics` internal links and the board hub even though they'd leave the sitemap.
- **Near-duplicate:** the 921 empty pages are near-identical to each other (same boilerplate body, only the topic noun changes) → duplicate-cluster risk. The 172 (5–9) pages are acceptable but light.

## 3. Critical root cause (highest impact)

**`src/pages/BoardTopicPage.tsx` never sets `noindex`.** When `mcqs.length === 0` it still renders `<SEOHead>` with default `index,follow`. So the 921 empty pages are actively indexable regardless of the sitemap. **Sitemap filtering alone will NOT fix AdSense "Low Value Content"** — it only reduces discovery. The empty/thin pages must be `noindex` to clear the AdSense flag.

## 4. High-priority page audit (EEAT / trust / depth)

| Page | Status | Notes |
|---|---|---|
| Homepage | OK | Strong, but verify above-the-fold has real text, not just CTAs |
| Boards hub | OK | Indexable hub |
| Jobs / Scholarships | OK | DB-driven, real content |
| Mock tests | OK | Detail pages + schema |
| Past papers | OK | Prerendered |
| Reviews | OK | Prerendered, user content |
| About | **Strong** | Founder Person schema (Zohaib Ali Channa), Organization, contact |
| Contact | **Strong** | Real address (Karachi), email, working form |
| Editorial Policy | **Strong** | Full EEAT: sourcing, authorship, corrections, AI disclosure |
| Privacy Policy / Terms | Present | Confirm "last updated" date is current |
| FAQ | OK | Add `FAQPage` schema if missing |

EEAT trust pages are in good shape — they are **not** the AdSense blocker. The blocker is the mass of thin board pages.

### Found issues
- **Fake/placeholder contact data:** About uses `+92-300-1234567` (dummy phone). Replace or remove — placeholder contact info hurts trust signals.
- Confirm Privacy/Terms "last updated" dates are real.

## 5. Guest content visibility

`BoardTopicPage`, `Subjects`, `Boards`, `Jobs`, `Scholarships`, `Reviews`, `PastPapers` are **not** wrapped in `InstantAuthGuard` — guests and Googlebot see full MCQs, explanations, and listings without login. This is correct for AdSense (no login wall on indexable content). Only the test-runner variants (`?count=`, `?timed=`, `/test-session/*`) are gated/noindexed, which is appropriate.

**No change required** for guest visibility.

## 6. Is the ≥5 sitemap filter safe?

- **SEO:** Safe. Removed pages have ≤4 MCQs; prior GSC cross-check showed every removed clicked page had 0 MCQs. No rankable content lost.
- **AdSense:** Necessary but **insufficient alone** — must be paired with `noindex` on empty/thin pages (finding 3).
- **Organic traffic:** Low risk. Pages auto-re-enter the sitemap once they cross 5 approved MCQs.

## Prioritized Roadmap

### P0 — before next AdSense review
1. **Add `noindex` to thin/empty board topic pages.** In `BoardTopicPage.tsx`, when approved-MCQ count `< 5`, pass `noindex` to `<SEOHead>`. This directly clears the "Low Value Content" flag for all 930 thin pages.
2. **Ship the ≥5 sitemap filter** in `scripts/generate-sitemaps.mjs` `buildBoards()` (1,386 → 456 URLs) to stop signaling thin pages for crawl.
3. **Remove placeholder contact data** (`+92-300-1234567`) from About; use a real channel or drop the phone field.

### P1 — should do
4. Add a real content block to the 5–9 MCQ pages (short intro paragraph + syllabus context) to lift them out of "thin", or hold them from the sitemap until ≥10.
5. Confirm `FAQPage` JSON-LD on `/faq`; verify Privacy/Terms "last updated" dates.
6. Reduce internal linking to empty topics (`RelatedTopics`) so crawl budget concentrates on real pages.

### P2 — optional
7. Auto-generate-and-approve a minimum MCQ set for high-traffic empty topics to convert them into real indexable pages.
8. Add author bylines to long-form study guides for stronger EEAT.
9. Periodic GSC cross-check after deindexing to confirm the empty pages drop out (2–4 weeks).

**Awaiting approval to implement P0 (items 1–3).**