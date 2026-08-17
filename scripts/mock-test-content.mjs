// Build-time builders for STATIC (non-JS-crawler-visible) mock-test detail
// content.
//
// WHY: /mock-tests/<slug> pages are client-rendered. scripts/inject-meta.mjs
// only corrects their <head>; the <body> ships the homepage shell, so a raw
// (non-JS) crawler fetch — Googlebot's first pass, and every AI answer engine —
// sees a headline with no content behind it.
//
// This module mirrors what src/pages/MockTestDetail.tsx renders (intro, test
// pattern, official syllabus + weightage, past-paper pattern, question preview
// WITHOUT answers, sibling links, FAQ) so raw HTML and the hydrated DOM never
// drift. Answers/explanations are deliberately omitted here because the live
// page keeps them Premium-locked — the static copy must not reveal more than
// the rendered page does.
//
// Scope guard: inject-meta.mjs applies this to an explicit slug allow-list only.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function cleanQuestionText(text) {
  if (!text) return '';
  return String(text)
    .replace(/^POTENTIAL DUPLICATE:\s*/i, '')
    .replace(/^DUPLICATE:\s*/i, '')
    .replace(/^\[DUPLICATE\]\s*/i, '')
    .replace(/^\[AI\]\s*/i, '')
    .replace(/^AI GENERATED:\s*/i, '')
    .trim();
}

function optionEntries(options) {
  if (Array.isArray(options)) {
    return options.map((o, i) => {
      if (o && typeof o === 'object') return [o.key || String.fromCharCode(65 + i), o.text ?? ''];
      return [String.fromCharCode(65 + i), o];
    });
  }
  if (options && typeof options === 'object') return Object.entries(options);
  return [];
}

/** Keep this list identical to the FAQ block in src/pages/MockTestDetail.tsx. */
export function buildMockTestFaqs({ title, organization, subjects, duration, questions }) {
  return [
    {
      question: `What subjects are included in the ${title} test?`,
      answer: `The official syllabus for the ${title} test by ${organization} covers: ${subjects.join(', ')}.`,
    },
    {
      question: `How long is the ${title} mock test?`,
      answer: `This mock test is set to ${duration} minutes with ${questions} multiple-choice questions, matching the official pattern.`,
    },
    {
      question: `Is the ${title} mock test free?`,
      answer: `Yes. You can practice the ${title} mock test for free on MCQsAI. Questions are generated in simple Pakistani exam English from the official syllabus.`,
    },
    {
      question: `Can I customise the syllabus for the ${title} test?`,
      answer: `Yes. You can adjust subject weightage or disable subjects. Sign in to save your custom syllabus; otherwise the official syllabus is used.`,
    },
  ];
}

/**
 * Past-paper pattern rows. Derived ONLY from the stored official syllabus —
 * no test dates, cut-offs or "official PDF" claims are ever generated here.
 * Mirrors the same section in src/pages/MockTestDetail.tsx.
 */
export function buildPastPaperRows({ syllabus, questions }) {
  const total = syllabus.reduce((s, i) => s + (i.percentage || 0), 0) || 100;
  return syllabus.map((item) => ({
    subject: item.topic,
    percentage: item.percentage || 0,
    approxQuestions: Math.round(((item.percentage || 0) / total) * questions),
  }));
}

export function buildMockTestContentHtml({
  title,
  organization,
  duration,
  questions,
  syllabus,
  previewQuestions,
  links,
  path,
}) {
  const subjects = syllabus.map((s) => s.topic);
  const rows = buildPastPaperRows({ syllabus, questions });

  const syllabusRows = rows
    .map(
      (r) =>
        `<tr><td>${esc(r.subject)}</td><td>${esc(r.percentage)}%</td><td>${esc(r.approxQuestions)}</td></tr>`,
    )
    .join('');

  const previewHtml = (previewQuestions || [])
    .map((q, i) => {
      const opts = optionEntries(q.options)
        .map(([k, v]) => `<li>${esc(k)}. ${esc(v)}</li>`)
        .join('');
      return (
        `<article>` +
        `<h3>Q${i + 1}. ${esc(cleanQuestionText(q.question))}</h3>` +
        (opts ? `<ol type="A">${opts}</ol>` : '') +
        (q.subject ? `<p>Subject: ${esc(q.subject)}</p>` : '') +
        `</article>`
      );
    })
    .join('');

  const faqHtml = buildMockTestFaqs({ title, organization, subjects, duration, questions })
    .map((f) => `<article><h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p></article>`)
    .join('');

  const linksHtml = (links || [])
    .map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`)
    .join('');

  return (
    `<main>` +
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/mock-tests">Mock Tests</a> / <span>${esc(title)}</span></nav>` +
    `<h1>${esc(title)} Mock Test</h1>` +
    `<p>${esc(organization)}</p>` +
    `<p>Practice for the ${esc(title)} mock test based on the exam conducted by ${esc(organization)}. ` +
    `This free mock test follows the official syllabus and prepares you with realistic, exam-style ` +
    `multiple-choice questions written in simple Pakistani exam English. Use it to build speed, check ` +
    `your weak areas, and improve your score before the real test.</p>` +

    `<section><h2>Test Pattern</h2><ul>` +
    `<li>Duration: ${esc(duration)} minutes</li>` +
    `<li>Questions: ${esc(questions)}</li>` +
    `<li>Subjects: ${esc(syllabus.length)}</li>` +
    `</ul></section>` +

    `<section><h2>Official Syllabus &amp; Weightage</h2>` +
    `<p>The ${esc(title)} test by ${esc(organization)} covers ${esc(subjects.join(', '))}.</p>` +
    `<table><thead><tr><th>Subject</th><th>Weightage</th><th>Approx. Questions</th></tr></thead>` +
    `<tbody>${syllabusRows}</tbody></table></section>` +

    `<section><h2>${esc(title)} Past Papers Pattern</h2>` +
    `<p>Past papers of the ${esc(title)} test follow the official syllabus above. ` +
    `The practice questions on this page are built subject-by-subject on that same pattern, ` +
    `so the balance of English, computer, mathematics, general knowledge and reasoning items ` +
    `matches what candidates report seeing in previous papers.</p><ul>` +
    rows
      .map(
        (r) =>
          `<li>${esc(r.subject)} — about ${esc(r.approxQuestions)} of ${esc(questions)} questions (${esc(r.percentage)}%)</li>`,
      )
      .join('') +
    `</ul></section>` +

    (previewHtml
      ? `<section><h2>Questions Preview</h2>` +
        `<p>Real, exam-style multiple-choice questions already prepared for this mock test. ` +
        `Correct answers and detailed explanations are unlocked inside the test.</p>` +
        previewHtml +
        `<p><a href="${esc(path)}">Start the ${esc(title)} mock test</a></p></section>`
      : '') +

    (linksHtml ? `<nav aria-label="People also prepare for"><h2>People Also Prepare For</h2><ul>${linksHtml}</ul></nav>` : '') +

    `<section><h2>Frequently Asked Questions</h2>${faqHtml}</section>` +
    `</main>`
  );
}
