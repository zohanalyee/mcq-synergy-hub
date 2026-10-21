// Old or mistyped mock-test addresses that forward to the real page.
// A test (scripts/route-coverage.test.mjs) checks every target exists in the mock-test sitemap.
export const LEGACY_MOCK_TEST_REDIRECTS = {
  'junior-office-associate': 'junior-office-associate-bps-13',
};

export function legacyMockTarget(slug) {
  return Object.prototype.hasOwnProperty.call(LEGACY_MOCK_TEST_REDIRECTS, slug)
    ? LEGACY_MOCK_TEST_REDIRECTS[slug]
    : null;
}

// Popular tests shown on the not-found page (test checks they exist).
export const NOT_FOUND_POPULAR_TESTS = [
  ['sukkur-iba-sindh-talent-hunt-program-sthp-2027', 'STHP 2027 Mock Test'],
  ['iba-karachi-nthp-mock-test-2027-english-mathematics-practice', 'NTHP 2027 Mock Test'],
  ['junior-office-associate-bps-13', 'Junior Office Associate BPS-13'],
  ['assistant-accountant-bps-15', 'Assistant Accountant BPS-15'],
  ['sindh-teaching-license-exam-elementary-school-teacher-est', 'Sindh Teaching License (EST)'],
  ['admission-examination-officer', 'Admission & Examination Officer'],
];
