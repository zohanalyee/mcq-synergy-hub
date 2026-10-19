// Free practice PDF landing pages (/pdf/:slug). Add an exam by adding data only.
// NTHP = IBA Karachi; STHP = Sukkur IBA. Never mention STS on the NTHP entry.
export const SITE = 'https://mcqsai.com';
export const CHANNEL_FALLBACK = 'https://whatsapp.com/channel/0029Vb9DgAk8KMqkSpdiWV32';

/** Owner sets this date (e.g. '20 October 2026'); empty keeps the line hidden. */
export const PDF_VERIFIED_ON = '';

const DISCLAIMER_FULL = 'MCQsAI is an independent practice platform, not affiliated with IBA Karachi, Sukkur IBA University, STS, OGDC, Mari Energies, Ihsan Trust or Meezan Bank.';
const DISCLAIMER_NTHP = 'MCQsAI is an independent practice platform, not affiliated with IBA Karachi, Sukkur IBA University, OGDC, Mari Energies, Ihsan Trust or Meezan Bank.';

export const PRACTICE_PDFS = [
  {
    slug: 'nthp-practice-questions',
    exam: 'nthp',
    examLabel: 'NTHP',
    title: 'NTHP Practice Questions PDF – Free Unofficial MCQs | MCQsAI',
    description: 'Free NTHP practice questions PDF: 50 original MCQs (Maths, English) based on the published syllabus, with answer key and explanations. Unofficial.',
    h1: 'NTHP Practice Questions PDF (Free, Unofficial)',
    hub: { label: 'IBA Karachi NTHP guide', to: '/exams/nthp' },
    mockTest: { label: 'IBA Karachi NTHP mock test', to: '/mock-tests/iba-karachi-nthp-mock-test-2027-english-mathematics-practice' },
    file: '/downloads/NTHP-Free-Practice-Set-50-Questions-MCQsAI-v3.pdf',
    intro: [
      'This free NTHP practice questions PDF is a set of 50 original multiple-choice questions written by MCQsAI for students preparing for the IBA Karachi National Talent Hunt Program (NTHP). The questions follow the Mathematics and English areas listed in the published NTHP test preparation syllabus, so you can check how ready you are before the real aptitude test.',
      'The NTHP MCQs PDF is meant for intermediate and A-level students who want quick, printable practice at home, in class or on a phone. Every question has an answer key and a short explanation, so you can learn from each mistake instead of only counting marks.',
      'Honest label: this is an MCQsAI practice set based on the published syllabus. It is unofficial, it is not an IBA paper, and there is no guarantee that the real test will look the same.',
    ],
    sections: [
      { section: 'Mathematics', count: 26 },
      { section: 'English', count: 24 },
    ],
    preview: [
      { q: 'If A = {1, 2, 3, 4, 5, 6} and B = {2, 4, 6, 8}, then n(A ∪ B) equals:', options: ['6', '10', '8', '7'], answer: '7', why: 'A ∪ B = {1, 2, 3, 4, 5, 6, 8}, which has 7 elements.' },
      { q: 'Simplify (2⁵ × 2⁻³) ÷ 2⁻¹:', options: ['16', '8', '2', '4'], answer: '8', why: 'Exponents: 5 − 3 − (−1) = 3, and 2³ = 8.' },
      { q: 'Factorise x² − 5x − 14:', options: ['(x − 7)(x + 2)', '(x − 5)(x + 14)', '(x − 14)(x + 1)', '(x + 7)(x − 2)'], answer: '(x − 7)(x + 2)', why: '−7 × 2 = −14 and −7 + 2 = −5.' },
      { q: 'Choose the word closest in meaning to "diligent":', options: ['hesitant', 'careless', 'hardworking', 'lazy'], answer: 'hardworking', why: 'Diligent means showing steady, careful effort.' },
      { q: 'Choose the word opposite in meaning to "frugal":', options: ['extravagant', 'economical', 'thrifty', 'careful'], answer: 'extravagant', why: 'Frugal means spending little; extravagant means spending too much.' },
    ],
    faqs: [
      { question: 'Is this NTHP practice questions PDF an official paper?', answer: 'No. It is an unofficial MCQsAI practice set based on the published NTHP syllabus. It is not an IBA Karachi paper and does not guarantee what the real test will contain.' },
      { question: 'How many questions are in the NTHP MCQs PDF?', answer: 'The set has 50 questions: 26 Mathematics and 24 English. A suggested time of about 60 minutes helps you practise under timed conditions.' },
      { question: 'Are answers and explanations included?', answer: 'Yes. The PDF includes a full answer key and a short explanation for every question.' },
      { question: 'Is the real NTHP test pattern the same as this PDF?', answer: 'Not necessarily. The section split here is our practice choice. Check the official IBA Karachi NTHP announcement and test preparation page for the real pattern.' },
      { question: 'Is the NTHP practice questions PDF free?', answer: 'Yes. The PDF is free to download and share. No sign-up is needed. You can also take the full online practice test on MCQsAI for free.' },
      { question: 'What is the difference between NTHP and STHP?', answer: 'NTHP is the National Talent Hunt Program run by IBA Karachi. STHP is the Sindh Talent Hunt Program run by Sukkur IBA University. They are separate programs with separate tests.' },
    ],
    official: [
      { label: 'IBA Karachi NTHP — official test preparation page', url: 'https://nthp.iba.edu.pk/nthp_test_preparation.php' },
    ],
    disclaimer: DISCLAIMER_NTHP,
  },
  {
    slug: 'sthp-practice-questions',
    exam: 'sthp',
    examLabel: 'STHP',
    title: 'STHP Test Preparation PDF – Free Sample Questions | MCQsAI',
    description: 'Free STHP test preparation PDF: 50 original sample questions MCQs PDF (English, Maths, ICT) from the published syllabus. Answer key + explanations. Unofficial.',
    h1: 'STHP Test Preparation PDF – Free Sample Questions (Unofficial)',
    hub: { label: 'Sukkur IBA STHP guide', to: '/exams/sthp' },
    mockTest: { label: 'Sukkur IBA STHP 2027 mock test', to: '/mock-tests/sukkur-iba-sindh-talent-hunt-program-sthp-2027' },
    file: '/downloads/STHP-Free-Practice-Set-50-Questions-MCQsAI-v3.pdf',
    intro: [
      'This free STHP test preparation PDF is a set of 50 original sample questions written by MCQsAI for students preparing for the Sukkur IBA Sindh Talent Hunt Program (STHP). The questions cover English, Mathematics and ICT, the three areas named in the published STHP syllabus, in the same 40/40/20 proportion our online STHP mock test uses.',
      'These STHP sample questions are for Sindh students who have passed or are finishing Intermediate and want printable, offline practice. Every question comes with an answer key and a one-line explanation, so you can see why an answer is right and fix weak topics quickly.',
      'Honest label: this is an MCQsAI practice set based on the published syllabus. It is unofficial, it is not a Sukkur IBA paper, and there is no guarantee that the real test will look the same.',
    ],
    sections: [
      { section: 'English', count: 20 },
      { section: 'Mathematics', count: 20 },
      { section: 'ICT', count: 10 },
    ],
    preview: [
      { q: 'Choose the word closest in meaning to "abundant":', options: ['scarce', 'plentiful', 'rare', 'costly'], answer: 'plentiful', why: 'Abundant means existing in large quantities.' },
      { q: 'Choose the word closest in meaning to "reluctant":', options: ['certain', 'careful', 'unwilling', 'eager'], answer: 'unwilling', why: 'Reluctant means not willing to do something.' },
      { q: 'Which of these numbers is irrational?', options: ['√7', '√16', '22/7', '0.25'], answer: '√7', why: '√16 = 4, and 22/7 and 0.25 are fractions, so only √7 is irrational.' },
      { q: 'Solve 5x − 3 = 2x + 9:', options: ['x = 3', 'x = 4', 'x = 6', 'x = 2'], answer: 'x = 4', why: '3x = 12, so x = 4.' },
      { q: 'One byte equals:', options: ['4 bits', '8 bits', '16 bits', '1024 bits'], answer: '8 bits', why: 'A byte is a group of 8 bits.' },
    ],
    faqs: [
      { question: 'Is this STHP test preparation PDF an official paper?', answer: 'No. It is an unofficial MCQsAI practice set based on the published STHP syllabus. It is not a Sukkur IBA paper. Official sample papers by Sukkur IBA are linked on this page.' },
      { question: 'How many STHP sample questions are in the PDF?', answer: 'The set has 50 questions: 20 English, 20 Mathematics and 10 ICT, with a suggested time of about 60 minutes.' },
      { question: 'Are answers and explanations included?', answer: 'Yes. Every question has an answer key and a short explanation.' },
      { question: 'Is the real STHP test pattern the same as this PDF?', answer: 'Not necessarily. The 40/40/20 split is the MCQsAI practice pattern. Check the official Sukkur IBA announcement for the real pattern, marks and rules.' },
      { question: 'Is the STHP test preparation PDF free?', answer: 'Yes. It is free to download and share, with no sign-up. The full online STHP practice test on MCQsAI is free too.' },
      { question: 'What is the difference between STHP and NTHP?', answer: 'STHP is the Sindh Talent Hunt Program run by Sukkur IBA University. NTHP is the National Talent Hunt Program run by IBA Karachi. They are separate programs with separate tests.' },
    ],
    official: [
      { label: 'Sukkur IBA — official sample papers page', url: 'https://iba-suk.edu.pk/admissions/sample-papers' },
      { label: 'Sukkur IBA — STHP sample paper (PDF)', url: 'https://iba-suk.edu.pk/Content/pdf/admissions/samples/Sample_Paper_STHP-2019-Nov-12-2018.pdf' },
      { label: 'Sukkur IBA — Foundation sample paper (PDF)', url: 'https://iba-suk.edu.pk/Content/pdf/admissions/samples/Sample_Paper_FND-2019-Dec-17-2019.pdf' },
    ],
    disclaimer: DISCLAIMER_FULL,
  },
];

export const STHP_OFFICIAL_SAMPLES = PRACTICE_PDFS[1].official;

export const getPracticePdf = (slug) => PRACTICE_PDFS.find((p) => p.slug === slug) || null;
export const getPracticePdfByExam = (exam) => PRACTICE_PDFS.find((p) => p.exam === exam) || null;
export const PRACTICE_PDF_PATHS = PRACTICE_PDFS.map((p) => `/pdf/${p.slug}`);

/** WhatsApp share of the landing page itself (never the PDF file). */
export function pdfShareUrl(pdf) {
  const url = `${SITE}/pdf/${pdf.slug}?utm_source=whatsapp&utm_medium=pdf_share`;
  return `https://wa.me/?text=${encodeURIComponent(`Free ${pdf.examLabel} practice PDF with answer key: ${url}`)}`;
}

export function bodyWordCount(pdf) {
  const text = [...pdf.intro, ...pdf.faqs.map((f) => `${f.question} ${f.answer}`)].join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}
