// Shared, build-time route lists for static prerendering + post-build meta injection.
// These are SYNCHRONOUS-render pages (no async DB dependency) whose SEOHead/Helmet
// tags resolve correctly during renderToString — so they can be prerendered directly.
//
// DB-driven detail pages (mock-tests, jobs/scholarships, blog, board topics) cannot
// be prerendered reliably (renderToString can't await the queries), so they are
// handled by scripts/inject-meta.mjs instead.

// ---- Tools ----------------------------------------------------------------
// Full tool URL list (mirrors TOOL_PATHS in generate-sitemaps.mjs).
export const ALL_TOOL_PATHS = [
  "/tools/school-attendance-system", "/tools/math", "/tools/age-calculator", "/tools/timer",
  "/tools/gpa-calculator", "/tools/units", "/tools/notes", "/tools/calendar",
  "/tools/islamic-calendar", "/tools/international-calendar", "/tools/bmi-calculator",
  "/tools/percentage-calculator", "/tools/salary-calculator", "/tools/emi-calculator",
  "/tools/tip-calculator", "/tools/loan-calculator", "/tools/discount-calculator",
  "/tools/bmr-calculator", "/tools/duration-calculator", "/tools/ratio-calculator",
  "/tools/speed-calculator", "/tools/area-calculator", "/tools/fraction-calculator",
  "/tools/date-calculator", "/tools/fuel-calculator", "/tools/cgpa-calculator",
  "/tools/gpa-to-percentage", "/tools/percentage-to-gpa", "/tools/grade-calculator",
  "/tools/marks-calculator", "/tools/attendance-calculator", "/tools/result-calculator",
  "/tools/formula-sheet", "/tools/periodic-table", "/tools/multiplication-table",
  "/tools/currency-converter", "/tools/temperature-converter", "/tools/roman-converter",
  "/tools/binary-converter", "/tools/case-converter", "/tools/image-resizer",
  "/tools/image-compressor", "/tools/image-converter", "/tools/pdf-compressor",
  "/tools/pdf-merger", "/tools/pdf-to-text", "/tools/pdf-splitter", "/tools/stopwatch",
  "/tools/world-clock", "/tools/word-counter", "/tools/character-counter", "/tools/qr-generator",
  "/tools/qr-scanner", "/tools/password-generator", "/tools/name-generator", "/tools/color-picker",
  "/tools/random-number", "/tools/equation-solver", "/tools/aggregate-calculator",
  "/tools/merit-calculator", "/tools/pakistan-tax-calculator", "/tools/zakat-calculator",
];

// These tool pages DO NOT render <SEOHead> (they don't use ToolWrapper), so
// prerendering them would emit the homepage's default head. They are given
// correct, unique head tags by inject-meta.mjs instead.
export const TOOLS_WITHOUT_SEOHEAD = [
  { path: "/tools/age-calculator", title: "Age Calculator", description: "Calculate your exact age in years, months, and days from your date of birth. Free online age calculator with precise results — MCQsAI." },
  { path: "/tools/timer", title: "Study Timer", description: "Free Pomodoro study timer with customizable intervals. Boost focus and productivity with timed study sessions and breaks — MCQsAI." },
  { path: "/tools/units", title: "Unit Converter", description: "Free online unit converter. Convert between length, weight, volume, temperature, and more units instantly — MCQsAI." },
  { path: "/tools/notes", title: "Quick Notes", description: "Free online notepad for quick notes. Write, save, and organize your study notes directly in the browser with no sign-up required — MCQsAI." },
  { path: "/tools/image-compressor", title: "Image Compressor", description: "Free online image compressor. Reduce image file size by up to 80% while maintaining quality. No server upload — works in your browser — MCQsAI." },
  { path: "/tools/image-converter", title: "Image Converter", description: "Free online image format converter. Convert between JPG, PNG, and WebP formats instantly in your browser — MCQsAI." },
  { path: "/tools/pdf-compressor", title: "PDF Compressor", description: "Free online PDF compressor. Reduce PDF file size by up to 80% while maintaining document quality. Works entirely in your browser — MCQsAI." },
  { path: "/tools/pdf-merger", title: "PDF Merger", description: "Free online PDF merger. Combine multiple PDF files into a single document. Drag and drop to reorder pages — MCQsAI." },
];

const TOOLS_WITHOUT_SEOHEAD_SET = new Set(TOOLS_WITHOUT_SEOHEAD.map((t) => t.path));

// Tools we CAN prerender (they render <SEOHead> via ToolWrapper).
export const TOOL_PRERENDER_PATHS = ALL_TOOL_PATHS.filter((p) => !TOOLS_WITHOUT_SEOHEAD_SET.has(p));

// ---- Programmatic SEO /p/:slug --------------------------------------------
// Mirrors indexableProgSeoSlugs() in src/data/programmaticSeo.ts.
export const PROG_SEO_SLUGS = [
  "mdcat-karachi", "mdcat-sindh", "mdcat-islamabad",
  "nts-karachi", "nts-lahore", "nts-islamabad",
  "css-islamabad", "css-karachi",
  "fpsc-islamabad", "fpsc-karachi",
  "ppsc-lahore", "ppsc-punjab",
  "ecat-punjab", "ecat-lahore",
  "mdcat-lahore", "mdcat-punjab",
  "biology-mcqs-class-12", "biology-mcqs-class-11",
  "chemistry-mcqs-class-12", "physics-mcqs-class-12",
];

// ---- Subject content static subjects --------------------------------------
// Static (non-DB) subject titles from src/data/subjects/*. Slugified to the
// /subject-content/:id URL form used by SubjectCard / UnifiedSubjectCard.
const STATIC_SUBJECT_TITLES = [
  "Accounting", "Agriculture", "Auditing", "Biochemistry", "Biology",
  "Chemical Engineering", "Chemistry", "Civil Engineering", "Computer Science",
  "Dental Materials", "Economics", "Electrical Engineering", "English",
  "English Literature", "Finance", "Forestry", "General Anatomy",
  "Human Resource Management", "International Relations", "Judiciary and Law",
  "Marketing", "Mathematics", "Mechanical Engineering", "Microbiology",
  "Oral Anatomy", "Oral Histology", "Oral Pathology and Medicine", "Pathology",
  "Pharmacology", "Physical Education", "Physics", "Physiology",
  "Political Science", "Psychology", "Sociology", "Software Engineering", "Statistics",
];

export const SUBJECT_CONTENT_PATHS = STATIC_SUBJECT_TITLES.map(
  (t) => `/subject-content/${t.toLowerCase().replace(/\s+/g, "-")}`,
);

// Path + display name for static subjects, used by inject-meta.mjs to guarantee
// a correct <head> even if a lazy-chunk Suspense miss during prerender produced
// an empty <title> for the first render of the SubjectContent chunk.
export const SUBJECT_CONTENT_META = STATIC_SUBJECT_TITLES.map((t) => ({
  path: `/subject-content/${t.toLowerCase().replace(/\s+/g, "-")}`,
  title: t,
}));

// ---- Combined extra prerender routes --------------------------------------
export const EXTRA_PRERENDER_ROUTES = [
  ...TOOL_PRERENDER_PATHS,
  ...PROG_SEO_SLUGS.map((s) => `/p/${s}`),
  ...SUBJECT_CONTENT_PATHS,
];
