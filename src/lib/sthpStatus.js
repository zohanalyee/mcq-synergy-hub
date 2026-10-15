// Shared STHP date wording. Facts come from the exam_pages row (slug "sthp"),
// baked into src/data/examFactsSnapshot.json at build time — never hardcoded.
// Plain JS so the prerender scripts (node) and the app use identical text.
import snapshot from '../data/examFactsSnapshot.json';

/** @returns {{applyBy: string, testDate: string, testDateIso: string|null, applyUrl: string}} */
export function getSthpFacts() {
  const row = (snapshot || []).find((r) => r.slug === 'sthp');
  const f = (row && row.facts) || {};
  return {
    applyBy: f.applyBy || '',
    testDate: f.testDate || '',
    testDateIso: row?.test_date || null,
    applyUrl: f.applyUrl || 'https://applyadmission.iba-suk.edu.pk',
  };
}

/** True until the day after the official test date (Pakistan time). */
export function sthpIsUpcoming(now = Date.now()) {
  const { testDateIso } = getSthpFacts();
  if (!testDateIso) return false;
  return now < Date.parse(`${testDateIso}T00:00:00+05:00`) + 24 * 60 * 60 * 1000;
}

/** Sentence used on the mock-test page and in its meta description. */
export function sthpStatusSentence(now = Date.now()) {
  const { applyBy, testDate } = getSthpFacts();
  if (!testDate) return '';
  return sthpIsUpcoming(now)
    ? `STHP 2027: apply by ${applyBy}, test on ${testDate}.`
    : `STHP 2027 test was held on ${testDate}.`;
}

/** Short form for meta descriptions. */
export function sthpMetaSentence(now = Date.now()) {
  const { applyBy, testDate } = getSthpFacts();
  if (!testDate) return '';
  return sthpIsUpcoming(now)
    ? `Apply by ${applyBy.replace(/ber 2026$/, ' 2026')}; test on ${testDate}.`
    : `Test held on ${testDate}.`;
}
