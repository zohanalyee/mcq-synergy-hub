// "Past papers" guide pages for NTHP and STHP (/nthp-past-papers, /sthp-past-papers).
// Honest by design: we never call our own questions past papers, guess papers or
// official. The pages say what the institution itself has published, then point
// to our free solved practice sets and mock test.
// NTHP = IBA Karachi; STHP = Sukkur IBA. Never mention STS on the NTHP entry.

export const PAST_PAPER_PAGES = [
  {
    slug: 'nthp-past-papers',
    exam: 'nthp',
    examLabel: 'NTHP',
    title: 'NTHP Past Papers & Free Solved Practice Papers | MCQsAI',
    description: 'Looking for NTHP past papers? See what IBA Karachi has published, then get free solved practice papers with explanations and a free mock test.',
    h1: 'NTHP Past Papers, Guess Papers and Free Solved Practice Papers',
    intro: [
      'Many students search for NTHP past papers, previous papers or a guess paper before the IBA Karachi National Talent Hunt Program (NTHP) assessment test. This page tells you honestly what IBA Karachi has published, and gives you free solved practice papers and a free online mock test so you can prepare on the right topics.',
      'Everything here is free. No sign-up is needed to download the practice papers.',
    ],
    officialHeading: 'Are official NTHP past papers available?',
    officialStatus: [
      'We could not find full NTHP test papers on the NTHP website. Its archive page links to a "Past Papers (Sample)" page run by IBA Karachi admissions, and its test preparation page explains what to prepare.',
      'If IBA Karachi publishes more papers, the official NTHP website is the only place to trust. Be careful with files that claim to be real NTHP papers: nobody outside IBA Karachi has the real test.',
    ],
    official: [
      { label: 'IBA Karachi NTHP — test preparation page', url: 'https://nthp.iba.edu.pk/nthp_test_preparation.php' },
      { label: 'IBA Karachi NTHP — archive page (links to sample papers)', url: 'https://nthp.iba.edu.pk/archive.php' },
    ],
    guess: 'There is no real NTHP guess paper. Nobody outside IBA Karachi knows the test questions, so any "100% guess paper" is only a guess. A better plan is to practise every topic in the published NTHP syllabus (Mathematics and English) with solved questions, check your mistakes, and take a timed mock test.',
    faqs: [
      { question: 'Are NTHP past papers available for free?', answer: 'We could not find full NTHP test papers on the official NTHP website. It links to a sample papers page run by IBA Karachi admissions. For more practice, MCQsAI offers free solved practice papers and a free online mock test based on the published syllabus.' },
      { question: 'Are the MCQsAI papers real NTHP past papers?', answer: 'No. They are original practice papers written by MCQsAI on the topics in the published NTHP syllabus. They are unofficial and are not IBA Karachi papers.' },
      { question: 'Is there an NTHP guess paper?', answer: 'No real guess paper exists, because nobody outside IBA Karachi knows the questions. Practise all syllabus topics instead of relying on a guess.' },
      { question: 'Do the practice papers have answers and explanations?', answer: 'Yes. Each free practice paper has 50 questions, a full answer key and a short explanation for every question.' },
      { question: 'Which subjects should I practise for NTHP?', answer: 'Mathematics and English, as listed on the NTHP test preparation page. Our practice papers and mock test cover both.' },
      { question: 'Is the NTHP mock test free?', answer: 'Yes. The online NTHP mock test on MCQsAI is free, timed and shows your score with explanations.' },
    ],
    disclaimer: 'MCQsAI is an independent practice platform, not affiliated with IBA Karachi. Our questions are original and were not copied from any official document.',
  },
  {
    slug: 'sthp-past-papers',
    exam: 'sthp',
    examLabel: 'STHP',
    title: 'STHP Past Papers & Free Solved Practice Papers | MCQsAI',
    description: 'Looking for STHP past papers? Get the Sukkur IBA STHP sample paper link, free solved practice papers with explanations and a free mock test.',
    h1: 'STHP Past Papers, Guess Papers and Free Solved Practice Papers',
    intro: [
      'Many students search for STHP past papers, previous papers or a guess paper before the Sukkur IBA Sindh Talent Hunt Program (STHP) test. This page tells you honestly what Sukkur IBA has published, and gives you free solved practice papers and a free online mock test for English, Mathematics and ICT.',
      'Everything here is free. No sign-up is needed to download the practice papers.',
    ],
    officialHeading: 'Are official STHP past papers available?',
    officialStatus: [
      'Sukkur IBA has published one STHP sample paper (STHP-2019) on its admissions sample papers page. We could not find full papers of later STHP tests there.',
      'The sample paper shows the style of the test. For the current pattern, marks and rules, always check the latest Sukkur IBA announcement.',
    ],
    official: [
      { label: 'Sukkur IBA — sample papers page', url: 'https://iba-suk.edu.pk/admissions/sample-papers' },
      { label: 'Sukkur IBA — STHP-2019 sample paper (PDF)', url: 'https://iba-suk.edu.pk/Content/pdf/admissions/samples/Sample_Paper_STHP-2019-Nov-12-2018.pdf' },
    ],
    guess: 'There is no real STHP guess paper. Nobody outside Sukkur IBA knows the test questions, so any "100% guess paper" is only a guess. A better plan is to read the official sample paper, practise every syllabus area (English, Mathematics and ICT) with solved questions, and take a timed mock test.',
    faqs: [
      { question: 'Are STHP past papers available for free?', answer: 'Sukkur IBA has published one free STHP sample paper (STHP-2019). We could not find full papers of later tests. MCQsAI adds free solved practice papers and a free online mock test based on the published syllabus.' },
      { question: 'Are the MCQsAI papers real STHP past papers?', answer: 'No. They are original practice papers written by MCQsAI for the English, Mathematics and ICT areas of the STHP syllabus. They are unofficial and are not Sukkur IBA papers.' },
      { question: 'Is there an STHP guess paper?', answer: 'No real guess paper exists, because nobody outside Sukkur IBA knows the questions. Practise all syllabus areas instead of relying on a guess.' },
      { question: 'Do the practice papers have answers and explanations?', answer: 'Yes. Each free practice paper has 50 questions (20 English, 20 Mathematics, 10 ICT), a full answer key and a short explanation for every question.' },
      { question: 'Is the STHP mock test free?', answer: 'Yes. The online STHP mock test on MCQsAI is free, timed and shows your score with explanations.' },
      { question: 'What is the difference between STHP and NTHP?', answer: 'STHP is the Sindh Talent Hunt Program run by Sukkur IBA University. NTHP is the National Talent Hunt Program run by IBA Karachi. They are separate programs with separate tests.' },
    ],
    disclaimer: 'MCQsAI is an independent practice platform, not affiliated with Sukkur IBA University. Our questions are original and were not copied from any official document.',
  },
];

export const getPastPaperPage = (exam) => PAST_PAPER_PAGES.find((p) => p.exam === exam) || null;
export const PAST_PAPER_PATHS = PAST_PAPER_PAGES.map((p) => `/${p.slug}`);
