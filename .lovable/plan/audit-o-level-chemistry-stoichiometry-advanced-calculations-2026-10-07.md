# Audit: O-Level Chemistry "Stoichiometry Advanced Calculations" topic page (6 Oct 2026, audit only)

URL: [https://mcqsai.com/boards/oxford-cambridge-o-level-lower-secondary/class-10/chemistry/stoichiometry-advanced-calculations](https://mcqsai.com/boards/oxford-cambridge-o-level-lower-secondary/class-10/chemistry/stoichiometry-advanced-calculations)

## Findings (checked live with Google's inspection user agent)

1. **Status:** HTTP 200. No redirect.
2. **Robots tag:** `noindex,follow`. This is why Google refused "Request Indexing". A page that tells Google not to index it can't be submitted.
3. **Question count:** the live page carries 5 approved MCQs (Q1–Q5) in its raw HTML.
  - The live rule for topic pages is **8 or more approved MCQs = index**. 5–7 = the page shows questions but stays noindex. Fewer than 5 = noindex with no questions in the page.
  - (The old memory note said the threshold was 5. The code was tightened to 8 later, so the note is out of date.)
  - Result: the noindex is **intentional**, not a bug. This is a real content gap: the topic needs at least 3 more approved MCQs.
4. **Canonical:** points to itself, exact URL. No mismatch.
5. **Structured data:** a Quiz block and an FAQPage block with 5 questions, plus the site-wide blocks. It's well-formed, and nothing in it would block indexing.
6. **Real bug found (it doesn't cause the rejection):** in the raw HTML that non-JS crawlers read, the A–D answer options are blank (`<li>. </li>` × 4 on every question). The correct-answer line and explanation do show. So the stored options for these questions are probably in a different format than the page builder expects (for example an A/B/C/D object instead of a key/text list). It may also affect other topics whose questions came from the same source. I haven't confirmed this against the database yet. Your backend is self-managed, so I couldn't query it from here.
7. **Title:** "Stoichiometry Advanced C… MCQs - Class 10 Chemistry | MCQsAI". It's shortened by the 60-character rule. That's acceptable, but the cut looks odd.

## Proposed next steps (for approval, nothing done yet)

- **Content gap:** add at least 3 approved MCQs to this topic so it reaches 8. Use the Content Health tab's fill for this topic and then approve, or add them manually. After the next Publish, the page becomes index,follow and joins the sitemap automatically. Then Request Indexing will work.
- **Blank-options bug:** check the stored option format for these 5 questions. Then make the static page builder accept both formats, matching how the live page reads them. Before changing anything, also count how many other topic pages show blank options.
- **Optional:** shorten the title differently so the cut doesn't land mid-word (e.g. "Stoichiometry Calculations MCQs – Class 10 Chemistry").

Don't request indexing for this URL until it has 8 or more approved MCQs.

&nbsp;

&nbsp;

Plan approved. Proceed with:

1. First, count how many other topic pages have this blank-options bug (questions where the A-D options don't render in raw HTML) — report the scope before fixing, since this could be affecting many pages' crawlability and quality signal to Google

2. Fix the static page builder to accept both option-storage formats (key/text list AND A/B/C/D object), matching how the live JS-rendered page already reads them correctly

3. Shorten the title to "Stoichiometry Calculations MCQs – Class 10 Chemistry" so it doesn't cut mid-word

4. Add enough MCQs to this specific topic (Content Health tab fill, then approve) to reach 8+ so it naturally becomes indexable

Report the scope of the blank-options bug (point 1) before implementing the fix — I want to know how big this is first.