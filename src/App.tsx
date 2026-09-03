import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// SSR-safe Router: during prerender (Node, no window) the prerender entry
// already provides a <StaticRouter>, so we render a passthrough fragment to
// avoid BrowserRouter touching `document`/`window.history` at render time.
const Router = ({ children }: { children: React.ReactNode }) =>
  (typeof window === 'undefined' || (globalThis as any).__PRERENDER__)
    ? <>{children}</>
    : <BrowserRouter>{children}</BrowserRouter>;
import { useState, lazy, Suspense, useEffect, type ComponentType } from "react";
import { prefetchTopRoutes } from "./lib/prefetchRoutes";

import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import GuestResultCarryForward from "./components/GuestResultCarryForward";
import CookieConsent from "./components/CookieConsent";

import StructuredData from "./components/StructuredData";
import GA4PageTracker from "./components/GA4PageTracker";
import CampaignTracker from "./components/CampaignTracker";
import EmailPrefSync from "./components/EmailPrefSync";
import Unsubscribe from "./pages/Unsubscribe";
// Public data-deletion page (Meta Facebook Login requirement) — eager so it
// prerenders with real body content for crawlers and Meta's reviewers.
import DeleteAccount from "./pages/DeleteAccount";

import TopProgressBar from "./components/TopProgressBar";
import ToolRouteSEO from "./components/seo/ToolRouteSEO";
import GlobalCanonical from "./components/seo/GlobalCanonical";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LearningProvider } from "./contexts/LearningContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { FloatingToolsProvider } from "./contexts/FloatingToolsContext";
import { AppearanceProvider } from "./contexts/AppearanceContext";
import { DeviceCapabilityProvider } from "./contexts/DeviceCapabilityContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import PageLoader from "./components/PageLoader";
import AIWelcome from "./components/AIWelcome";
import LibraryWelcome from "./components/LibraryWelcome";
import NavigationLoader from "./components/NavigationLoader";
import FloatingToolsRenderer from "./components/tools/FloatingToolsRenderer";
import InstantAuthGuard from "./components/auth/InstantAuthGuard";
import GlobalCreditExhaustedListener from "./components/credits/GlobalCreditExhaustedListener";
import ProfileCompletionGuard from "./components/ProfileCompletionGuard";
// Eager (above-the-fold / auth landing) — must load fast
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Auth from "./pages/Auth";
import GetStarted from "./pages/GetStarted";
import AICoachLanding from "./pages/AICoachLanding";
import NotFound from "./pages/NotFound";

// Retry a lazy import once, then force a single full reload on stale-chunk errors
function lazyWithReload<T extends { default: ComponentType<any> }>(
  factory: () => Promise<T>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const key = "chunk-reloaded";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return await new Promise<T>(() => {});
      }
      throw err;
    }
  });
}

// Lazy: large feature pages (code-split for mobile performance)
import Subjects from "./pages/Subjects"; // eager: prerendered SEO hub
import MockTests from "./pages/MockTests"; // eager: prerendered SEO hub
const MockTestDetail = lazyWithReload(() => import("./pages/MockTestDetail"));
const Analytics = lazyWithReload(() => import("./pages/Analytics"));
import Leaderboard from "./pages/Leaderboard"; // eager: prerendered SEO hub
import PastPapers from "./pages/PastPapers";
import Jobs from "./pages/Jobs";
import Scholarships from "./pages/Scholarships";
import CustomSyllabus from "./pages/CustomSyllabus"; // eager: prerendered SEO hub
const SubjectContent = lazyWithReload(() => import("./pages/SubjectContent"));
const CustomQuizzes = lazyWithReload(() => import("./pages/CustomQuizzes"));
const AdminPanel = lazyWithReload(() => import("./pages/AdminPanel"));
const ExternalCuration = lazyWithReload(() => import("./pages/admin/ExternalCuration"));
const ReviewsManagement = lazyWithReload(() => import("./pages/admin/ReviewsManagement"));


import MobileBottomNav from "@/components/MobileBottomNav";

const Profile = lazy(() => import("./pages/Profile"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Achievements = lazy(() => import("./pages/Achievements"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
import Reviews from "./pages/Reviews";
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmailSent = lazy(() => import("./pages/VerifyEmailSent"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));

import Quizzes from "./pages/Quizzes";
const QuizPlayer = lazy(() => import("./pages/QuizPlayer"));
const SubmitContent = lazy(() => import("./pages/SubmitContent"));

// Eager: SEO/public prerender whitelisted routes (need real HTML in #root)
import About from "./pages/About";
import MDCATSyllabus from "./pages/MDCATSyllabus";
// Indexable tools (src/config/toolsSeo.ts INDEXABLE_TOOL_PATHS) must be EAGER:
// a lazy() route renders only the Suspense fallback during prerender, so the
// static HTML ships an empty #root and non-JS crawlers see no body content.
import AggregateCalculator from "./pages/tools/AggregateCalculator";
import MeritCalculator from "./pages/tools/MeritCalculator";
import GPACalculator from "./pages/tools/GPACalculator";
import CGPACalculator from "./pages/tools/CGPACalculator";
import GPAToPercentage from "./pages/tools/GPAToPercentage";
import PercentageToGPA from "./pages/tools/PercentageToGPA";
import MarksCalculator from "./pages/tools/MarksCalculator";
import ResultCalculator from "./pages/tools/ResultCalculator";
import AttendanceCalculator from "./pages/tools/AttendanceCalculator";
import PercentageCalculator from "./pages/tools/PercentageCalculator";
import AgeCalculator from "./pages/tools/AgeCalculator";
import PeriodicTable from "./pages/tools/PeriodicTable";
import PakistanTaxCalculator from "./pages/tools/PakistanTaxCalculator";
import ZakatCalculator from "./pages/tools/ZakatCalculator";
import AttendanceDashboard from "./pages/tools/AttendanceDashboard";
import MDCATPastPapers from "./pages/seo/MDCATPastPapers";
import PPSCPastPapers from "./pages/seo/PPSCPastPapers";
import FPSCPastPapers from "./pages/seo/FPSCPastPapers";
import CSSMCQs from "./pages/seo/CSSMCQs";
import ECATPreparation from "./pages/seo/ECATPreparation";
import NUSTEntryTest from "./pages/seo/NUSTEntryTest";
import PunjabUniversityEntryTest from "./pages/seo/PunjabUniversityEntryTest";
import COMSATSEntryTest from "./pages/seo/COMSATSEntryTest";
import SindhUniversitiesEntryTest from "./pages/seo/SindhUniversitiesEntryTest";
import EngineeringUniversitiesEntryTest from "./pages/seo/EngineeringUniversitiesEntryTest";
import PSTSSTTestPreparation from "./pages/seo/PSTSSTTestPreparation";
import NinthClassMCQs from "./pages/seo/NinthClassMCQs";
import BoardMCQs from "./pages/seo/BoardMCQs";
import PakArmyTest from "./pages/seo/PakArmyTest";
import PAFTest from "./pages/seo/PAFTest";
import ASFTest from "./pages/seo/ASFTest";
import ForcesJobsTests from "./pages/seo/ForcesJobsTests";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy"; // eager: prerendered SEO page
import TermsOfService from "./pages/legal/TermsOfService"; // eager: prerendered SEO page
import EditorialPolicy from "./pages/legal/EditorialPolicy";
import QuestionBank from "./pages/QuestionBank"; // eager: prerendered SEO hub
// Ask-Document is temporarily disabled — the route renders a Coming Soon page.
const AskDocument = lazy(() => import("./pages/AskDocumentComingSoon"));
const TestSession = lazy(() => import("./pages/TestSession"));
const Notifications = lazy(() => import("./pages/Notifications"));

// Tool Pages — all lazy (rarely on initial load)
const CalendarTool = lazy(() => import("./pages/tools/CalendarTool"));
const IslamicCalendar = lazy(() => import("./pages/tools/IslamicCalendar"));
const InternationalCalendar = lazy(() => import("./pages/tools/InternationalCalendar"));
const MathTool = lazy(() => import("./pages/tools/MathTool"));
const TimerTool = lazy(() => import("./pages/tools/TimerTool"));
const UnitConverter = lazy(() => import("./pages/tools/UnitConverter"));
const NotesTool = lazy(() => import("./pages/tools/NotesTool"));

// Tools listing page — eager for SSR prerender
import Tools from "./pages/Tools";

// Lazy-loaded new tool pages
const BMICalculator = lazy(() => import("./pages/tools/BMICalculator"));
const SalaryCalculator = lazy(() => import("./pages/tools/SalaryCalculator"));
const EMICalculator = lazy(() => import("./pages/tools/EMICalculator"));
const TipCalculator = lazy(() => import("./pages/tools/TipCalculator"));
const LoanCalculator = lazy(() => import("./pages/tools/LoanCalculator"));
const DiscountCalculator = lazy(() => import("./pages/tools/DiscountCalculator"));
const BMRCalculator = lazy(() => import("./pages/tools/BMRCalculator"));
const DurationCalculator = lazy(() => import("./pages/tools/DurationCalculator"));
const RatioCalculator = lazy(() => import("./pages/tools/RatioCalculator"));
const SpeedCalculator = lazy(() => import("./pages/tools/SpeedCalculator"));
const AreaCalculator = lazy(() => import("./pages/tools/AreaCalculator"));
const FractionCalculator = lazy(() => import("./pages/tools/FractionCalculator"));
const DateCalculator = lazy(() => import("./pages/tools/DateCalculator"));
const FuelCalculator = lazy(() => import("./pages/tools/FuelCalculator"));
const GradeCalculator = lazy(() => import("./pages/tools/GradeCalculator"));
const FormulaSheet = lazy(() => import("./pages/tools/FormulaSheet"));
const MultiplicationTable = lazy(() => import("./pages/tools/MultiplicationTable"));
const CurrencyConverter = lazy(() => import("./pages/tools/CurrencyConverter"));
const TemperatureConverter = lazy(() => import("./pages/tools/TemperatureConverter"));
const RomanConverter = lazy(() => import("./pages/tools/RomanConverter"));
const BinaryConverter = lazy(() => import("./pages/tools/BinaryConverter"));
const CaseConverter = lazy(() => import("./pages/tools/CaseConverter"));
const ImageResizer = lazy(() => import("./pages/tools/ImageResizer"));
const ImageCompressor = lazy(() => import("./pages/tools/ImageCompressor"));
const PDFCompressor = lazy(() => import("./pages/tools/PDFCompressor"));
const PDFMerger = lazy(() => import("./pages/tools/PDFMerger"));
const ImageConverter = lazy(() => import("./pages/tools/ImageConverter"));
const PDFToText = lazy(() => import("./pages/tools/PDFToText"));
const PDFSplitter = lazy(() => import("./pages/tools/PDFSplitter"));
const Stopwatch = lazy(() => import("./pages/tools/Stopwatch"));
const WorldClock = lazy(() => import("./pages/tools/WorldClock"));
const WordCounter = lazy(() => import("./pages/tools/WordCounter"));
const CharacterCounter = lazy(() => import("./pages/tools/CharacterCounter"));
const QRGenerator = lazy(() => import("./pages/tools/QRGenerator"));
const QRScanner = lazy(() => import("./pages/tools/QRScanner"));
const PasswordGenerator = lazy(() => import("./pages/tools/PasswordGenerator"));
const NameGenerator = lazy(() => import("./pages/tools/NameGenerator"));
const ColorPicker = lazy(() => import("./pages/tools/ColorPicker"));
const RandomNumber = lazy(() => import("./pages/tools/RandomNumber"));
const EquationSolver = lazy(() => import("./pages/tools/EquationSolver"));
const StudentAttendancePage = lazy(() => import("./pages/tools/StudentAttendancePage"));
const StaffAttendancePage = lazy(() => import("./pages/tools/StaffAttendancePage"));
const HRSetupPage = lazy(() => import("./pages/tools/HRSetupPage"));
const LeavesPage = lazy(() => import("./pages/tools/LeavesPage"));
const HolidaysPage = lazy(() => import("./pages/tools/HolidaysPage"));
const AttendanceReportsPage = lazy(() => import("./pages/tools/AttendanceReportsPage"));
const QuickManualEntry = lazy(() => import("./pages/tools/QuickManualEntry"));
const AttendanceAnalytics = lazy(() => import("./pages/tools/AttendanceAnalytics"));

// Content & SEO pages
// Content & SEO pages (eager for prerender whitelist)
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Announcements from "./pages/Announcements"; // eager: indexable feed hub
import AnnouncementDetail from "./pages/AnnouncementDetail";
import FAQ from "./pages/FAQ";
import StudyGuides from "./pages/StudyGuides"; // eager: prerendered SEO hub
import Boards from "./pages/Boards";
import BoardLandingPage from "./pages/BoardLandingPage";
import BoardClassPage from "./pages/BoardClassPage";
import BoardSubjectPage from "./pages/BoardSubjectPage";
import BoardTopicPage from "./pages/BoardTopicPage";
import ExamLandingPage from "./pages/exams/ExamLandingPage";
import ExamsHub from "./pages/exams/ExamsHub"; // eager: prerendered SEO hub
import NumsEntryTest from "./pages/exams/NumsEntryTest"; // eager: prerendered SEO page
import IbaSukkurEntryTest from "./pages/exams/IbaSukkurEntryTest"; // eager: prerendered SEO page
import LatLawAdmissionTest from "./pages/exams/LatLawAdmissionTest"; // eager: prerendered SEO page

const JobDetailPage = lazy(() => import("./pages/JobDetailPage"));
const ScholarshipDetailPage = lazy(() => import("./pages/ScholarshipDetailPage"));
const Tenders = lazy(() => import("./pages/Tenders"));
const BoardResults = lazy(() => import("./pages/BoardResults"));
const OpportunityDetail = lazy(() => import("./pages/OpportunityDetail"));
import ProgrammaticLandingPage from "./pages/programmatic/ProgrammaticLandingPage";
import ProgrammaticIndex from "./pages/programmatic/ProgrammaticIndex";

const App = () => {
  const isPrerender = typeof window === 'undefined' || (globalThis as any).__PRERENDER__;
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: isPrerender ? Infinity : 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: isPrerender ? false : 1,
      },
    },
  }));

  useEffect(() => {
    prefetchTopRoutes();
  }, []);

  return (
    <GlobalErrorBoundary scope="app">
    <QueryClientProvider client={queryClient}>
      <Router>
        <GA4PageTracker />
        <StructuredData />
        <LoadingProvider>
          <AuthProvider>
            <UserRoleProvider>
              <LearningProvider>
                <DeviceCapabilityProvider>
                   <AppearanceProvider>
                    <LanguageProvider>
                    <FloatingToolsProvider>
                    <TooltipProvider>
                    <PageLoader />
                    <AIWelcome />
                    <LibraryWelcome />
                    <CampaignTracker />
                    <EmailPrefSync />
                    <NavigationLoader />
                    <Sonner 
                      position="top-right"
                      expand={true}
                      closeButton={true}
                      toastOptions={{
                        duration: 3000,
                        style: {
                          maxWidth: '400px'
                        }
                      }}
                      visibleToasts={5}
                    />
                    
                    <MobileBottomNav />
                    <FloatingToolsRenderer />
                    <ToolRouteSEO />
                    <GlobalCanonical />
                    <GlobalCreditExhaustedListener />
                    <GuestResultCarryForward />
                    <CookieConsent />

                    <ProfileCompletionGuard>
                    <Suspense fallback={<TopProgressBar />}>
                    <RouteErrorBoundary>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/larkana" element={<Index />} />

                      {/* Programmatic SEO — curated /p hub + /p/:slug landing pages */}
                      <Route path="/p" element={<ProgrammaticIndex />} />
                      <Route path="/p/:slug" element={<Suspense fallback={<TopProgressBar />}><ProgrammaticLandingPage /></Suspense>} />



                      {/* Programmatic SEO - Board Routes (most specific first) */}
                      <Route path="/boards/:boardSlug/:classNumber/:subjectSlug/:topicSlug" element={<Suspense fallback={<TopProgressBar />}><BoardTopicPage /></Suspense>} />
                      <Route path="/boards/:boardSlug/:classNumber/:subjectSlug" element={<Suspense fallback={<TopProgressBar />}><BoardSubjectPage /></Suspense>} />
                      <Route path="/boards/:boardSlug/:classNumber" element={<Suspense fallback={<TopProgressBar />}><BoardClassPage /></Suspense>} />
                      <Route path="/boards/:boardSlug" element={<Suspense fallback={<TopProgressBar />}><BoardLandingPage /></Suspense>} />
                      <Route path="/boards" element={<Suspense fallback={<TopProgressBar />}><Boards /></Suspense>} />

                      <Route path="/auth" element={<Auth />} />
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/sign-in" element={<SignIn />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/sign-up" element={<SignUp />} />
                      <Route path="/get-started" element={<GetStarted />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/unsubscribe" element={<Unsubscribe />} />
                      <Route path="/delete-account" element={<DeleteAccount />} />
                      <Route path="/complete-profile" element={<CompleteProfile />} />

                      
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/admin/curation" element={<ExternalCuration />} />
                      <Route path="/admin/reviews" element={<Suspense fallback={<TopProgressBar />}><ReviewsManagement /></Suspense>} />
                      <Route path="/subjects" element={<Subjects />} />
                      <Route path="/dashboard" element={<InstantAuthGuard title="Analytics Dashboard" description="Sign in to view your detailed analytics" actionName="Analytics"><Analytics /></InstantAuthGuard>} />
                      <Route path="/profile" element={<InstantAuthGuard title="Your Profile" description="Sign in to access your profile" actionName="Profile"><Profile /></InstantAuthGuard>} />
                      <Route path="/analytics" element={<InstantAuthGuard title="Analytics Dashboard" description="Sign in to view your detailed analytics" actionName="Analytics"><Analytics /></InstantAuthGuard>} />
                      <Route path="/features/ai-coach" element={<AICoachLanding />} />
                      <Route path="/ai-coach" element={<InstantAuthGuard title="AI Coach Dashboard" description="Sign in to view your personalized AI coach insights" actionName="AI Coach"><Analytics /></InstantAuthGuard>} />
                      {/* Job/recruitment tests are public — guests use DB-only approved questions; no AI generation, no auth gate. */}
                      <Route path="/mock-tests" element={<MockTests />} />
                      <Route path="/mock-tests/:slug" element={<Suspense fallback={<TopProgressBar />}><MockTestDetail /></Suspense>} />
                      <Route path="/custom-quizzes" element={<CustomQuizzes />} />
                      <Route path="/custom-syllabus" element={<CustomSyllabus />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/feedback" element={<InstantAuthGuard title="Feedback" description="Sign in to submit feedback" actionName="Feedback"><Feedback /></InstantAuthGuard>} />
                      <Route path="/achievements" element={<InstantAuthGuard title="Achievements" description="Sign in to view your achievements" actionName="Achievements"><Achievements /></InstantAuthGuard>} />
                      <Route path="/subject/:id" element={<SubjectContent />} />
                      <Route path="/subject-content/:id" element={<SubjectContent />} />
                      <Route path="/jobs/:jobSlug" element={<Suspense fallback={<TopProgressBar />}><JobDetailPage /></Suspense>} />
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/scholarships/:scholarshipSlug" element={<Suspense fallback={<TopProgressBar />}><ScholarshipDetailPage /></Suspense>} />
                      <Route path="/scholarships" element={<Scholarships />} />
                      <Route path="/tenders" element={<Suspense fallback={<TopProgressBar />}><Tenders /></Suspense>} />
                      <Route path="/board-results" element={<Suspense fallback={<TopProgressBar />}><BoardResults /></Suspense>} />
                      <Route path="/opportunity/:id" element={<Suspense fallback={<TopProgressBar />}><OpportunityDetail /></Suspense>} />
                      <Route path="/past-papers" element={<PastPapers />} />
                      
                      {/* /quizzes is publicly indexable for SEO; the page itself
                          gates the "Start Quiz" action behind sign-in. */}
                      <Route path="/quizzes" element={<Quizzes />} />
                      <Route path="/question-bank" element={<QuestionBank />} />
                      <Route path="/submit-content" element={<SubmitContent />} />
                      <Route path="/ask-document" element={<AskDocument />} />
                      <Route path="/test-session/:id" element={<Suspense fallback={<TopProgressBar />}><TestSession /></Suspense>} />
                      <Route path="/quiz-session/:id" element={<Suspense fallback={<TopProgressBar />}><QuizPlayer /></Suspense>} />
                      <Route path="/notifications" element={<InstantAuthGuard title="Notifications" description="Sign in to view your notifications" actionName="Notifications"><Notifications /></InstantAuthGuard>} />
                      <Route path="/reviews" element={<Reviews />} />
                      
                      {/* Content & SEO Pages */}
                      <Route path="/exams" element={<ExamsHub />} />
                      <Route path="/exams/nums" element={<NumsEntryTest />} />
                      <Route path="/exams/iba-sukkur" element={<IbaSukkurEntryTest />} />
                      <Route path="/exams/lat" element={<LatLawAdmissionTest />} />
                      <Route path="/exams/:examSlug" element={<Suspense fallback={<TopProgressBar />}><ExamLandingPage /></Suspense>} />

                      <Route path="/mdcat-syllabus" element={<Suspense fallback={<TopProgressBar />}><MDCATSyllabus /></Suspense>} />
                      <Route path="/mdcat-past-papers" element={<Suspense fallback={<TopProgressBar />}><MDCATPastPapers /></Suspense>} />
                      <Route path="/ppsc-past-papers" element={<Suspense fallback={<TopProgressBar />}><PPSCPastPapers /></Suspense>} />
                      <Route path="/fpsc-past-papers" element={<Suspense fallback={<TopProgressBar />}><FPSCPastPapers /></Suspense>} />
                      <Route path="/css-mcqs-practice" element={<Suspense fallback={<TopProgressBar />}><CSSMCQs /></Suspense>} />
                      <Route path="/ecat-preparation" element={<Suspense fallback={<TopProgressBar />}><ECATPreparation /></Suspense>} />
                      <Route path="/nust-entry-test" element={<Suspense fallback={<TopProgressBar />}><NUSTEntryTest /></Suspense>} />
                      <Route path="/punjab-university-entry-test" element={<Suspense fallback={<TopProgressBar />}><PunjabUniversityEntryTest /></Suspense>} />
                      <Route path="/comsats-entry-test" element={<Suspense fallback={<TopProgressBar />}><COMSATSEntryTest /></Suspense>} />
                      <Route path="/sindh-universities-entry-test" element={<Suspense fallback={<TopProgressBar />}><SindhUniversitiesEntryTest /></Suspense>} />
                      <Route path="/engineering-universities-entry-test" element={<Suspense fallback={<TopProgressBar />}><EngineeringUniversitiesEntryTest /></Suspense>} />
                      <Route path="/pst-sst-test-preparation" element={<Suspense fallback={<TopProgressBar />}><PSTSSTTestPreparation /></Suspense>} />
                      <Route path="/9th-class-mcqs" element={<Suspense fallback={<TopProgressBar />}><NinthClassMCQs /></Suspense>} />
                      <Route path="/board-mcqs" element={<Suspense fallback={<TopProgressBar />}><BoardMCQs /></Suspense>} />
                      <Route path="/pak-army-test" element={<Suspense fallback={<TopProgressBar />}><PakArmyTest /></Suspense>} />
                      <Route path="/paf-test" element={<Suspense fallback={<TopProgressBar />}><PAFTest /></Suspense>} />
                      <Route path="/asf-test" element={<Suspense fallback={<TopProgressBar />}><ASFTest /></Suspense>} />
                      <Route path="/forces-jobs-tests" element={<Suspense fallback={<TopProgressBar />}><ForcesJobsTests /></Suspense>} />
                      <Route path="/blog" element={<Suspense fallback={<TopProgressBar />}><Blog /></Suspense>} />
                      <Route path="/blog/:slug" element={<Suspense fallback={<TopProgressBar />}><BlogPost /></Suspense>} />
                      <Route path="/announcements" element={<Suspense fallback={<TopProgressBar />}><Announcements /></Suspense>} />
                      <Route path="/announcements/:slug" element={<Suspense fallback={<TopProgressBar />}><AnnouncementDetail /></Suspense>} />
                      <Route path="/faq" element={<Suspense fallback={<TopProgressBar />}><FAQ /></Suspense>} />
                      <Route path="/study-guides" element={<Suspense fallback={<TopProgressBar />}><StudyGuides /></Suspense>} />
                      
                    {/* Tool Routes */}
                      <Route path="/tools" element={<Tools />} />
                      <Route path="/tools/calendar" element={<CalendarTool />} />
                      <Route path="/tools/islamic-calendar" element={<Suspense fallback={<TopProgressBar />}><IslamicCalendar /></Suspense>} />
                      <Route path="/tools/international-calendar" element={<Suspense fallback={<TopProgressBar />}><InternationalCalendar /></Suspense>} />
                      <Route path="/tools/math" element={<MathTool />} />
                      <Route path="/tools/age-calculator" element={<AgeCalculator />} />
                      <Route path="/tools/timer" element={<TimerTool />} />
                      <Route path="/tools/gpa-calculator" element={<GPACalculator />} />
                      <Route path="/tools/units" element={<UnitConverter />} />
                      <Route path="/tools/notes" element={<NotesTool />} />
                      
                      {/* Lazy-loaded tools */}
                      <Route path="/tools/bmi-calculator" element={<Suspense fallback={<TopProgressBar />}><BMICalculator /></Suspense>} />
                      <Route path="/tools/percentage-calculator" element={<Suspense fallback={<TopProgressBar />}><PercentageCalculator /></Suspense>} />
                      <Route path="/tools/salary-calculator" element={<Suspense fallback={<TopProgressBar />}><SalaryCalculator /></Suspense>} />
                      <Route path="/tools/emi-calculator" element={<Suspense fallback={<TopProgressBar />}><EMICalculator /></Suspense>} />
                      <Route path="/tools/tip-calculator" element={<Suspense fallback={<TopProgressBar />}><TipCalculator /></Suspense>} />
                      <Route path="/tools/loan-calculator" element={<Suspense fallback={<TopProgressBar />}><LoanCalculator /></Suspense>} />
                      <Route path="/tools/discount-calculator" element={<Suspense fallback={<TopProgressBar />}><DiscountCalculator /></Suspense>} />
                      <Route path="/tools/bmr-calculator" element={<Suspense fallback={<TopProgressBar />}><BMRCalculator /></Suspense>} />
                      <Route path="/tools/duration-calculator" element={<Suspense fallback={<TopProgressBar />}><DurationCalculator /></Suspense>} />
                      <Route path="/tools/ratio-calculator" element={<Suspense fallback={<TopProgressBar />}><RatioCalculator /></Suspense>} />
                      <Route path="/tools/speed-calculator" element={<Suspense fallback={<TopProgressBar />}><SpeedCalculator /></Suspense>} />
                      <Route path="/tools/area-calculator" element={<Suspense fallback={<TopProgressBar />}><AreaCalculator /></Suspense>} />
                      <Route path="/tools/fraction-calculator" element={<Suspense fallback={<TopProgressBar />}><FractionCalculator /></Suspense>} />
                      <Route path="/tools/date-calculator" element={<Suspense fallback={<TopProgressBar />}><DateCalculator /></Suspense>} />
                      <Route path="/tools/fuel-calculator" element={<Suspense fallback={<TopProgressBar />}><FuelCalculator /></Suspense>} />
                      <Route path="/tools/cgpa-calculator" element={<Suspense fallback={<TopProgressBar />}><CGPACalculator /></Suspense>} />
                      <Route path="/tools/gpa-to-percentage" element={<Suspense fallback={<TopProgressBar />}><GPAToPercentage /></Suspense>} />
                      <Route path="/tools/percentage-to-gpa" element={<Suspense fallback={<TopProgressBar />}><PercentageToGPA /></Suspense>} />
                      <Route path="/tools/grade-calculator" element={<Suspense fallback={<TopProgressBar />}><GradeCalculator /></Suspense>} />
                      <Route path="/tools/marks-calculator" element={<Suspense fallback={<TopProgressBar />}><MarksCalculator /></Suspense>} />
                      <Route path="/tools/aggregate-calculator" element={<AggregateCalculator />} />
                      <Route path="/tools/merit-calculator" element={<Suspense fallback={<TopProgressBar />}><MeritCalculator /></Suspense>} />
                      <Route path="/tools/pakistan-tax-calculator" element={<Suspense fallback={<TopProgressBar />}><PakistanTaxCalculator /></Suspense>} />
                      <Route path="/tools/zakat-calculator" element={<Suspense fallback={<TopProgressBar />}><ZakatCalculator /></Suspense>} />
                      <Route path="/tools/attendance-calculator" element={<Suspense fallback={<TopProgressBar />}><AttendanceCalculator /></Suspense>} />
                      <Route path="/tools/result-calculator" element={<Suspense fallback={<TopProgressBar />}><ResultCalculator /></Suspense>} />
                      <Route path="/tools/formula-sheet" element={<Suspense fallback={<TopProgressBar />}><FormulaSheet /></Suspense>} />
                      <Route path="/tools/periodic-table" element={<Suspense fallback={<TopProgressBar />}><PeriodicTable /></Suspense>} />
                      <Route path="/tools/multiplication-table" element={<Suspense fallback={<TopProgressBar />}><MultiplicationTable /></Suspense>} />
                      <Route path="/tools/currency-converter" element={<Suspense fallback={<TopProgressBar />}><CurrencyConverter /></Suspense>} />
                      <Route path="/tools/temperature-converter" element={<Suspense fallback={<TopProgressBar />}><TemperatureConverter /></Suspense>} />
                      <Route path="/tools/roman-converter" element={<Suspense fallback={<TopProgressBar />}><RomanConverter /></Suspense>} />
                      <Route path="/tools/binary-converter" element={<Suspense fallback={<TopProgressBar />}><BinaryConverter /></Suspense>} />
                      <Route path="/tools/case-converter" element={<Suspense fallback={<TopProgressBar />}><CaseConverter /></Suspense>} />
                      <Route path="/tools/image-resizer" element={<Suspense fallback={<TopProgressBar />}><ImageResizer /></Suspense>} />
                      <Route path="/tools/image-compressor" element={<Suspense fallback={<TopProgressBar />}><ImageCompressor /></Suspense>} />
                      <Route path="/tools/pdf-compressor" element={<Suspense fallback={<TopProgressBar />}><PDFCompressor /></Suspense>} />
                      <Route path="/tools/pdf-merger" element={<Suspense fallback={<TopProgressBar />}><PDFMerger /></Suspense>} />
                      <Route path="/tools/image-converter" element={<Suspense fallback={<TopProgressBar />}><ImageConverter /></Suspense>} />
                      <Route path="/tools/pdf-to-text" element={<Suspense fallback={<TopProgressBar />}><PDFToText /></Suspense>} />
                      <Route path="/tools/pdf-splitter" element={<Suspense fallback={<TopProgressBar />}><PDFSplitter /></Suspense>} />
                      <Route path="/tools/stopwatch" element={<Suspense fallback={<TopProgressBar />}><Stopwatch /></Suspense>} />
                      <Route path="/tools/world-clock" element={<Suspense fallback={<TopProgressBar />}><WorldClock /></Suspense>} />
                      <Route path="/tools/word-counter" element={<Suspense fallback={<TopProgressBar />}><WordCounter /></Suspense>} />
                      <Route path="/tools/character-counter" element={<Suspense fallback={<TopProgressBar />}><CharacterCounter /></Suspense>} />
                      <Route path="/tools/qr-generator" element={<Suspense fallback={<TopProgressBar />}><QRGenerator /></Suspense>} />
                      <Route path="/tools/qr-scanner" element={<Suspense fallback={<TopProgressBar />}><QRScanner /></Suspense>} />
                      <Route path="/tools/password-generator" element={<Suspense fallback={<TopProgressBar />}><PasswordGenerator /></Suspense>} />
                      <Route path="/tools/name-generator" element={<Suspense fallback={<TopProgressBar />}><NameGenerator /></Suspense>} />
                      <Route path="/tools/color-picker" element={<Suspense fallback={<TopProgressBar />}><ColorPicker /></Suspense>} />
                      <Route path="/tools/random-number" element={<Suspense fallback={<TopProgressBar />}><RandomNumber /></Suspense>} />
                      <Route path="/tools/equation-solver" element={<Suspense fallback={<TopProgressBar />}><EquationSolver /></Suspense>} />
                      
                      {/* School Attendance System */}
                      <Route path="/tools/school-attendance-system" element={<Suspense fallback={<TopProgressBar />}><AttendanceDashboard /></Suspense>} />
                      <Route path="/tools/school-attendance-system/student-attendance" element={<InstantAuthGuard title="Student Attendance" description="Sign in to mark student attendance" actionName="Student Attendance"><Suspense fallback={<TopProgressBar />}><StudentAttendancePage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/staff-attendance" element={<InstantAuthGuard title="Staff Attendance" description="Sign in to mark staff attendance" actionName="Staff Attendance"><Suspense fallback={<TopProgressBar />}><StaffAttendancePage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/setup" element={<InstantAuthGuard title="HR Setup" description="Sign in to configure HR settings" actionName="HR Setup"><Suspense fallback={<TopProgressBar />}><HRSetupPage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/leaves" element={<InstantAuthGuard title="Leave Management" description="Sign in to manage leaves" actionName="Leaves"><Suspense fallback={<TopProgressBar />}><LeavesPage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/holidays" element={<InstantAuthGuard title="Holiday Calendar" description="Sign in to manage holidays" actionName="Holidays"><Suspense fallback={<TopProgressBar />}><HolidaysPage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/reports" element={<InstantAuthGuard title="Attendance Reports" description="Sign in to view reports" actionName="Reports"><Suspense fallback={<TopProgressBar />}><AttendanceReportsPage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/quick-entry" element={<InstantAuthGuard title="Quick Manual Entry" description="Sign in to enter attendance" actionName="Quick Entry"><Suspense fallback={<TopProgressBar />}><QuickManualEntry /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/analytics" element={<InstantAuthGuard title="Attendance Analytics" description="Sign in to view attendance analytics" actionName="Analytics"><Suspense fallback={<TopProgressBar />}><AttendanceAnalytics /></Suspense></InstantAuthGuard>} />
                      
                      {/* Legal & Info Pages */}
                      <Route path="/about" element={<Suspense fallback={<TopProgressBar />}><About /></Suspense>} />
                      <Route path="/contact" element={<Suspense fallback={<TopProgressBar />}><Contact /></Suspense>} />
                      <Route path="/privacy-policy" element={<Suspense fallback={<TopProgressBar />}><PrivacyPolicy /></Suspense>} />
                      <Route path="/terms-of-service" element={<Suspense fallback={<TopProgressBar />}><TermsOfService /></Suspense>} />
                      <Route path="/editorial-policy" element={<Suspense fallback={<TopProgressBar />}><EditorialPolicy /></Suspense>} />
                      
                      <Route path="*" element={<NotFound />} />
                   </Routes>
                   </RouteErrorBoundary>
                   </Suspense>
                    </ProfileCompletionGuard>
                    </TooltipProvider>
                    </FloatingToolsProvider>
                    </LanguageProvider>
                  </AppearanceProvider>
                </DeviceCapabilityProvider>
              </LearningProvider>
            </UserRoleProvider>
          </AuthProvider>
        </LoadingProvider>
      </Router>
    </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
