// Single source of the mock-test <title> suffix rule, used by the page
// (MockTestDetail) and the prerender script (scripts/inject-meta.mjs).
export const BRAND_SUFFIX = " | MCQsAI";
export const MAX_TITLE_WITH_BRAND = 65;

export function buildMockTestTitle(base) {
  const t = String(base || "").trim();
  if (!t) return "";
  if (/\|\s*MCQsAI\s*$/i.test(t)) return t;
  const withBrand = `${t}${BRAND_SUFFIX}`;
  return withBrand.length <= MAX_TITLE_WITH_BRAND ? withBrand : t;
}
