// Shared, build-time builders for static (non-JS-crawler-visible) board/topic
// content. Used by scripts/inject-meta.mjs to emit real MCQ + Quiz/FAQPage
// content into the raw HTML of every indexable topic page, so non-JS AI crawlers
// (ChatGPT / Claude / Perplexity) can read and cite it.
//
// These builders intentionally MIRROR the schema + sanitization produced by
// src/pages/BoardTopicPage.tsx so the static (raw) HTML and the JS-rendered DOM
// never drift — no cloaking, identical Quiz/FAQPage shape.

// Mirrors src/lib/questionUtils.ts cleanQuestionText.
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

// HTML-entity encode all DB-sourced text before it is written into static HTML.
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function optionsOf(m) {
  return Array.isArray(m.options) ? m.options : [];
}

// Quiz schema — identical shape to BoardTopicPage quizSchema.
export function buildQuizSchema({ seoTitle, topicName, classN, count }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: seoTitle,
    about: { '@type': 'Thing', name: topicName },
    educationalLevel: `Class ${classN}`,
    numberOfQuestions: count,
    provider: { '@type': 'Organization', name: 'MCQsAI', url: 'https://mcqsai.com' },
  };
}

// FAQPage schema — identical logic to BoardTopicPage: built only from approved
// MCQs with a title + correct_option, capped at 10, emitted only when >= 3.
export function buildFaqSchema(mcqs) {
  const faqEntities = (mcqs || [])
    .filter((m) => m.title && m.correct_option)
    .slice(0, 10)
    .map((m) => {
      const opts = optionsOf(m);
      const correct = opts.find((o) => (o.key || '') === m.correct_option);
      const answerText = [
        correct?.text ? `Correct answer: ${correct.text}.` : `Correct answer: ${m.correct_option}.`,
        m.explanation ? String(m.explanation).trim() : '',
      ].filter(Boolean).join(' ');
      return {
        '@type': 'Question',
        name: cleanQuestionText(m.title),
        acceptedAnswer: { '@type': 'Answer', text: answerText },
      };
    });
  if (faqEntities.length < 3) return null;
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqEntities };
}

// Semantic, crawlable content fragment written INTO #root of the topic page's
// static HTML. On hydration React (createRoot) re-renders and replaces it, so
// human visitors are unaffected; only non-JS crawlers read this block.
export function buildTopicContentHtml({ topicName, subjectName, classN, boardName, mcqs, links }) {
  const items = (mcqs || []).map((m, i) => {
    const opts = optionsOf(m);
    const correct = opts.find((o) => (o.key || '') === m.correct_option);
    const optionsHtml = opts
      .map((o) => `<li>${esc(o.key)}. ${esc(o.text)}</li>`)
      .join('');
    const answer = correct?.text
      ? `${esc(m.correct_option)}. ${esc(correct.text)}`
      : esc(m.correct_option);
    return (
      `<article>` +
      `<h3>Q${i + 1}. ${esc(cleanQuestionText(m.title))}</h3>` +
      (optionsHtml ? `<ol type="A">${optionsHtml}</ol>` : '') +
      `<p><strong>Correct answer:</strong> ${answer}</p>` +
      (m.explanation ? `<p><strong>Explanation:</strong> ${esc(m.explanation)}</p>` : '') +
      `</article>`
    );
  }).join('');

  const linksHtml = (links || [])
    .map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`)
    .join('');

  return (
    `<main>` +
    `<h1>${esc(topicName)} MCQs</h1>` +
    `<p>${esc(subjectName)} &middot; Class ${esc(classN)} &middot; ${esc(boardName)}</p>` +
    `<section>${items}</section>` +
    (linksHtml
      ? `<nav aria-label="Explore more"><h2>Explore more</h2><ul>${linksHtml}</ul></nav>`
      : '') +
    `</main>`
  );
}

// Build the topic <title> BASE (without the " | MCQsAI" suffix). Board name is
// intentionally excluded to keep the final title <= 60 chars (board stays in the
// description, H1 context, breadcrumb, and canonical). A truncation safeguard
// trims the topic portion for long topic/subject names. Keep this identical to
// src/lib/topicTitle.ts (buildTopicTitleBase) to avoid raw vs rendered cloaking.
export function buildTopicTitleBase(topic, subject, classN) {
  const MAX = 51; // 51 + " | MCQsAI" (9) = 60
  const tail = ` MCQs - Class ${classN} ${subject}`;
  let base = `${topic}${tail}`;
  if (base.length > MAX) {
    const available = MAX - tail.length;
    const t = available > 1 ? `${topic.slice(0, available - 1).trimEnd()}…` : '';
    base = `${t}${tail}`.slice(0, MAX);
  }
  return base;
}
