INSERT INTO public.exam_pages (slug, kind, facts, verified_on, status, include_in_sitemap)
VALUES ('nthp', 'admission', $j${
 "verifiedOn": "16 October 2026",
 "officialUrl": "https://talenthunt.iba.edu.pk",
 "programs": [
  {"name":"Fall 2027","sponsor":"OGDC","url":"https://talenthunt.iba.edu.pk/program/details/27","opens":"12 October 2026","closes":"15 December 2026","closesIso":"2026-12-15","next":"Shortlisted students emailed 1 February 2027; online classes start 15 February 2027."},
  {"name":"Fall 2028","sponsor":"Ihsan Trust + Meezan Bank","url":"https://talenthunt.iba.edu.pk/program/details/28","opens":"12 October 2026","closes":"1 February 2027","closesIso":"2027-02-01","next":"Stage 1 results 30 March 2027; Stage 2 form (selected only) 15 January – 30 April 2027; final notification 30 June 2027."},
  {"name":"Fall 2028","sponsor":"Mari Energies","url":"https://talenthunt.iba.edu.pk/program/details/29","opens":"12 October 2026","closes":"1 February 2027","closesIso":"2027-02-01","next":"Stage 1 results 30 March 2027; Stage 2 form (selected only) 15 January – 30 April 2027; final notification 30 June 2027."},
  {"name":"Fall 2028","sponsor":"OGDC","url":"https://talenthunt.iba.edu.pk/program/details/30","opens":"12 October 2026","closes":"1 February 2027","closesIso":"2027-02-01","next":"Stage 1 results 30 March 2027; Stage 2 form (selected only) 15 January – 30 April 2027; final notification 30 June 2027."}
 ]
}$j$::jsonb, '2026-10-16', 'published', true)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.blog_posts SET updated_at = now(), content = $b$**Full dates, districts, syllabus and official sample papers:** [IBA Karachi NTHP 2027–28 guide](/exams/nthp)

## What is the IBA Karachi National Talent Hunt Program (NTHP)?

The Institute of Business Administration (IBA) Karachi runs the National Talent Hunt Program (NTHP). The Fall 2027 round is offered in collaboration with the Oil & Gas Development Company (OGDC). NTHP is an orientation and aptitude-preparation program for IBA Karachi's undergraduate admission. It is **not a degree** and not a direct admission.

NTHP is run by IBA Karachi (iba.edu.pk). It is a different program from the Sindh Talent Hunt Program (STHP) of Sukkur IBA University.

## Key dates for the OGDC Fall 2027 round

* **Form opened:** 12 October 2026
* **Pre-request form closes:** 15 December 2026 (the printed poster shows 15 December 2027, which appears to be a typo; the official portal lists 2026)
* **Shortlisted students emailed:** 1 February 2027
* **Online classes start:** 15 February 2027

## Eligible districts (as per the official poster)

* **Punjab:** Rahim Yar Khan, Attock, Chakwal, Rawalpindi, Jhelum, DG Khan
* **Khyber Pakhtunkhwa:** Karak, Lakki Marwat, Kohat, Orakzai, Dara Adam Khel
* **Balochistan:** Dera Bugti (North), Dera Bugti (South), Jhal Magsi
* **Sindh:** Ghotki, Hyderabad, Sanghar, Sukkur, Khairpur, Tando Allah Yar, Jamshoro, Badin, Sujawal, Tando Muhammad Khan

Applicants outside the listed districts are not covered by the Fall 2027 OGDC round.

## Eligibility, fee and documents

Eligibility, required documents, fee, test dates and centres for this round: **check the official announcement** on the IBA Talent Hunt portal.

## Benefits

* Orientation and preparation for IBA Karachi's undergraduate admission.
* Test-fee exemption for one round of the IBA Karachi admission test.
* A limited number of NTHP scholarships for candidates who pass the IBA Aptitude Test. A scholarship is not guaranteed.

## NTHP test syllabus

Per the official NTHP website, shortlisted candidates take an MCQ test based on the Matriculation and HSSC-I curriculum of English Grammar & Composition and Mathematics, and may then be shortlisted for a panel interview. See the [NTHP guide](/exams/nthp) for topics seen in the official sample papers.

## Other open NTHP rounds (Fall 2028)

Three Fall 2028 rounds are also open: Ihsan Trust + Meezan Bank, Mari Energies, and OGDC. Stage 1 pre-application closes on 1 February 2027. Details are on the [NTHP guide](/exams/nthp).

## How to apply

Apply only on the official IBA Karachi Talent Hunt portal: talenthunt.iba.edu.pk (Fall 2027 OGDC round: talenthunt.iba.edu.pk/program/details/27).

## Practise

Try the free [IBA Karachi NTHP mock test](/mock-tests/iba-karachi-nthp-mock-test-2027-english-mathematics-practice) in English and Mathematics — an independent practice test based on the published NTHP syllabus, not an official IBA paper.

*MCQsAI is an independent practice platform, not affiliated with IBA Karachi, Sukkur IBA University, OGDC, Mari Energies, Ihsan Trust or Meezan Bank.*$b$
WHERE slug = 'iba-karachi-ogdc-national-talent-hunt-program-2027';