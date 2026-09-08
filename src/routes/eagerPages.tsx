// EAGER page registry — imported ONLY by src/prerender.tsx.
//
// Prerendering uses renderToString, which cannot await a lazy() import: a lazy
// route would emit its Suspense fallback and ship an empty #root to non-JS
// crawlers. So every prerendered route must be statically imported HERE.
//
// The browser never loads this module — src/App.tsx imports
// src/routes/lazyPages.ts instead, keeping these pages out of the entry chunk.
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import DeleteAccount from "@/pages/DeleteAccount";
import AICoachLanding from "@/pages/AICoachLanding";
import Subjects from "@/pages/Subjects";
import MockTests from "@/pages/MockTests";
import Leaderboard from "@/pages/Leaderboard";
import PastPapers from "@/pages/PastPapers";
import Jobs from "@/pages/Jobs";
import Scholarships from "@/pages/Scholarships";
import CustomSyllabus from "@/pages/CustomSyllabus";
import Reviews from "@/pages/Reviews";
import Quizzes from "@/pages/Quizzes";
import QuestionBank from "@/pages/QuestionBank";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import StudyGuides from "@/pages/StudyGuides";
import Blog from "@/pages/Blog";
import Announcements from "@/pages/Announcements";
import Boards from "@/pages/Boards";
import Tools from "@/pages/Tools";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";
import EditorialPolicy from "@/pages/legal/EditorialPolicy";
import ExamsHub from "@/pages/exams/ExamsHub";
import ExamLandingPage from "@/pages/exams/ExamLandingPage";
import NumsEntryTest from "@/pages/exams/NumsEntryTest";
import IbaSukkurEntryTest from "@/pages/exams/IbaSukkurEntryTest";
import LatLawAdmissionTest from "@/pages/exams/LatLawAdmissionTest";
import ProgrammaticIndex from "@/pages/programmatic/ProgrammaticIndex";
import ProgrammaticLandingPage from "@/pages/programmatic/ProgrammaticLandingPage";
import MDCATSyllabus from "@/pages/MDCATSyllabus";
import MDCATPastPapers from "@/pages/seo/MDCATPastPapers";
import PPSCPastPapers from "@/pages/seo/PPSCPastPapers";
import FPSCPastPapers from "@/pages/seo/FPSCPastPapers";
import CSSMCQs from "@/pages/seo/CSSMCQs";
import ECATPreparation from "@/pages/seo/ECATPreparation";
import NUSTEntryTest from "@/pages/seo/NUSTEntryTest";
import PunjabUniversityEntryTest from "@/pages/seo/PunjabUniversityEntryTest";
import COMSATSEntryTest from "@/pages/seo/COMSATSEntryTest";
import SindhUniversitiesEntryTest from "@/pages/seo/SindhUniversitiesEntryTest";
import EngineeringUniversitiesEntryTest from "@/pages/seo/EngineeringUniversitiesEntryTest";
import PSTSSTTestPreparation from "@/pages/seo/PSTSSTTestPreparation";
import NinthClassMCQs from "@/pages/seo/NinthClassMCQs";
import BoardMCQs from "@/pages/seo/BoardMCQs";
import PakArmyTest from "@/pages/seo/PakArmyTest";
import PAFTest from "@/pages/seo/PAFTest";
import ASFTest from "@/pages/seo/ASFTest";
import ForcesJobsTests from "@/pages/seo/ForcesJobsTests";
import AggregateCalculator from "@/pages/tools/AggregateCalculator";
import MeritCalculator from "@/pages/tools/MeritCalculator";
import GPACalculator from "@/pages/tools/GPACalculator";
import CGPACalculator from "@/pages/tools/CGPACalculator";
import GPAToPercentage from "@/pages/tools/GPAToPercentage";
import PercentageToGPA from "@/pages/tools/PercentageToGPA";
import MarksCalculator from "@/pages/tools/MarksCalculator";
import ResultCalculator from "@/pages/tools/ResultCalculator";
import AttendanceCalculator from "@/pages/tools/AttendanceCalculator";
import PercentageCalculator from "@/pages/tools/PercentageCalculator";
import PeriodicTable from "@/pages/tools/PeriodicTable";
import PakistanTaxCalculator from "@/pages/tools/PakistanTaxCalculator";
import ZakatCalculator from "@/pages/tools/ZakatCalculator";
import AttendanceDashboard from "@/pages/tools/AttendanceDashboard";
import type { PageMap } from "./pageMap";

export const pages: PageMap = {
  Index, NotFound, DeleteAccount, AICoachLanding, Subjects, MockTests, Leaderboard,
  PastPapers, Jobs, Scholarships, CustomSyllabus, Reviews, Quizzes, QuestionBank,
  About, Contact, FAQ, StudyGuides, Blog, Announcements, Boards, Tools,
  PrivacyPolicy, TermsOfService, EditorialPolicy, ExamsHub, ExamLandingPage,
  NumsEntryTest, IbaSukkurEntryTest, LatLawAdmissionTest, ProgrammaticIndex,
  ProgrammaticLandingPage, MDCATSyllabus, MDCATPastPapers, PPSCPastPapers,
  FPSCPastPapers, CSSMCQs, ECATPreparation, NUSTEntryTest,
  PunjabUniversityEntryTest, COMSATSEntryTest, SindhUniversitiesEntryTest,
  EngineeringUniversitiesEntryTest, PSTSSTTestPreparation, NinthClassMCQs,
  BoardMCQs, PakArmyTest, PAFTest, ASFTest, ForcesJobsTests, AggregateCalculator,
  MeritCalculator, GPACalculator, CGPACalculator, GPAToPercentage,
  PercentageToGPA, MarksCalculator, ResultCalculator, AttendanceCalculator,
  PercentageCalculator, PeriodicTable, PakistanTaxCalculator, ZakatCalculator,
  AttendanceDashboard,
};

export default pages;
