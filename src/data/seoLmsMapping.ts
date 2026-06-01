/**
 * SEO landing page → existing LMS hierarchy mapping.
 *
 * REUSE-FIRST: every entry points an SEO landing page at an EXISTING
 * educational system + level already present in the LMS. We never create
 * new systems, levels, subjects, topics or MCQs — we only deep-link SEO
 * pages into content that already exists.
 *
 * Keyed by the page `returnPath` (the same value each SEO page already
 * passes to its Quick Test components). When a page is not listed here it
 * simply keeps its existing Quick Test behaviour with no deep links.
 *
 * `classNumber` is the value fed to the /boards/:boardSlug/:classNumber/...
 * route. BoardTopicPage fuzzy-resolves it via findMatchingLevel, so the
 * normalized class number ("9") or a level slug ("ecat") both work.
 *
 * To add a new SEO page: confirm the topic/subject already exists in the
 * LMS, then add a { systemName, levelName, classNumber } entry. Do NOT
 * invent new topics — reuse canonical topic names.
 */
export interface SeoLmsContext {
  /** Exact educational_systems.name (fuzzy-matched at runtime). */
  systemName: string;
  /** Exact levels.name within that system (used to scope the query). */
  levelName: string;
  /** Route segment for /boards/:boardSlug/:classNumber/... deep links. */
  classNumber: string;
}

export const SEO_LMS_MAP: Record<string, SeoLmsContext> = {
  // ---- Academic (rich existing MCQ coverage) ----
  "/9th-class-mcqs": {
    systemName: "Punjab Curriculum and Textbook Board",
    levelName: "Class 9",
    classNumber: "9",
  },
  "/board-mcqs": {
    systemName: "Federal Board of Intermediate and Secondary Education (FBISE)",
    levelName: "Board MCQs (All Classes)",
    classNumber: "board-mcqs-all-classes",
  },

  // ---- Competitive Exams (topics exist; MCQs being added) ----
  "/mdcat-past-papers": {
    systemName: "Competitive Exams",
    levelName: "MDCAT Past Papers",
    classNumber: "mdcat-past-papers",
  },
  "/ecat-preparation": {
    systemName: "Competitive Exams",
    levelName: "ECAT",
    classNumber: "ecat",
  },
  "/engineering-universities-entry-test": {
    systemName: "Competitive Exams",
    levelName: "Engineering Universities Entry Test",
    classNumber: "engineering-universities-entry-test",
  },
  "/punjab-university-entry-test": {
    systemName: "Competitive Exams",
    levelName: "Punjab University Entry Test",
    classNumber: "punjab-university-entry-test",
  },
  "/nust-entry-test": {
    systemName: "Competitive Exams",
    levelName: "NUST Entry Test (NET)",
    classNumber: "nust-entry-test-net",
  },
  "/comsats-entry-test": {
    systemName: "Competitive Exams",
    levelName: "COMSATS Entry Test",
    classNumber: "comsats-entry-test",
  },
  "/sindh-universities-entry-test": {
    systemName: "Competitive Exams",
    levelName: "Sindh Universities Entry Test",
    classNumber: "sindh-universities-entry-test",
  },
};

export const getSeoLmsContext = (returnPath?: string): SeoLmsContext | null =>
  (returnPath && SEO_LMS_MAP[returnPath]) || null;
