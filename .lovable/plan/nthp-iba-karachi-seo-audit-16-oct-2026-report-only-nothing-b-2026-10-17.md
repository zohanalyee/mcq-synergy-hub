# NTHP (IBA Karachi) SEO Audit - 16 Oct 2026 (report only, nothing built)

## 1. Existing assets (what I checked)


| Asset                                                                     | Where                                                                                               | Facts                                                       | Indexable / sitemap                                                          |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Blog: "IBA Karachi & OGDC National Talent Hunt Program (NTHP) 2027 Guide" | /blog/iba-karachi-ogdc-national-talent-hunt-program-2027                                            | Published 16 Oct, 781 words, does not mention STS or Sukkur | Published; **not yet in blog.xml** (that file was generated before the post) |
| Opportunity: "IBA Karachi & OGDC NTHP Orientation 2027"                   | scholarships/opportunity detail (id eb0bee1d…)                                                      | Imported listing                                            | Not found in sitemap files                                                   |
| exam_pages row for NTHP / IBA Karachi                                     | none                                                                                                | —                                                           | —                                                                            |
| Mock test for IBA Karachi aptitude / NTHP                                 | none (only the Sukkur IBA STHP test and the STS Junior Clerk test match "IBA")                      | —                                                           | —                                                                            |
| /exams/iba-karachi page or route                                          | none                                                                                                | —                                                           | —                                                                            |
| Other mentions of "IBA Karachi"                                           | src/data/programmaticSeo.ts lines 47, 687 — only as a **test centre** for MDCAT/FPSC Karachi guides | No confusion                                                | —                                                                            |


Confusion flags: none found that call NTHP "STS". Two wording risks to note:

- /exams/sts card says "the Sukkur IBA talent hunt" — correct, but it should never be the only "talent hunt" link a reader finds.
- /p/mdcat-karachi says MDCAT is run by "Sindh Testing Service (STS)" — this is a different body from SIBA Testing Services; not part of this project but worth a separate check.
- Not checked: Ihsan Trust / Meezan Bank / Mari Energies mentions inside opportunities beyond titles (none in titles).

## 2. Keyword coverage map (no volumes)


| Group             | Keywords                                                                                                  | Current page               | Gap                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------- |
| a. NTHP brand     | iba nthp, nthp 2027, nthp 2028, nthp last date, nthp eligibility, nthp districts                          | Blog post (2027/OGDC only) | No hub; nothing for 2028; no districts list page      |
| b. Sponsor rounds | nthp ogdc, nthp mari energies, nthp ihsan trust meezan bank                                               | Blog (OGDC only)           | Mari Energies and Ihsan Trust/Meezan have no coverage |
| c. Test prep      | iba aptitude test preparation / mcqs / sample paper, iba karachi test pattern, iba karachi admission 2027 | None                       | No page, no mock test                                 |
| d. Disambiguation | sukkur iba sthp vs iba karachi nthp                                                                       | /exams/sthp only           | No "not to be confused with" box on either side       |


Check in GSC (regex `nthp|aptitude|iba karachi|talent hunt`): all of group a, "iba aptitude test", "iba karachi admission", and whether "talent hunt" queries currently land on the STHP page (sign of confusion).

## 3. Proposed pages (fewest, strongest)

**Batch 3 — one hub only:** `/exams/nthp` (exam_pages slug `nthp`, kind `admission`)

- Title: `IBA Karachi NTHP 2027-28 – Dates, Districts & Prep | MCQsAI`
- Meta: `IBA Karachi National Talent Hunt Program: OGDC Fall 2027 apply by 15 Dec 2026; Fall 2028 rounds with Ihsan Trust, Meezan Bank & Mari Energies.` (≤155)
- H1: `IBA Karachi National Talent Hunt Program (NTHP) 2027–2028`
- H2s: What NTHP is (orientation, not a degree) · All 4 rounds – dates table · Fall 2027 OGDC districts (by province) · Fall 2028 two-stage process · Benefits (one-round test-fee waiver; limited scholarships after passing IBA Aptitude Test) · How to apply (portal link) · Not to be confused with Sukkur IBA STHP · FAQs · Official sources
- FAQs (6): last date for OGDC Fall 2027; which districts qualify; what are the Fall 2028 rounds and deadlines; is NTHP a degree; is NTHP the same as Sukkur IBA STHP; eligibility/fee (answer: "Check the official announcement").
- Links out: talenthunt.iba.edu.pk program pages, iba.edu.pk, /exams, /exams/sthp (disambiguation only), blog post. **Never /exams/sts.**
- Links in: /exams card, footer via /exams, blog post, /exams/sthp and /exams/iba-sukkur boxes.

**Not proposed now:** separate sponsor pages (three Fall 2028 rounds share identical dates → duplicate content). **IBA Karachi Aptitude Test prep page / mock test:** deferred — no official pattern verified yet, and no existing page to reuse. Revisit only after the official test pattern is sourced.

## 4. Data model

Today exam_pages.facts is free JSON and one `test_date` per row. It can already store a `programs` list (name, sponsor, link, stages with open/close dates) with no schema change. Missing pieces:

- Per-row auto "Applications closed" — the STHP logic (src/lib/sthpStatus.js) works on one date only. Propose a small shared helper `programStatus.js` used by page and prerender, closing each row the day after its own deadline (Pakistan time).
- Admin edit: the admin Exam Pages editor edits facts as JSON, so dates are editable without code, but a list of programs means editing raw JSON. Optional later: a small table editor.
- lastmod: set from `verified_on` only, updated only when you re-verify.

## 5. Technical checklist for /exams/nthp

- Canonical apex, no query (existing GlobalCanonical); robots index,follow.
- Sitemap: must pass `examPassesGate()` — status published, include_in_sitemap true, kind admission needs `officialUrl`. Expected exams.xml diff: **+1 /exams/nthp**.
- JSON-LD: match STHP today (Course + FAQPage + BreadcrumbList). Recommend dropping Course for NTHP? No — keep Course only as "MCQsAI prep" provider, consistent with others; no scholarship offers or EducationalOccupationalProgram.
- OG/Twitter via SEOHead; ?lang= follows existing rule.
- Static HTML must contain H1, dates table, districts list, FAQs (prerender check added).
- Reach: / → /exams → /exams/nthp (2 clicks). Breadcrumb Home › Exams › NTHP.

## 6. Internal links (current → proposed)

- /exams: none → card "IBA Karachi NTHP 2027–28"
- /exams/iba-sukkur, /exams/sthp: none → box "Looking for IBA Karachi's National Talent Hunt (NTHP)?"
- Blog NTHP post: none → "Full NTHP dates and districts"
- Topic pages via semanticGraph: none proposed now (no aptitude content to match).

## 7. Content rules

Every date, district and benefit comes from your verified list (16 Oct 2026). Deadline shown as **15 Dec 2026** with note "printed poster shows 2027; official portal says 2026". Eligibility, fee, test dates, centres, class format, 2028 districts, negative marking, passing marks → "Check the official announcement". Footer disclaimer exactly as you wrote.

## 8. Risks

Thin content (mitigated: one hub with real tables); duplicate sponsor pages (avoided); index bloat (+1 URL only); date typo (explicit note); after deadlines rows auto-switch to "Applications closed" and page stays live.

## 9. Batch 3 isolation

Touches: new NTHP page, route, prerender list, exam_pages row `nthp` + snapshot, new status helper, /exams card, boxes on /exams/sthp and /exams/iba-sukkur, link in blog post. Not touched: STS pages, mock tests, other sitemaps. Also regenerate blog.xml so the published NTHP post appears (that is a second sitemap change — needs your OK).

## Priority


| Page                    | Value                         | Effort | Risk   |
| ----------------------- | ----------------------------- | ------ | ------ |
| /exams/nthp hub         | High (deadline 15 Dec)        | Medium | Low    |
| Disambiguation boxes    | Medium                        | Low    | Low    |
| Blog in sitemap         | Medium                        | Low    | Low    |
| Aptitude test prep page | Unknown until pattern sourced | High   | Medium |


## Open questions

1. OK to also add the existing NTHP blog post to blog.xml in this batch?
2. Districts are from the poster only — show them labelled "as per official poster"?
3. Should the old opportunity listing link to the new hub?
4. Do you have an official IBA Karachi Aptitude Test pattern source for a later batch?

&nbsp;

BUILD MODE. Batch 3 FINAL: NTHP (IBA Karachi). This prompt replaces every earlier NTHP prompt/addendum. Audit approved. Isolation: only files listed in your audit section 9 plus the NTHP mock test page integration below. Expected sitemap diffs: exams.xml +1 (/exams/nthp); blog.xml +1 (the NTHP blog post); mock-tests.xml +1 ONLY if the NTHP mock test is active and passes the mock-test indexability gate (otherwise 0, and tell me which gate rule blocks it). All other sitemap addresses unchanged. Do not touch STS pages, STHP pages' content (except the one "not to be confused" box), board topics or other mock tests.

&nbsp;

DISAMBIGUATION (apply everywhere): NTHP = IBA KARACHI (iba.edu.pk; portals nthp.iba.edu.pk and talenthunt.iba.edu.pk). STHP and STS = SUKKUR IBA University. NEVER mention or link STS or /exams/sts on any NTHP page. Titles/H1/meta say "IBA Karachi" explicitly.

&nbsp;

VERIFIED FACTS (use ONLY these; verified 16 Oct 2026; source: official IBA portal pages, NTHP site, 2027 cycle flyer):

A) Open rounds (https://talenthunt.iba.edu.pk):

 - Fall 2027, with OGDC (/program/details/27): form open 12 Oct 2026; pre-request form closes 15 Dec 2026 (the poster prints 2027, a typo; the portal says 2026); shortlisted students emailed 1 Feb 2027; online classes start 15 Feb 2027. Districts (official poster only): Punjab: Rahim Yar Khan, Attock, Chakwal, Rawalpindi, Jhelum, DG Khan. KP: Karak, Lakki Marwat, Kohat, Orakzai, Dara Adam Khel. Balochistan: Dera Bugti (North), Dera Bugti (South), Jhal Magsi. Sindh: Ghotki, Hyderabad, Sanghar, Sukkur, Khairpur, Tando Allah Yar, Jamshoro, Badin, Sujawal, Tando Muhammad Khan.

 - Fall 2028 rounds: Ihsan Trust + Meezan Bank (/details/28), Mari Energies (/details/29), OGDC (/details/30). All three: Stage 1 pre-application open 12 Oct 2026, deadline 1 Feb 2027, selected students notified 30 Mar 2027; Stage 2 detailed form opens 15 Jan 2027 (selected only), deadline 30 Apr 2027, final notification 30 Jun 2027.

 - NTHP is an orientation / aptitude-preparation program for IBA Karachi's undergraduate admission, NOT a degree. NTHP candidates get test-fee exemption for one round; limited NTHP scholarships for those who pass the IBA Aptitude Test.

 - For the open rounds, everything else (eligibility, documents, fee, test dates, centres, class format, Fall 2028 districts, MCQ count, duration, negative marking, passing marks) = "Check the official announcement". Do NOT write "in-person" or "3-week" for open rounds.

B) NTHP test syllabus (https://nthp.iba.edu.pk/nthp_test_preparation.php): shortlisted candidates take an MCQ test based on the Matriculation and HSSC-I curriculum of English Grammar & Composition and Mathematics; based on performance and other criteria they are further shortlisted for a panel interview. Suggested topics are guidance only; the test is not limited to them.

&nbsp;

1) exam_pages row `nthp`, kind `admission`, route /exams/nthp.

- Title: IBA Karachi NTHP 2027-28: Dates, Syllabus, Districts | MCQsAI

- H1: IBA Karachi National Talent Hunt Program (NTHP) 2027–2028: Dates, Districts & Test Syllabus

- Meta: IBA Karachi NTHP: OGDC Fall 2027 apply by 15 Dec 2026, Fall 2028 rounds, eligible districts, test syllabus (English & Maths) and official sample papers.

- Section order: what NTHP is; dates table for the 4 open rounds; Fall 2027 OGDC districts by province ("as per official poster"); Fall 2028 two-stage process; benefits; how to apply (portal links /details/27-30); NTHP test syllabus (2); official sample papers (3); previous cycle reference (4); practice mock test CTA (7); "Not to be confused with Sukkur IBA STHP" box; FAQs (5); official sources.

- Say: "Applicants outside the listed districts are not covered by the Fall 2027 OGDC round."

- Footer disclaimer: "MCQsAI is an independent practice platform, not affiliated with IBA Karachi, Sukkur IBA University, STS, OGDC, Mari Energies, Ihsan Trust or Meezan Bank."

- JSON-LD: FAQPage + BreadcrumbList ONLY (kept in sync with visible FAQs). No Course, no EducationalOccupationalProgram, no scholarship/Offer markup.

- Verified on: 16 Oct 2026 in exam_facts; sitemap lastmod = verified_on only. Must pass examPassesGate(). Everything below in STATIC HTML (not JS-only).

&nbsp;

2) SECTION "NTHP test syllabus (English & Mathematics)". Label: "Per the official IBA NTHP website and official sample papers, verified 16 Oct 2026" with source link. State this is the NTHP assessment test, NOT the IBA Karachi undergraduate aptitude test.

 a) Official outline text exactly as in fact B.

 b) Table "Pattern in the official sample papers (older batches)". Label: "Patterns differ between sample papers and may differ from the current test. Check the official announcement for this year." Batch 2018 sample: Mathematics 50 MCQs, 70 min; English 45 MCQs, 50 min; no negative marking. Sample Paper VI: Mathematics 45 MCQs, 60 min; English 40 MCQs, 45 min; negative marking yes. Current pattern: "Check the official announcement".

 c) "Topics seen in the sample papers" (topic names only): Mathematics: sets, relations, functions; exponents, surds, logarithms; polynomials (remainder, HCF, factorization, division); linear systems; quadratic equations; absolute-value equations and inequalities; matrices and determinants; sequences and series; permutation, combination, probability; ratio, proportion, variation; percentages; scale and map problems; word problems (age, speed-distance, consecutive integers, area/perimeter); triangles, circles, rectangles; trigonometric ratios and identities; mean, median, mode, standard deviation, variance; rational and irrational numbers, decimals. English: parts of speech in context; antonyms; cloze passages (tenses, punctuation); prepositions; short real-life notices; sentence ordering; best heading for a paragraph; poem comprehension; reading comprehension (main idea, inference, vocabulary in context, reference words); advanced vocabulary sentence completion. Note: "Sample Paper VI is noticeably harder in English (advanced vocabulary and long passages) than the Batch 2018 sample."

 d) Do NOT copy, quote or paraphrase individual questions from the IBA PDFs.

&nbsp;

3) "Official NTHP sample papers (published by IBA Karachi, older batches)": outbound links only (rel="noopener", new tab): Batch 2019 https://nthp.iba.edu.pk/pdfs/batch2019.pdf ; Batch 2018 https://nthp.iba.edu.pk/pdfs/NTHPBatch2018PastSamplePaper.pdf ; Sample Paper I https://nthp.iba.edu.pk/pdfs/SAMPLETESTPAPERS.pdf ; Sample Paper II https://www.iba.edu.pk/News/past_entry_test/NTHPJAN012012.htm ; III https://nthp.iba.edu.pk/pdfs/Sample_Test_III.pdf ; IV .../Sample_Test_IV.pdf ; V .../Sample_Test_V.pdf ; VI .../Sample_Test_VI.pdf. Check each returns 200, drop dead links and tell me which. Do not copy, embed or host the PDFs.

&nbsp;

4) SECTION "Previous cycle for reference: NTHP Admissions Cycle 2027 (closed)". Source: official 2027 cycle flyer. Must begin with: "This is the main NTHP round for IBA Karachi's Fall 2027 admission cycle, which has closed. Eligibility, documents and format for the currently open rounds may differ: check the official announcement for each round."

 - Sponsors: Ihsan Trust and Meezan Bank.

 - Eligibility in that cycle: financially deserving students with 80% or above marks in the SSC-II (Matric) examination from any Board of Secondary Education in Pakistan in 2025.

 - Programme: 3 weeks of in-person training on the IBA Karachi campus; IBA Aptitude Test preparation; academic coaching and counselling; mock examination; exemption from IBA's undergraduate test fee for Round 1 or Round 2 (any one) of the Fall 2027 cycle.

 - Documents in that cycle: Matric marksheet; HSSC-I enrollment/admit card (mandatory); applicant's CNIC or B-Form; parent/guardian's CNIC; salary slip and income certificate (affidavit not acceptable; business owners attach FBR income tax return); applicant's birth certificate and domicile certificate, or father's domicile certificate; FBR income tax return (mandatory).

 - Dates of that cycle (ALL PASSED, shown as a static "Closed" table): Stage 1 pre-application 15 Jan to 11 Mar 2026; selected students emailed 30 Mar 2026; Stage 2 detailed form with documents deadline 30 Apr 2026; final notification 30 Jun 2026; physical classes mid-July 2026. (Do not state a Stage 2 opening date.)

 - Disclaimer: NTHP does not guarantee an NTHP scholarship or financial assistance; a limited number of scholarships are available for candidates who pass the IBA Aptitude Test after the orientation; IBA may change policies at its discretion.

 - IBA Karachi undergraduate programs listed on the flyer: School of Business Sciences: BBA, BS Accounting and Finance, BS Business Analytics. School of Economics & Social Sciences: BS Economics, BS Economics and Mathematics, BS Social Sciences and Liberal Arts. School of Mathematics & Computer Science: BS Computer Science, BS Mathematics. Contact: nthp@iba.edu.pk.

 - RULE: do NOT copy this section's eligibility/documents/format into the OGDC Fall 2027 or Fall 2028 rows. "80%" may appear ONLY inside this section and its FAQ.

&nbsp;

5) FAQs (14+, visible and in FAQPage JSON-LD): last date for OGDC Fall 2027 (15 Dec 2026); "The poster says December 15, 2027, which is correct?" (portal lists 15 Dec 2026); which districts qualify; Fall 2028 rounds and deadlines; is NTHP a degree; is NTHP the same as Sukkur IBA STHP (no); what is the NTHP test syllabus; where can I find NTHP sample/past papers; is there an interview after the test (per the NTHP website, shortlisted candidates are further shortlisted for a panel interview); what was the NTHP 2027 eligibility (80% in SSC-II 2025, financially deserving, per the previous cycle; check official announcement for current rounds); which documents were required (previous cycle list); does NTHP guarantee a scholarship (no, per the official disclaimer); is NTHP in-person (previous main cycle: 3-week in-person training; the OGDC Fall 2027 round lists online classes; check each round); eligibility/fee of open rounds ("Check the official announcement"); where can I practise (link to the NTHP mock test).

&nbsp;

6) Shared helper programStatus.js: each open-round row closes the day after its OWN deadline (Pakistan time) and shows "Applications closed"; page stays live. Store as a `programs` list in exam_pages.facts (editable in admin JSON). The previous-cycle table is static "Closed".

&nbsp;

7) NTHP MOCK TEST integration. Page: https://mcqsai.com/mock-tests/iba-karachi-nthp-mock-test-2027-english-mathematics-practice (already imported from JSON).

 - FIRST report (no change yet): is it active/published; approved MCQ count vs the 85 expected; indexability gate for mock tests and whether this page passes; current title/meta/canonical/robots; whether it is in mock-tests.xml; which sibling/related tests it shows.

 - Do NOT force it active if it fails the gate. Report why.

 - If SEO title/meta fields are empty, set: title "IBA Karachi NTHP Mock Test 2027 – English & Maths | MCQsAI"; meta "Free IBA Karachi NTHP practice mock test: 85 MCQs in English & Mathematics on the published NTHP syllabus. Timed, with answers. Not an official paper." (only say "Free" if mock tests are actually free to access).

 - Add static visible links: from the mock test to /exams/nthp ("NTHP dates, districts & syllabus") and from /exams/nthp to the mock test (CTA "Practice NTHP mock test"). Add the label "Independent practice test based on the published NTHP syllabus, not an official IBA paper" and the disclaimer footer if missing.

 - STS guard: make sure the STS reverse-link rule (which adds a link to /exams/sts on STS-conducted tests) does NOT match this test because its organization contains "IBA", and that no STS-conducted tests appear as its related tests. If related-test logic is organization-based, exclude STS tests for this page and tell me what you changed.

&nbsp;

8) BLOG POST /blog/iba-karachi-ogdc-national-talent-hunt-program-2027: FIRST re-read it and list every date/eligibility/format claim. Remove or change to "Check the official announcement" anything not in the verified facts above (open-round eligibility must not use the 80% rule). Make sure it says IBA Karachi, never mentions STS, and add a prominent link to /exams/nthp. Then regenerate blog.xml so it appears (+1).

&nbsp;

9) LINKS: /exams card "IBA Karachi NTHP 2027–28"; a box on /exams/sthp and /exams/iba-sukkur: "Looking for IBA Karachi's National Talent Hunt (NTHP)? That is a different program from Sukkur IBA." If simple, link the old NTHP opportunity listing to /exams/nthp; otherwise skip and tell me.

&nbsp;

10) REPORT: raw HTML of /exams/nthp (title, meta, h1, canonical, robots, JSON-LD types); static presence of H1 / dates table / districts / syllabus / sample-paper links / previous-cycle section / FAQs; count of "80%" occurrences and their locations; text search proving "STS" does not appear on /exams/nthp, the NTHP blog post or the NTHP mock test; word count; internal link counts; sample-paper link status codes; mock test findings from step 7; sitemap diffs for exams.xml, blog.xml and mock-tests.xml; blog claims removed/changed; full build pass count; canonical of 3 other pages unchanged.