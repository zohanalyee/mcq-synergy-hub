# MDCAT 2026 Roll-Slip / Test-Day Block Update

## Goal
Update the shared `MdcatTestDayBlock` on `/exams/mdcat` and `/mdcat-syllabus` with the newly confirmed STS facts (Press Release No. STS/SEC/1158/26, 10 Sep 2026). Everything else on both pages stays unchanged.

## Changes
1. Edit `src/components/mdcat/MdcatSprintBlocks.tsx` only:
   - Mark **Roll number slip download** as confirmed: admit slips are now live at `https://eslip.sts.net.pk` using CNIC/ID number.
   - Add a confirmed **Test centres** row: Karachi, Hyderabad, Jamshoro, Mirpurkhas, Shaheed Benazirabad, Larkana, Sukkur, Islamabad (Federal Capital).
   - Add confirmed **SMS/email alert** row: STS sent SMS to registered mobile numbers and will email slips to the PMDC-registered address.
   - Add a confirmed **Help / contact** row: `sts@iba-suk.edu.pk` and `071-5644200` (9 AM – 5 PM).
   - Add a confirmed **Print-in-advance** advisory row.
   - Keep the genuinely unannounced items (reporting time, gate closing time, test-centre allotment/city list if not covered by the press release) marked as “Not yet announced.”
   - Append the new source citation: “Verified on 10 September 2026 — SIBA Testing Services (STS) Press Release No. STS/SEC/1158/26.”

2. No route or page changes: `ExamLandingPage.tsx` and `MDCATSyllabus.tsx` already import and render `<MdcatTestDayBlock />`.

3. Verify the build still passes after the edit.

## Isolation Guarantee
Only the shared `MdcatTestDayBlock` component is touched. Test date, weightage tables, countdown, contextual links, SEO, structured data, and all other page content remain exactly as-is.
