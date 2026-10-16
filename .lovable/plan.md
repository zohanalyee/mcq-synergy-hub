# NTHP (IBA Karachi) SEO Audit - 16 Oct 2026 (report only, nothing built)

## 1. Existing assets (what I checked)
| Asset | Where | Facts | Indexable / sitemap |
|---|---|---|---|
| Blog: "IBA Karachi & OGDC National Talent Hunt Program (NTHP) 2027 Guide" | /blog/iba-karachi-ogdc-national-talent-hunt-program-2027 | Published 16 Oct, 781 words, does not mention STS or Sukkur | Published; **not yet in blog.xml** (that file was generated before the post) |
| Opportunity: "IBA Karachi & OGDC NTHP Orientation 2027" | scholarships/opportunity detail (id eb0bee1d…) | Imported listing | Not found in sitemap files |
| exam_pages row for NTHP / IBA Karachi | none | — | — |
| Mock test for IBA Karachi aptitude / NTHP | none (only the Sukkur IBA STHP test and the STS Junior Clerk test match "IBA") | — | — |
| /exams/iba-karachi page or route | none | — | — |
| Other mentions of "IBA Karachi" | src/data/programmaticSeo.ts lines 47, 687 — only as a **test centre** for MDCAT/FPSC Karachi guides | No confusion | — |

Confusion flags: none found that call NTHP "STS". Two wording risks to note:
- /exams/sts card says "the Sukkur IBA talent hunt" — correct, but it should never be the only "talent hunt" link a reader finds.
- /p/mdcat-karachi says MDCAT is run by "Sindh Testing Service (STS)" — this is a different body from SIBA Testing Services; not part of this project but worth a separate check.
- Not checked: Ihsan Trust / Meezan Bank / Mari Energies mentions inside opportunities beyond titles (none in titles).

## 2. Keyword coverage map (no volumes)
| Group | Keywords | Current page | Gap |
|---|---|---|---|
| a. NTHP brand | iba nthp, nthp 2027, nthp 2028, nthp last date, nthp eligibility, nthp districts | Blog post (2027/OGDC only) | No hub; nothing for 2028; no districts list page |
| b. Sponsor rounds | nthp ogdc, nthp mari energies, nthp ihsan trust meezan bank | Blog (OGDC only) | Mari Energies and Ihsan Trust/Meezan have no coverage |
| c. Test prep | iba aptitude test preparation / mcqs / sample paper, iba karachi test pattern, iba karachi admission 2027 | None | No page, no mock test |
| d. Disambiguation | sukkur iba sthp vs iba karachi nthp | /exams/sthp only | No "not to be confused with" box on either side |

Check in GSC (regex `nthp|aptitude|iba karachi|talent hunt`): all of group a, "iba aptitude test", "iba karachi admission", and whether "talent hunt" queries currently land on the STHP page (sign of confusion).

## 3. Proposed pages (fewest, strongest)
**Batch 3 — one hub only: `/exams/nthp`** (exam_pages slug `nthp`, kind `admission`)
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
| Page | Value | Effort | Risk |
|---|---|---|---|
| /exams/nthp hub | High (deadline 15 Dec) | Medium | Low |
| Disambiguation boxes | Medium | Low | Low |
| Blog in sitemap | Medium | Low | Low |
| Aptitude test prep page | Unknown until pattern sourced | High | Medium |

## Open questions
1. OK to also add the existing NTHP blog post to blog.xml in this batch?
2. Districts are from the poster only — show them labelled "as per official poster"?
3. Should the old opportunity listing link to the new hub?
4. Do you have an official IBA Karachi Aptitude Test pattern source for a later batch?
