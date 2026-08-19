# MDCAT Pre-Exam Content Block + Result Screen Order & Advice Readability

Two isolated workstreams. No routes, sitemap entries, or URLs change.

## Part 1 — MDCAT 2026 pre-exam content push (exam: Sunday, 20 September 2026)

Both MDCAT pages are already prerendered and already carry the corrected date line, so this is purely additive body content on two existing pages.

**On `/mdcat-syllabus` (`src/pages/MDCATSyllabus.tsx`)**

- Countdown block: "MDCAT 2026 in N days" computed from the 20 Sep 2026 date (no hardcoded "3 months left" style text).
- Subject weightage table anchor (Biology 68 / Chemistry 54 / Physics 54 / English 18 / Logical Reasoning 6 — PMDC national MDCAT pattern), with per-subject MCQ counts and a short "how to allocate study time" note.
- Last-4-weeks study plan block (week-by-week: syllabus sweep → weak-chapter drilling → full-length mocks → revision).
- In-body contextual links to `/mdcat-past-papers`, the MDCAT exam landing page, and relevant subject/topic practice pages already on the site.
- FAQ additions (exam date, rescheduling, weightage, negative marking, passing marks) folded into the existing single FAQPage schema — no second FAQPage block.

**On `/mdcat-past-papers` (`src/pages/seo/MDCATPastPapers.tsx`)**

- Year rows for 2025 and 2026 in the existing papers listing pattern (with an honest "2026 paper available after 20 Sep" state rather than fake content).
- "Past paper pattern" section: question distribution per subject, time per question, common repeated topics.
- Sibling links back to `/mdcat-syllabus` and MDCAT practice entry points.

**Post-change ops**

- Regenerate sitemaps so `lastmod` bumps for these two URLs.
- IndexNow ping for the two MDCAT URLs only.
- Prerender verification must still pass for both routes.

## Part 2 — Result screen: order + Ustaad Ki Advice readability

**Reorder (matches the screenshot):** move the Ustaad Ki Advice block and its three stacked action buttons **above** the Focus Areas card, directly under the stats grid, in `src/pages/TestSession.tsx`. Button order stays: AI Coach — View Full Analysis (brand gradient), Practice Weak Areas, Try Again — all full-width, 44px min height.

**Readability fixes in `src/components/shared/ResultAdviceCard.tsx`:**

- Advice text from `text-xs` to `text-sm` with `leading-relaxed` and full `text-foreground` weight so it reads on mobile.
- Slightly larger, higher-contrast "Ustaad Ki Advice" label and more inner padding so the message is not cramped against the emoji badge.
- Fix the guest CTA button, which currently uses `bg-white/20` (near-invisible on the light card background) — switch to brand/primary tokens like the signed-in buttons.
- Urdu/Roman-Urdu mixed lines get proper word-break handling so long messages don't overflow on narrow screens.

No scoring, tracking, or gamification logic is touched — presentation only.

## Sequencing

1. Part 2 (small, visible immediately).
2. Part 1 MDCAT content, then sitemap lastmod + IndexNow. 

&nbsp;

Intiate the order please.