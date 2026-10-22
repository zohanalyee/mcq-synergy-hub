# Batch 10 (part 1) — apply mock-test titles and descriptions from the owner's file

Source: `batch10_titles_descriptions.csv` (95 rows, matched on `job_test_id`). Text applied exactly as written — no rewording.

## Steps

1. **Backup first.** Save every row's current `id, title, seo_title, meta_description` to `docs/backups/job_tests_seo_backup_2026-10-22.json` (all 95 rows), before any change.
2. **Update titles.** For all 95 ids: `seo_title = new_seo_title`.
3. **Update descriptions.** For the 92 rows whose `new_meta_description` does not start with "HOLD": `meta_description = new_meta_description`. The 3 HOLD rows keep their current description.
4. **Title suffix rule** (page title in browser and prerendered HTML, same rule in both places):
   - If `seo_title` already ends with "| MCQsAI" → use it as is.
   - Otherwise add " | MCQsAI" only if the total stays 65 characters or less; else use `seo_title` alone.
   - Today the code always adds " | MCQsAI", which would give doubled suffixes on 29 rows and over-long titles on others.
5. **Verify.** Re-read all 95 rows and compare with the file; build; show the raw `<title>` and description from prerendered HTML for 3 examples (one already ending in "| MCQsAI", one getting the suffix, one too long for it).
6. **Report** rows updated (expect 95 titles, 92 descriptions), any id not found, and the rollback steps.

## Not touched

H1, slugs/URLs, page content, organization names, sitemaps, questions, NTHP/STHP linking (separate step).

## Point the owner should know

Two kinds of pages currently use a fixed title written in the code and ignore the database title:
- **STHP 2027** — fixed title "Sukkur IBA STHP Past Papers & Online Mock Test 2027 (Solved MCQs)" (kept earlier on purpose for the "Past Papers" search term).
- **Sukkur IBA Community Colleges & Schools** tests — titles built from the exact advert wording.

This plan keeps those fixed titles as they are (rule 4: no other changes). Their new database values will be saved but will not show on those pages until the owner asks to switch them.

## Rollback

Run the reverse update from the backup JSON (sets `seo_title` and `meta_description` back per id), and restore the previous Lovable version for the suffix-rule code change.

## Technical details

- Data change via `supabase--run_sql`: one `UPDATE job_tests ... FROM (VALUES ...)` for titles, one for the 92 descriptions; then a SELECT diff against the CSV.
- Shared helper `src/lib/mockTestTitle.js` (`buildMockTestTitle(seoTitle)`), used by `scripts/inject-meta.mjs` (line ~365) and `src/pages/MockTestDetail.tsx` (~line 143). `SEOHead` currently strips and re-appends the brand; MockTestDetail will pass the final title so SEOHead does not re-add it past 65 chars (small pass-through prop if needed).
- Test `src/lib/mockTestTitle.test.mjs`: ends-with-brand unchanged; 60-char title without brand stays bare (60+11 > 65); short title gets " | MCQsAI".
- Record the suffix rule in `AGENTS.md`.
