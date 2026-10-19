import test from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_PDFS, getPracticePdf, pdfShareUrl, bodyWordCount } from './practicePdfs.js';

test('titles <= 60 and descriptions <= 155 characters', () => {
  for (const p of PRACTICE_PDFS) {
    assert.ok(p.title.length <= 60, p.title);
    assert.ok(p.description.length <= 155, p.description);
  }
});
test('NTHP page data never mentions STS', () => {
  assert.doesNotMatch(JSON.stringify(getPracticePdf('nthp-practice-questions')), /\bSTS\b/);
});
test('set counts: NTHP 26+24, STHP 20+20+10', () => {
  assert.deepEqual(getPracticePdf('nthp-practice-questions').sections.map(s => s.count), [26, 24]);
  assert.deepEqual(getPracticePdf('sthp-practice-questions').sections.map(s => s.count), [20, 20, 10]);
});
test('quality gate: >=60 body words, >=3 FAQs, 5 previews', () => {
  for (const p of PRACTICE_PDFS) {
    assert.ok(bodyWordCount(p) >= 60);
    assert.ok(p.faqs.length >= 3);
    assert.equal(p.preview.length, 5);
    for (const q of p.preview) assert.ok(q.options.includes(q.answer), q.q);
  }
});
test('share links the apex landing page with pdf_share UTM, never the PDF', () => {
  const text = new URL(pdfShareUrl(PRACTICE_PDFS[0])).searchParams.get('text');
  assert.match(text, /https:\/\/mcqsai\.com\/pdf\/nthp-practice-questions\?utm_source=whatsapp&utm_medium=pdf_share/);
  assert.doesNotMatch(text, /\.pdf/);
});
