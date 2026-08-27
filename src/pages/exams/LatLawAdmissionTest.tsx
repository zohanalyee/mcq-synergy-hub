import AdmissionTestPage from './AdmissionTestPage';

/**
 * LAT (Law Admission Test) landing page.
 *
 * Primary source: Pakistan Bar Council — Directorate of Legal Education
 * (dle.com.pk), specifically:
 *  - Pakistan Bar Council Legal Education Rules, 2015 (Rule 4, Admission to
 *    LL.B. class) — https://www.dle.com.pk/storage/rules/Legal-Education.pdf
 *  - Supreme Court of Pakistan directions reported as 2019 SCMR 389, hosted by
 *    the DLE, which formulate the LAT and its exact marks outline —
 *    https://www.dle.com.pk/storage/rules/2019%20S%20C%20M%20R%20389%20(1).pdf
 *
 * Verified on 27 August 2026. HEC's own LAT pages were unreachable on that
 * date, so HEC-specific facts (2026 test dates, fee, registration windows,
 * qualifying score) are shown as "not yet announced / not officially stated"
 * rather than guessed.
 */
const LatLawAdmissionTest = () => (
  <AdmissionTestPage
    slug="lat"
    name="LAT (Law Admission Test)"
    fullName="Law Admission Test — mandatory entry test for the 5-year LL.B. programme in Pakistan"
    metaTitle="LAT 2026 – Law Admission Test Pattern, Marks & Free MCQs"
    metaDescription="LAT (Law Admission Test) for 5-year LL.B. admission in Pakistan: official 100-mark outline (essay, personal statement, English, GK, Islamiyat, Pak Studies, Urdu, Math), eligibility under PBC Rules and free practice MCQs."
    keywords="LAT, Law Admission Test, LAT 2026, LAT paper pattern, LAT MCQs, 5 year LLB admission Pakistan, Pakistan Bar Council legal education rules, HEC LAT, LAT preparation"
    intro="The Law Admission Test (LAT) is the mandatory entry test for admission to the five-year LL.B. programme in Pakistan. It exists because of the Supreme Court of Pakistan's directions in the legal-education case reported as 2019 SCMR 389, which the Pakistan Bar Council's Directorate of Legal Education publishes as part of its rules library. Those directions require a law admission test for all law colleges in Pakistan, to be held biannually by the Higher Education Commission of Pakistan as the executing institution, and they fix the exact 100-mark outline of the paper — an essay, a personal statement and 75 marks of MCQs across English, General Knowledge, Islamic Studies, Pakistan Studies, Urdu and basic Math. Admission itself remains governed by the Pakistan Bar Council Legal Education Rules, 2015, under which a candidate who has passed Intermediate (or an equivalent examination) is eligible for the first year of the five-year LL.B. programme and admission is granted strictly on merit."
    examBody="Higher Education Commission of Pakistan (executing institution) under Supreme Court directions and Pakistan Bar Council rules"
    duration="Not officially stated in the Supreme Court directions or the PBC Legal Education Rules — check the HEC roll-number slip for your session"
    totalMarks="100 marks (25 marks written + 75 marks MCQs)"
    frequency="Biannually (twice a year), as directed for all law colleges in Pakistan"
    testDate="Not yet announced — no official LAT 2026 date could be verified from an official source on 27 August 2026"
    subjects={[
      'Essay (English or Urdu)',
      'Personal Statement (English or Urdu)',
      'English (synonyms, antonyms, prepositions)',
      'General Knowledge',
      'Islamic Studies',
      'Pakistan Studies',
      'Urdu (vocabulary)',
      'Basic Mathematics',
    ]}
    pattern={[
      { section: 'Essay', detail: 'Either in English or Urdu, 200 words maximum', weight: '15 marks' },
      { section: 'Personal Statement', detail: 'Either in English or Urdu, 200 words maximum', weight: '10 marks' },
      { section: 'MCQs — English', detail: 'Synonyms, antonyms and prepositions', weight: '20 marks' },
      { section: 'MCQs — General Knowledge', detail: 'General awareness MCQs', weight: '20 marks' },
      { section: 'MCQs — Islamic Studies', detail: 'Islamiyat MCQs', weight: '10 marks' },
      { section: 'MCQs — Pakistan Studies', detail: 'Pakistan Studies MCQs', weight: '10 marks' },
      { section: 'MCQs — Urdu', detail: 'Vocabulary', weight: '10 marks' },
      { section: 'MCQs — Math', detail: 'Basic Math', weight: '05 marks' },
      { section: 'Total', detail: 'Written sections plus MCQ sections', weight: '100 marks' },
    ]}
    patternNote="This table reproduces the LAT outline exactly as formulated in the Supreme Court's directions published by the Pakistan Bar Council's Directorate of Legal Education (2019 SCMR 389). A qualifying/passing score, the paper duration and the fee are not stated in that outline or in the PBC Legal Education Rules, 2015 — universities and HEC announce those per session, so they are deliberately not listed here. MCQ practice on this site covers the 75 MCQ marks; the essay and personal statement must be practised in writing."
    eligibility={[
      'A person who has passed the Higher Secondary Education examination (Intermediate) or an equivalent examination is eligible for admission to the first year of the five-year LL.B. programme — Rule 4(i), Pakistan Bar Council Legal Education Rules, 2015 (as amended 30-06-2017).',
      'Admission to LL.B. (1st year) is on merit — Rule 4(ii).',
      '5 percent of seats are reserved for the sons/daughters of advocates, who compete for admission in order of merit inter se — Rule 4(iii).',
      'A candidate is not eligible for admission to LL.B. if convicted of an offence involving moral turpitude — Rule 4(iv)(i).',
      'A candidate is not eligible if dismissed or removed from service of Government, a local authority or a statutory institution for corruption or misconduct — Rule 4(iv)(ii).',
      'Minimum marks percentage for LAT registration and any session-specific age limit are not stated in the PBC rules — individual affiliating universities publish their own merit requirements.',
    ]}
    keyDates={[
      { event: 'LAT 2026 test date', value: 'Not yet announced (no official notice verifiable on 27 Aug 2026)' },
      { event: 'Registration window', value: 'Not yet announced' },
      { event: 'Test frequency', value: 'Biannually, as directed for all law colleges in Pakistan' },
      { event: 'Result / validity', value: 'Not officially stated in the PBC rules or the Court directions' },
    ]}
    tips={[
      'Treat the MCQ half as the scoring half: 75 of the 100 marks are MCQs, and English plus General Knowledge alone carry 40 marks.',
      'Drill English synonyms, antonyms and prepositions specifically — the official outline names exactly those three areas, so generic grammar practice is not enough.',
      'Revise Pakistan Studies and Islamic Studies from your Intermediate textbooks first; 20 marks come from that familiar syllabus.',
      'Practise Urdu vocabulary deliberately — it carries 10 marks and is the section most candidates leave untouched.',
      'Basic Math is only 5 marks: cover percentages, ratios, averages and simple arithmetic, and do not over-invest beyond that.',
      'Write timed 200-word essays and personal statements in your stronger language (English or Urdu is allowed for both) — 25 marks depend on handwriting-speed and structure, not recall.',
      'Take the full-length LAT mock test on this site to find your weak sections, then practise those topics before repeating the mock.',
    ]}
    officialUrl="https://www.dle.com.pk/rules"
    officialSources={[
      {
        label: 'Pakistan Bar Council — Directorate of Legal Education: Rules library',
        url: 'https://www.dle.com.pk/rules',
      },
      {
        label: 'Pakistan Bar Council Legal Education Rules, 2015 (PDF) — Rule 4, admission to LL.B.',
        url: 'https://www.dle.com.pk/storage/rules/Legal-Education.pdf',
      },
      {
        label: 'Supreme Court directions formulating the LAT outline, 2019 SCMR 389 (PDF, hosted by DLE)',
        url: 'https://www.dle.com.pk/storage/rules/2019%20S%20C%20M%20R%20389%20(1).pdf',
      },
    ]}
    verifiedOn="27 August 2026 (Pakistan Bar Council / Directorate of Legal Education as primary source; HEC's own LAT pages were unreachable on that date and will be cross-checked when available)"
    relatedLinks={[
      { label: 'All admission tests', to: '/exams' },
      { label: 'MDCAT (medical)', to: '/exams/mdcat' },
      { label: 'NUMS entry test', to: '/exams/nums' },
      { label: 'Sukkur IBA admission test', to: '/exams/iba-sukkur' },
    ]}
    mockTest={{
      label: 'Take the LAT Mock Test',
      to: '/mock-tests/hec-law-admission-test-lat',
      note: '100-question mock test built on the official LAT MCQ weightage. The essay and personal statement are written sections and are not part of the MCQ mock.',
    }}
  />
);

export default LatLawAdmissionTest;
