import type { ComponentType } from "react";

/**
 * Route page registry.
 *
 * Two implementations exist:
 *  - `src/routes/eagerPages.tsx` — static imports, loaded ONLY by
 *    `src/prerender.tsx` so renderToString can render every prerendered route
 *    synchronously (a lazy() route would emit an empty Suspense shell).
 *  - `src/routes/lazyPages.ts` — lazy() imports, used by the browser `App.tsx`
 *    so these pages stay out of the entry chunk.
 *
 * Keys must stay identical between the two modules.
 */
export type PageKey =
  | "Index"
  | "NotFound"
  | "DeleteAccount"
  | "AICoachLanding"
  | "Subjects"
  | "MockTests"
  | "Leaderboard"
  | "PastPapers"
  | "Jobs"
  | "Scholarships"
  | "CustomSyllabus"
  | "Reviews"
  | "Quizzes"
  | "QuestionBank"
  | "About"
  | "Contact"
  | "FAQ"
  | "StudyGuides"
  | "Blog"
  | "Announcements"
  | "Boards"
  | "Tools"
  | "PrivacyPolicy"
  | "TermsOfService"
  | "EditorialPolicy"
  | "ExamsHub"
  | "ExamLandingPage"
  | "NumsEntryTest"
  | "IbaSukkurEntryTest"
  | "LatLawAdmissionTest"
  | "ProgrammaticIndex"
  | "ProgrammaticLandingPage"
  | "MDCATSyllabus"
  | "MDCATPastPapers"
  | "PPSCPastPapers"
  | "FPSCPastPapers"
  | "CSSMCQs"
  | "ECATPreparation"
  | "NUSTEntryTest"
  | "PunjabUniversityEntryTest"
  | "COMSATSEntryTest"
  | "SindhUniversitiesEntryTest"
  | "EngineeringUniversitiesEntryTest"
  | "PSTSSTTestPreparation"
  | "NinthClassMCQs"
  | "BoardMCQs"
  | "PakArmyTest"
  | "PAFTest"
  | "ASFTest"
  | "ForcesJobsTests"
  | "AggregateCalculator"
  | "MeritCalculator"
  | "GPACalculator"
  | "CGPACalculator"
  | "GPAToPercentage"
  | "PercentageToGPA"
  | "MarksCalculator"
  | "ResultCalculator"
  | "AttendanceCalculator"
  | "PercentageCalculator"
  | "PeriodicTable"
  | "PakistanTaxCalculator"
  | "ZakatCalculator"
  | "AttendanceDashboard";

export type PageMap = Record<PageKey, ComponentType<any>>;
