// Shared STHP date wording. Facts come from the exam_pages row (slug "sthp"),
// baked into (and passed in from) src/data/examFactsSnapshot.json at build time — never hardcoded.
// Plain JS so the prerender scripts (node) and the app use identical text.

/** @returns {{applyBy: string, testDate: string, testDateIso: string|null, applyUrl: string}} */
export function getSthpFacts(snapshot) {
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
export function sthpIsUpcoming(snapshot, now = Date.now()) {
  const { testDateIso } = getSthpFacts(snapshot);
  if (!testDateIso) return false;
  return now < Date.parse(`${testDateIso}T00:00:00+05:00`) + 24 * 60 * 60 * 1000;
}

/** Sentence used on the mock-test page and in its meta description. */
export function sthpStatusSentence(snapshot, now = Date.now()) {
  const { applyBy, testDate } = getSthpFacts(snapshot);
  if (!testDate) return '';
  return sthpIsUpcoming(snapshot, now)
    ? `STHP 2027: apply by ${applyBy}, test on ${testDate}.`
    : `STHP 2027 test was held on ${testDate}.`;
}

const short = (d) => d.replace(/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/g, '$1');

/** Short form for meta descriptions (e.g. "Apply by 29 Oct; test on 8 Nov 2026."). */
export function sthpMetaSentence(snapshot, now = Date.now()) {
  const { applyBy, testDate } = getSthpFacts(snapshot);
  if (!testDate) return '';
  return sthpIsUpcoming(snapshot, now)
    ? `Apply by ${short(applyBy).replace(/ \d{4}$/, '')}; test on ${short(testDate)}.`
    : `Test held on ${short(testDate)}.`;
}
