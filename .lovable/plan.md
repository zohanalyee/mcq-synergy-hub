# Mega Audit, 21 Oct 2026 (plan only, nothing changed)

Checked today: the code, the database (read-only) and the live site.
"Not measured" means no evidence was collected this turn. Treat those items as open questions, not findings.

## Top findings, in priority order

| # | Finding (evidence) | Impact | Effort | Risk | Batch |
|---|---|---|---|---|---|
| 1 | **Blank page for returning visitors.** Fix A is built but not published. Live pages still tell phones to keep a copy for 4 hours. | Traffic, trust | S | Low | 9 |
| 2 | **Fake pages look real.** Any wrong address (e.g. `/does-not-exist`) returns "OK" (200) with the full homepage, so Google can see thousands of copies of the homepage. `/mock-tests/junior-office-associate` does the same: the real address is `...-bps-13`. | Indexing | M | Low | 9 |
| 3 | **Answer letters badly unbalanced.** In the 24,669 live mock-test questions, the right answer is A 8,035, B 8,777, C 6,145 and only D 1,712 (7%). A student who never picks D scores higher than they should. Questions are never edited; the fix is shuffling options when a test is shown. | Trust | M | Med | 10 |
| 4 | **Usage counters never update.** `times_used`/`times_correct` is 0 on all 24,669 questions. So the bank has no "students got this wrong" signal, and Quality Gate and the reports cannot use real student results. | Quality | S | Low | 10 |
| 5 | **Test-quitting data is almost empty.** Only 9 answer sessions were saved in 30 days (142 mock answers, 5 practice answers), and `job_test_progress` has no "finished" column. Where students quit cannot be measured yet; we must start tracking it first (GA4 `test_start`/`test_abandon` exists since Batch 5). | Traffic, retention | M | Low | 10 |
| 6 | **Quality sweep status.** 22,288 not yet AI-checked, 2,668 need review, 7 failed, only 36 passed. 1,898 are marked "near duplicate", but whether each is a repeat inside the same test or a deliberate copy across tests is still unknown. **Keep the hide switch off** until this is split per test (Audit 2). | Trust | M | Low | 11 |
| 7 | **"Official" wording.** About 33 places say "official", mostly in mock-test detail (11 times), the custom-syllabus editor (6) and the test service (4). They need a wording review so our own questions are never presented as official papers. "Past Papers" in titles stays, as you decided. List only. | Trust, AdSense | S | Low | 12 |
| 8 | **Draft tests in the sitemap.** Admission & Examination Officer is live and indexable (index,follow, clean canonical, about 26 KB of real content) and appears in the mock-test sitemap (2 entries for these two tests). Not thin. Junior Office Associate's short address is a fake page (see #2). | Indexing | S | Low | 9 |
| 9 | **PDF Builder small fixes.** The title must use the real count (47, not 50). The topic cap should loosen from 2 to 3 when a section is short. Catch same-meaning wording ("Outward Register" vs "outward mail register", "data is/are"). Use the test's own name in the link tag (`admission_examination_officer_47q`); the code currently uses a manual short label. | Trust | S | Low | 11 |
| 10 | **Old NTHP PDF.** The live NTHP v3 PDF cover mentions STS. Regenerate it with the builder (STS-free disclaimer), keeping the same file name. | Trust | S | Low | 11 |
| 11 | **Background schedules.** 9 jobs are active and 0 failed in 7 days. `nightly-auto-fill` runs every 30 minutes, and two Quality Gate jobs run (hourly and every 2 hours), which doubles quota use. Auto-fill is the main daily drain on the free keys. | Cost | S | Low | 12 |
| 12 | **Sitemaps today:** boards 1,352, mock tests 95, jobs 65, blog 30, exams 26, static 26, programmatic 21, tools 15, scholarships 8. That is about 1,638 in total. | Info | – | – | – |

## Section answers (short)
1. **SEO:** NTHP files have no STS mentions (an automated test checks this). Share previews use one default image for most pages; per-page images are not measured. Page-type title and schema checks are not measured beyond the pages above.
2. **Speed:** first-load code is about 298 KB compressed (measured in 8.2). Lighthouse, Featured cards' cost and Speed Batch 2 readiness are not measured; they need a dedicated speed run.
3. **Money:** Privacy, Terms, Contact, About and `ads.txt` all exist. Before applying for AdSense, fix #2 (soft 404s) and #7 (wording). Ad placement ideas: under the result card and between hub sections, never inside a running test. Paid PDF / Paper Builder: ideas only; it needs a payment provider decision.
4. **Content:** see #3, #4 and #6. Remaining good questions per test against the 1.5× pool floor: the per-test counts are visible in the Gate panel but were not pulled here.
5. **Errors:** #1 and #2. The error screen exists and offers recovery buttons.
6. **Security:** the 127 warnings were not classified this turn. Backups and leaked-password protection are still unverified (they need the Supabase dashboard).
7. **AI quota:** see #11. The Flash-Lite comparison is still not run. 429 before/after: last known 54/h fell to 0/h; nothing new was measured.
8. **Admin menu:** proposed group "Mock Tests" = Job Tests, Quality Gate, PDF Builder; "Exam Pages" = Exam Pages, Featured Cards. Not reproduced on a phone.
9. **Clickable cards:** 173 files use cards. A visual sweep is needed; not done.
10–11. **Quitting and return visits:** needs data first (#5). Ideas: resume where you left off, a progress bar, 10-question mini-tests, and after the result: weak topics, WhatsApp, share.
12–17. **Tools, analytics, navigation, empty states, Urdu, tap targets:** not measured this turn. Analytics: `featured_click`, `featured_whatsapp_click` and PDF click events still need checking in GA4 DebugView.
18. **PDF Builder:** see #9.
19. **Roadmap ideas, not built:** a "Free PDF" button per test, automatic `/pdf/` pages for hot tests, an OMR answer sheet and paper mode, and a paid builder.
20. **Coverage:** next are IBA Community Colleges & Schools (STS) cadres, using only facts from official STS ads.
21. **Pending:** "Report this question" (none exists), usage counters (#4), the `/pdf/` Cloudflare allowlist (owner step), "Verified on" dates (owner supplies), and Audits 2 and 3 (ready to plan after #6).

## SEO priorities (merged with the 20 Oct keyword and competitor addendum)
Search positions come from your own 20 Oct Search Console notes; I did not re-check them. Nothing is copied from competitors.

| # | Priority | Evidence | Impact | Effort | Risk |
|---|---|---|---|---|---|
| S1 | **Crawl safety first:** fake "OK" pages, Fix A live, short Junior Office Associate address | Audit #1, #2 | Indexing | M | Low |
| S2 | **Click-through on the 95 mock-test titles and descriptions.** Proposed pattern: "[Post] BPS-[n] [Organisation] MCQs – Free Online Test & Past Papers \| MCQsAI". Description: "[n] free MCQs for [Post] BPS-[n]. Timed online test, instant score and answer explanations." Keep "Past Papers". Show it as a proposal before changing anything. | Assistant Accountant BPS-15 position 5, 16 impressions, 0 clicks; /mock-tests position 5, 0 clicks; Teaching License EST position 2.3, 0 clicks | Traffic | S | Low |
| S3 | **NTHP / STHP to #1.** Two-way links: hub ↔ mock test ↔ /pdf page. Add a short "how to prepare" section with original text. No STS on NTHP. | Search results show only IBA's own PDFs; STHP mock test is at about position 2.9 | Traffic | S | Low |
| S4 | **IBA Community Colleges & Schools (STS) hub + per-post pages**, built from the existing mock tests and the stored STS syllabus | One thin competitor whose page says "MCQs will be added soon" | Traffic | M | Low |
| S5 | **Test timeline block** on /exams/sts, /sthp and /nthp: verified dates, official links only, "Verified on" date, hides itself when out of date. Never host results or lists. | News sites take "result / roll number slip / answer key" searches | Traffic, trust | M | Med (stale facts) |
| S6 | **Sindh Teaching License (EST/SST) pedagogy hub + syllabus guide** linking to the STEDA document. "Verified on" date, original text. | Search results show only STEDA PDFs and news | Traffic | M | Low |
| S7 | **STS subject hubs** (Pak Studies, GK, Computer, English, Everyday Science, Pedagogy). Gate-passed questions only, so they wait until the Gate has passed enough questions (only 36 pass today). Thin-content check first. | Audit #6 | Traffic | M | Med (thin pages) |
| S8 | **"Official" wording review** (about 33 places). List only, keep "Past Papers". | Audit #7 | Trust | S | Low |
| S9 | **Later:** IBA admission test, MDCAT, ECAT (strong competitors) | Addendum item 7 | – | L | – |

Keep visible on every page: a real timed test, instant score, explanations, the correct names (SIBA Testing Service, not "Sindh Testing Service") and our own branded PDFs. Never ask for recalled exam questions, and never link to other sites' PDFs or books.

## Recommended batch order
- **Batch 9, crawl safety (S1):** being planned separately.
- **Batch 10, mock-test titles for clicks (S2) + NTHP/STHP linking (S3):** small change, quick traffic test.
- **Batch 11, test fairness and data:** answer-option shuffle at display time, usage counters, saving the finished state and the last question reached.
- **Batch 12, IBA CC&S STS hub + test timeline (S4, S5):** needs your verified dates.
- **Batch 13, PDF and quality:** PDF Builder fixes, NTHP PDF regeneration, near-duplicate split per test.
- **Batch 14, Teaching License hub (S6) + wording review (S8) + quota cleanup.**
- **Then:** STS subject hubs (S7) once enough questions pass the Gate, and the measurement audit (Lighthouse, security warnings, cards, tools).

## Technical appendix
- Soft 404: SPA fallback serves `index.html` with 200. Option: a client NotFound route plus a `noindex` meta (the host cannot send a real 404 status). A true 404 needs the host or a Cloudflare rule.
- Letter skew SQL: `upper(left(correct_answer,1))` on `job_test_questions where admin_approved`.
- Review states: `question_quality_reviews` grouped by `ai_verdict`, `deterministic_ok`. `near_dup` matches 1,898 rows (`reasons`).
- `user_attempt_history` 30 days: 9 distinct `session_id`s. `custom_test_sessions` 30 days: 26.
- Cron: indexnow 15m, jobtest queue 5m, streak 08:00, quality gate 2h and hourly, auto-fill 30m, stats hourly, duplicate scan 03:00, auto-merge 03:30.
- `mockTestUrl(slug, n, campaign)` in `src/lib/pdfBuilder/rules.js` takes a manual campaign; derive it from the slug with `-` replaced by `_`.
