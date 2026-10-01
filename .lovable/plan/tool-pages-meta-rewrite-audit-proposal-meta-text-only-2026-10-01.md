# Tool Pages Meta Rewrite — Audit & Proposal (meta text only)

## Audit findings

- Exactly **15 indexable tool pages** (allow-list: `src/config/toolsSeo.ts` → INDEXABLE_TOOL_PATHS). All others are noindex,follow — untouched.
- Meta comes from `src/data/toolsData.ts` fields `seoTitle` / `seoDescription`, consumed by:
  - `ToolWrapper` → `<SEOHead>` (prerendered HTML for crawlers)
  - `ToolRouteSEO` (Helmet override on live pages) → effective title = **seoTitle + " | MCQsAI"**, so seoTitle must be ≤ ~51 chars to stay under Google's ~60-char cut.
- Only **1 of 15** currently has a keyword-led seoTitle (aggregate-calculator). The other 14 use generic fallbacks like "GPA Calculator — Free Online Student Tools | MCQsAI".
- Exception: `/tools/age-calculator` has no SEOHead — its raw HTML title is hardcoded in `scripts/prerender-routes.mjs` (TOOLS_WITHOUT_SEOHEAD) and must be updated there too, in sync with toolsData.
- No content, layout, ads, sitemap, or routing changes. Only text values in 2 files.

## Keyword evidence (Semrush, Pakistan db, Oct 2026)

gpa calculator 40,500 · cgpa calculator 18,100 · gpa to cgpa 22,200 · percentage calculator 33,100 · how to calculate percentage of marks 1,900 · aggregate calculator 12,100 (difficulty 12) · nums aggregate 3,600 · merit calculator 1,300 · zakat calculator 18,100 (zakat on gold 3,600, nisab 2026 4,400) · salary tax calculator pakistan 5,400 (difficulty 17) · attendance calculator 590 ("75% rule" questions) · gpa to percentage 880.

## Proposed meta (all 15)

Titles = proposed seoTitle (the page then shows "… | MCQsAI"). Descriptions ≤ 155 chars.


| #   | Path                            | Current title                                                                       | Proposed seoTitle                                  |
| --- | ------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | /tools/aggregate-calculator     | MDCAT Aggregate Calculator 2026 — NUMS, UHS, ECAT & NUST (66 chars live, truncated) | Aggregate Calculator 2026 — MDCAT, NUMS, UHS, ECAT |
| 2   | /tools/merit-calculator         | Merit Calculator — Free Online Student Tools                                        | Merit Calculator 2026 — MDCAT & University Merit   |
| 3   | /tools/gpa-calculator           | GPA Calculator — Free Online Student Tools                                          | GPA Calculator Pakistan — University GPA (4.0)     |
| 4   | /tools/cgpa-calculator          | CGPA Calculator — Free Online Student Tools                                         | CGPA Calculator — Semester-wise CGPA (4.0)         |
| 5   | /tools/gpa-to-percentage        | GPA to Percentage — Free Online Student Tools                                       | GPA to Percentage Calculator Pakistan (4.0)        |
| 6   | /tools/percentage-to-gpa        | Percentage to GPA — Free Online Student Tools                                       | Percentage to GPA Calculator Pakistan (4.0)        |
| 7   | /tools/marks-calculator         | Marks Calculator — Free Online Student Tools                                        | Marks Percentage Calculator — Total & Grade        |
| 8   | /tools/result-calculator        | Result Calculator — Free Online Student Tools                                       | Result Calculator — Marks, Percentage & Grade      |
| 9   | /tools/attendance-calculator    | Attendance Calculator — Free Online Student Tools                                   | Attendance Percentage Calculator — 75% Rule        |
| 10  | /tools/percentage-calculator    | Percentage Calculator — Free Online Student Tools                                   | Percentage Calculator — Marks & Change %           |
| 11  | /tools/age-calculator           | Age Calculator (hardcoded in prerender-routes.mjs)                                  | Age Calculator — Years, Months & Days              |
| 12  | /tools/periodic-table           | Periodic Table — Free Online Student Tools                                          | Periodic Table — Interactive, All 118 Elements     |
| 13  | /tools/pakistan-tax-calculator  | Pakistan Income Tax Calculator — Free Online Student Tools                          | Salary Tax Calculator Pakistan 2025-26 (FBR)       |
| 14  | /tools/zakat-calculator         | Zakat Calculator — Free Online Student Tools                                        | Zakat Calculator 2026 — Gold, Cash & Nisab         |
| 15  | /tools/school-attendance-system | School Attendance System — Free Online Student Tools                                | Free School Attendance System — Staff & Students   |


Proposed descriptions (one per tool, in the same order as the table):

1. Free aggregate calculator for MDCAT, NUMS, UHS, ECAT & NUST 2026. Enter Matric, FSc and entry-test marks to get your admission aggregate % instantly.
2. Free merit calculator for Pakistani universities 2026. Add hafiz-e-Quran bonus, sports, disability & overseas quotas to your MDCAT or university merit.
3. Free GPA calculator for Pakistani university students. Enter grades & credit hours to calculate your semester GPA on the 4.0 scale instantly.
4. Free CGPA calculator for university students in Pakistan. Calculate your cumulative GPA across all semesters with semester-by-semester input.
5. Free GPA to percentage converter for Pakistan. Convert your 4.0-scale GPA to percentage with HEC and university conversion formulas.
6. Free percentage to GPA converter for Pakistan. Convert your marks percentage to a 4.0-scale GPA instantly — no signup required.
7. Free marks percentage calculator. Enter subject-wise marks to get total marks, percentage and grade — works for Matric, FSc & board results.
8. Free result calculator for students. Enter obtained and total marks to get your percentage, grade and pass/fail status instantly.
9. Free attendance percentage calculator. Check if you meet the 75% attendance rule and how many classes you can still miss.
10. Free online percentage calculator for students. Find percentage of marks, percentage increase or decrease, and X% of a number instantly.
11. Free age calculator. Enter your date of birth to get your exact age in years, months and days — useful for job & admission forms.
12. Free interactive periodic table with all 118 elements. Atomic number, mass, electron configuration and properties at a glance.
13. Free Pakistan salary tax calculator 2025-26. Calculate income tax on salary using latest FBR slabs — monthly & annual tax in PKR.
14. Free Zakat calculator for Pakistan 2026. Calculate 2.5% Zakat on gold, silver, cash and business assets with updated nisab rates in PKR.
15. Free school attendance system for Pakistani schools. Mark student & staff attendance, manage leaves and download PDF reports.

## Implementation steps (on approval)

1. `src/data/toolsData.ts` — set `seoTitle` + `seoDescription` for the 14 tools missing them; refine the existing aggregate-calculator pair. H1 and page body untouched (h1 comes from a separate field).
2. `scripts/prerender-routes.mjs` — update the hardcoded age-calculator title/description to match the new values (raw-HTML head source for that page).
3. Build + prerender verification: confirm raw HTML of a sample (gpa-calculator, zakat-calculator, age-calculator) carries the new title/description; typecheck clean.
4. No ads, sitemap, robots, page-content or route changes. Nothing else touched.

Live visibility requires publish after the change, plus Google re-crawl.

&nbsp;

**Plan approved. Proceed with all 15 meta title/description updates as proposed:**

1. Update src/data/toolsData.ts (seoTitle + seoDescription for all 15 tools)

2. Update scripts/prerender-routes.mjs for age-calculator's hardcoded title/description to match

3. Verify raw HTML output for 3 sample pages (gpa-calculator, zakat-calculator, age-calculator) shows the new title/description correctly

4. Confirm typecheck passes

Isolation guarantee confirmed — no ads, sitemap, robots, page-content, H1, or route changes. Only meta title/description text in these 2 files.