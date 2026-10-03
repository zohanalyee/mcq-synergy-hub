# JOA Larkana Re-test — Audit and Action Plan (3 Oct 2026)

## Time-critical fact (from your uploaded letter)
- High Court of Sindh letter HC/ADM1/02995, dated 25 Sep 2026: MCQ re-test for Junior Office Associate (BPS-13) on **04 Oct 2026 — tomorrow**, at the **High Court, Larkana premises**, only for candidates who appeared at Larkana. Individuals in the viral cheating video are barred.
- The letter says "appeared ... at Larkana on 23.09.2026", but its own subject line says the test was held 23.08.2026. We will quote the letter's subject line and not repeat the 23.09 date.
- Searches will peak today and tonight. Anything we ship must be live within hours, so the plan is split into "today" and "after the test".

## Findings

**1. Content state.** The live test is "Junior Office Associate (BPS-13)", Sindh High Court, 100 MCQs, 90 minutes. Syllabus: English 30, Basic Computer & MS Office 30, Mathematics 15, General Knowledge 15, Analytical Reasoning 10. The letter says this is a re-test of the same post with the same MCQ format, so nothing in the syllabus or pattern needs to change. The page has no mention of the re-test, its date or the venue.

**2. Larkana targeting.** None. The page is generic, and "Larkana" doesn't appear in its live text. A Larkana block on the existing page is worth adding. A separate city page is not: it would compete with the page that already ranks, and it would go stale after 4 Oct.

**3. SEO health.** The live page returns 200 to Googlebot and is marked index,follow. Title: "Junior Office Associate Syllabus, Past Papers & Mock Test | MCQsAI". It is in the sitemap (lastmod 28 Sep), and its full content is visible to crawlers. It is not subject to the /p/ quality gate, so it can't hit that bug. One gap: the title and description don't mention "2026", "re-test" or "Larkana".

**4. Larkana campaign tools.** All of them still exist and can be reused without rebuilding: the /larkana entry link, the QR tracking (library_banner / larkana_library), the welcome card, the Campaigns dashboard and the Campaign Surge panel (a time-limited boost to how much new content gets made). The surge window that was set in August has ended, so it would need to be turned on again from the admin panel. That is a setting, not a build.

**5. Why traffic fell last time.** All the traffic landed on one page, and the visitors were one-time. The page sent no one to a next exam, and nothing brought them back.

## Proposed actions

### Today, before the test (small and contained: one page, no URL change)
1. **Re-test notice block** at the top of the JOA page. It states the date, venue and eligibility exactly as the letter has them, and cites "High Court of Sindh letter HC/ADM1/02995 (25 Sep 2026)". It shows only until 4 Oct 2026, then automatically changes to "Re-test held on 4 Oct 2026".
2. **Title and description refresh.** Something like "Junior Office Associate Re-test 2026 (Larkana) — Syllabus & Mock Test". The URL and canonical stay the same.
3. **Quick Larkana practice prompt**: a "Practise the full 100-MCQ paper now" button. This uses the existing mock-test flow and adds nothing new.
4. **Turn the Campaign Surge back on for 3–5 Oct** from the admin panel. Optionally, put up the Larkana QR banner at the High Court gate or the library.
5. Update the sitemap lastmod and send an IndexNow ping for this one URL. You can also use "Request indexing" in Search Console.

### After the test (to keep the traffic)
6. **"Next exam for you" block** that replaces the notice after 4 Oct. It links to sibling Sindh High Court and NTS posts, the 61 Sukkur IBA / STS tests, and upcoming tests like HEC USAT on 25 Oct.
7. **Results-screen hand-off.** After a JOA mock, show "Follow Sindh jobs announcements" (Announcements already detects Sindh and Larkana) and a "Get your AI Coach plan" sign-up prompt.
8. **Announcements post** for the re-test notice, so returning visitors land on the feed.
9. **A permanent "Sindh High Court jobs" angle.** The page keeps its general syllabus content, which still matters for future SHC hiring, so it doesn't go stale.

### Not doing
- No result, cut-off or answer-key claims.
- No separate Larkana city page.
- No changes to other mock tests, the board pages, ads or the sign-in flow.

## Technical notes
- Edits go only in `src/pages/MockTestDetail.tsx`. The date check uses a constant end date of `2026-10-04T23:59+05:00`.
- The same block is mirrored into the prerendered HTML through `scripts/mock-test-content.mjs`, for the JOA slug only.
- The title and description change is an update to this one job_tests row (id 4df184e8…).
- Campaign Surge is turned on through the existing admin panel setting, with no code change.
- Verification: typecheck, the build, the raw HTML of the JOA page (canonical unchanged, notice present), and a spot-check that a board topic page and the sitemap are unchanged. Then publish.
