/**
 * I-5 tools triage — indexable tool allow-list.
 *
 * We ship 60+ utility tools, but most are generic (BMI, tip, QR, color picker)
 * with no topical relevance to exam prep and no genuine search demand for us.
 * Indexing them dilutes site quality (thin/duplicate utility pages) and hurts
 * both SEO and AdSense review.
 *
 * Only the tools below are indexable + sitemap-eligible. Each one is
 * Pakistan-education relevant AND has real on-page depth (seoDescription,
 * howToUse steps, and >= 2 FAQs) in src/data/toolsData.ts.
 *
 * Every other /tools/* page still works and is still linked from /tools —
 * it is just noindex,follow and excluded from tools.xml.
 *
 * MUST stay in sync with INDEXABLE_TOOL_PATHS in scripts/generate-sitemaps.mjs.
 */
export const INDEXABLE_TOOL_PATHS: readonly string[] = [
  '/tools/school-attendance-system',
  '/tools/aggregate-calculator',
  '/tools/merit-calculator',
  '/tools/gpa-calculator',
  '/tools/cgpa-calculator',
  '/tools/gpa-to-percentage',
  '/tools/percentage-to-gpa',
  '/tools/marks-calculator',
  '/tools/result-calculator',
  '/tools/attendance-calculator',
  '/tools/percentage-calculator',
  '/tools/age-calculator',
  '/tools/periodic-table',
  '/tools/pakistan-tax-calculator',
  '/tools/zakat-calculator',
];

export function isToolIndexable(href?: string): boolean {
  return !!href && INDEXABLE_TOOL_PATHS.includes(href);
}
