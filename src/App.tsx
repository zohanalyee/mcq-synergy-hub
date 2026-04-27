import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, lazy, Suspense } from "react";

import StructuredData from "./components/StructuredData";
import GA4PageTracker from "./components/GA4PageTracker";
import BrandingLoader from "./components/BrandingLoader";
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
import NavigationLoader from "./components/NavigationLoader";
import FloatingToolsRenderer from "./components/tools/FloatingToolsRenderer";
import InstantAuthGuard from "./components/auth/InstantAuthGuard";
import ProfileCompletionGuard from "./components/ProfileCompletionGuard";
// Eager (above-the-fold / auth landing) — must load fast
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Auth from "./pages/Auth";
import GetStarted from "./pages/GetStarted";
import NotFound from "./pages/NotFound";

// Lazy: large feature pages (code-split for mobile performance)
const Subjects = lazy(() => import("./pages/Subjects"));
const MockTests = lazy(() => import("./pages/MockTests"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PastPapers = lazy(() => import("./pages/PastPapers"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Scholarships = lazy(() => import("./pages/Scholarships"));
const CustomSyllabus = lazy(() => import("./pages/CustomSyllabus"));
const SubjectContent = lazy(() => import("./pages/SubjectContent"));
const CustomQuizzes = lazy(() => import("./pages/CustomQuizzes"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ExternalCuration = lazy(() => import("./pages/admin/ExternalCuration"));
const ReviewsManagement = lazy(() => import("./pages/admin/ReviewsManagement"));

import FloatingFeedbackButton from "@/components/FloatingFeedbackButton";
import MobileBottomNav from "@/components/MobileBottomNav";

const Profile = lazy(() => import("./pages/Profile"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Achievements = lazy(() => import("./pages/Achievements"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Reviews = lazy(() => import("./pages/Reviews"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmailSent = lazy(() => import("./pages/VerifyEmailSent"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));

const Quizzes = lazy(() => import("./pages/Quizzes"));
const SubmitContent = lazy(() => import("./pages/SubmitContent"));

const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const QuestionBank = lazy(() => import("./pages/QuestionBank"));
const AskDocument = lazy(() => import("./pages/AskDocument"));
const TestSession = lazy(() => import("./pages/TestSession"));
const Notifications = lazy(() => import("./pages/Notifications"));

// Tool Pages — all lazy (rarely on initial load)
const CalendarTool = lazy(() => import("./pages/tools/CalendarTool"));
const IslamicCalendar = lazy(() => import("./pages/tools/IslamicCalendar"));
const InternationalCalendar = lazy(() => import("./pages/tools/InternationalCalendar"));
const MathTool = lazy(() => import("./pages/tools/MathTool"));
const AgeCalculator = lazy(() => import("./pages/tools/AgeCalculator"));
const TimerTool = lazy(() => import("./pages/tools/TimerTool"));
const GPACalculator = lazy(() => import("./pages/tools/GPACalculator"));
const UnitConverter = lazy(() => import("./pages/tools/UnitConverter"));
const NotesTool = lazy(() => import("./pages/tools/NotesTool"));

// Tools listing page
const Tools = lazy(() => import("./pages/Tools"));

// Lazy-loaded new tool pages
const BMICalculator = lazy(() => import("./pages/tools/BMICalculator"));
const PercentageCalculator = lazy(() => import("./pages/tools/PercentageCalculator"));
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
const CGPACalculator = lazy(() => import("./pages/tools/CGPACalculator"));
const GPAToPercentage = lazy(() => import("./pages/tools/GPAToPercentage"));
const PercentageToGPA = lazy(() => import("./pages/tools/PercentageToGPA"));
const GradeCalculator = lazy(() => import("./pages/tools/GradeCalculator"));
const MarksCalculator = lazy(() => import("./pages/tools/MarksCalculator"));
const AttendanceCalculator = lazy(() => import("./pages/tools/AttendanceCalculator"));
const ResultCalculator = lazy(() => import("./pages/tools/ResultCalculator"));
const FormulaSheet = lazy(() => import("./pages/tools/FormulaSheet"));
const PeriodicTable = lazy(() => import("./pages/tools/PeriodicTable"));
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
const PasswordGenerator = lazy(() => import("./pages/tools/PasswordGenerator"));
const NameGenerator = lazy(() => import("./pages/tools/NameGenerator"));
const ColorPicker = lazy(() => import("./pages/tools/ColorPicker"));
const RandomNumber = lazy(() => import("./pages/tools/RandomNumber"));
const EquationSolver = lazy(() => import("./pages/tools/EquationSolver"));
const AttendanceDashboard = lazy(() => import("./pages/tools/AttendanceDashboard"));
const StudentAttendancePage = lazy(() => import("./pages/tools/StudentAttendancePage"));
const StaffAttendancePage = lazy(() => import("./pages/tools/StaffAttendancePage"));
const HRSetupPage = lazy(() => import("./pages/tools/HRSetupPage"));
const LeavesPage = lazy(() => import("./pages/tools/LeavesPage"));
const HolidaysPage = lazy(() => import("./pages/tools/HolidaysPage"));
const AttendanceReportsPage = lazy(() => import("./pages/tools/AttendanceReportsPage"));
const QuickManualEntry = lazy(() => import("./pages/tools/QuickManualEntry"));
const AttendanceAnalytics = lazy(() => import("./pages/tools/AttendanceAnalytics"));

// Content & SEO pages
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const FAQ = lazy(() => import("./pages/FAQ"));
const StudyGuides = lazy(() => import("./pages/StudyGuides"));
const Boards = lazy(() => import("./pages/Boards"));
const BoardLandingPage = lazy(() => import("./pages/BoardLandingPage"));
const BoardClassPage = lazy(() => import("./pages/BoardClassPage"));
const BoardSubjectPage = lazy(() => import("./pages/BoardSubjectPage"));
const BoardTopicPage = lazy(() => import("./pages/BoardTopicPage"));
const ExamLandingPage = lazy(() => import("./pages/exams/ExamLandingPage"));
const JobDetailPage = lazy(() => import("./pages/JobDetailPage"));
const ScholarshipDetailPage = lazy(() => import("./pages/ScholarshipDetailPage"));
const Tenders = lazy(() => import("./pages/Tenders"));
const BoardResults = lazy(() => import("./pages/BoardResults"));
const OpportunityDetail = lazy(() => import("./pages/OpportunityDetail"));

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
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
                    <NavigationLoader />
                    <Toaster />
                    <Sonner 
                      position="top-right"
                      expand={true}
                      richColors={true}
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
                    <ProfileCompletionGuard>
                    <Suspense fallback={<BrandingLoader message="Loading..." size="md" />}>
                    <Routes>
                      <Route path="/" element={<Index />} />

                      {/* Programmatic SEO - Board Routes (most specific first) */}
                      <Route path="/boards/:boardSlug/:classNumber/:subjectSlug/:topicSlug" element={<Suspense fallback={null}><BoardTopicPage /></Suspense>} />
                      <Route path="/boards/:boardSlug/:classNumber/:subjectSlug" element={<Suspense fallback={null}><BoardSubjectPage /></Suspense>} />
                      <Route path="/boards/:boardSlug/:classNumber" element={<Suspense fallback={null}><BoardClassPage /></Suspense>} />
                      <Route path="/boards/:boardSlug" element={<Suspense fallback={null}><BoardLandingPage /></Suspense>} />
                      <Route path="/boards" element={<Suspense fallback={null}><Boards /></Suspense>} />

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
                      <Route path="/complete-profile" element={<CompleteProfile />} />
                      
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/admin/curation" element={<ExternalCuration />} />
                      <Route path="/admin/reviews" element={<Suspense fallback={null}><ReviewsManagement /></Suspense>} />
                      <Route path="/subjects" element={<Subjects />} />
                      <Route path="/dashboard" element={<InstantAuthGuard title="Analytics Dashboard" description="Sign in to view your detailed analytics" actionName="Analytics"><Analytics /></InstantAuthGuard>} />
                      <Route path="/profile" element={<InstantAuthGuard title="Your Profile" description="Sign in to access your profile" actionName="Profile"><Profile /></InstantAuthGuard>} />
                      <Route path="/analytics" element={<InstantAuthGuard title="Analytics Dashboard" description="Sign in to view your detailed analytics" actionName="Analytics"><Analytics /></InstantAuthGuard>} />
                      <Route path="/ai-coach" element={<InstantAuthGuard title="AI Coach Dashboard" description="Sign in to view your personalized AI coach insights" actionName="AI Coach"><Analytics /></InstantAuthGuard>} />
                      <Route path="/mock-tests" element={<InstantAuthGuard title="Mock Tests" description="Sign in to take tests and track progress" actionName="Mock Tests"><MockTests /></InstantAuthGuard>} />
                      <Route path="/custom-quizzes" element={<InstantAuthGuard title="Custom Quizzes" description="Sign in to create and take custom quizzes" actionName="Custom Quizzes"><CustomQuizzes /></InstantAuthGuard>} />
                      <Route path="/custom-syllabus" element={<CustomSyllabus />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/feedback" element={<InstantAuthGuard title="Feedback" description="Sign in to submit feedback" actionName="Feedback"><Feedback /></InstantAuthGuard>} />
                      <Route path="/achievements" element={<InstantAuthGuard title="Achievements" description="Sign in to view your achievements" actionName="Achievements"><Achievements /></InstantAuthGuard>} />
                      <Route path="/subject/:id" element={<SubjectContent />} />
                      <Route path="/subject-content/:id" element={<SubjectContent />} />
                      <Route path="/jobs/:jobSlug" element={<Suspense fallback={null}><JobDetailPage /></Suspense>} />
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/scholarships/:scholarshipSlug" element={<Suspense fallback={null}><ScholarshipDetailPage /></Suspense>} />
                      <Route path="/scholarships" element={<Scholarships />} />
                      <Route path="/tenders" element={<Suspense fallback={null}><Tenders /></Suspense>} />
                      <Route path="/board-results" element={<Suspense fallback={null}><BoardResults /></Suspense>} />
                      <Route path="/opportunity/:id" element={<Suspense fallback={null}><OpportunityDetail /></Suspense>} />
                      <Route path="/past-papers" element={<PastPapers />} />
                      
                      <Route path="/quizzes" element={<InstantAuthGuard title="Quizzes" description="Sign in to take quizzes and track your progress" actionName="Quizzes"><Quizzes /></InstantAuthGuard>} />
                      <Route path="/question-bank" element={<QuestionBank />} />
                      <Route path="/submit-content" element={<SubmitContent />} />
                      <Route path="/ask-document" element={<AskDocument />} />
                      <Route path="/test-session/:id" element={<InstantAuthGuard title="Test Session" description="Sign in to take this test and save your results" actionName="Test Session"><TestSession /></InstantAuthGuard>} />
                      <Route path="/notifications" element={<InstantAuthGuard title="Notifications" description="Sign in to view your notifications" actionName="Notifications"><Notifications /></InstantAuthGuard>} />
                      <Route path="/reviews" element={<Reviews />} />
                      
                      {/* Content & SEO Pages */}
                      <Route path="/exams/:examSlug" element={<Suspense fallback={null}><ExamLandingPage /></Suspense>} />
                      <Route path="/blog" element={<Suspense fallback={null}><Blog /></Suspense>} />
                      <Route path="/blog/:slug" element={<Suspense fallback={null}><BlogPost /></Suspense>} />
                      <Route path="/faq" element={<Suspense fallback={null}><FAQ /></Suspense>} />
                      <Route path="/study-guides" element={<Suspense fallback={null}><StudyGuides /></Suspense>} />
                      
                    {/* Tool Routes */}
                      <Route path="/tools" element={<Tools />} />
                      <Route path="/tools/calendar" element={<CalendarTool />} />
                      <Route path="/tools/islamic-calendar" element={<Suspense fallback={null}><IslamicCalendar /></Suspense>} />
                      <Route path="/tools/international-calendar" element={<Suspense fallback={null}><InternationalCalendar /></Suspense>} />
                      <Route path="/tools/math" element={<MathTool />} />
                      <Route path="/tools/age-calculator" element={<AgeCalculator />} />
                      <Route path="/tools/timer" element={<TimerTool />} />
                      <Route path="/tools/gpa-calculator" element={<GPACalculator />} />
                      <Route path="/tools/units" element={<UnitConverter />} />
                      <Route path="/tools/notes" element={<NotesTool />} />
                      
                      {/* Lazy-loaded tools */}
                      <Route path="/tools/bmi-calculator" element={<Suspense fallback={null}><BMICalculator /></Suspense>} />
                      <Route path="/tools/percentage-calculator" element={<Suspense fallback={null}><PercentageCalculator /></Suspense>} />
                      <Route path="/tools/salary-calculator" element={<Suspense fallback={null}><SalaryCalculator /></Suspense>} />
                      <Route path="/tools/emi-calculator" element={<Suspense fallback={null}><EMICalculator /></Suspense>} />
                      <Route path="/tools/tip-calculator" element={<Suspense fallback={null}><TipCalculator /></Suspense>} />
                      <Route path="/tools/loan-calculator" element={<Suspense fallback={null}><LoanCalculator /></Suspense>} />
                      <Route path="/tools/discount-calculator" element={<Suspense fallback={null}><DiscountCalculator /></Suspense>} />
                      <Route path="/tools/bmr-calculator" element={<Suspense fallback={null}><BMRCalculator /></Suspense>} />
                      <Route path="/tools/duration-calculator" element={<Suspense fallback={null}><DurationCalculator /></Suspense>} />
                      <Route path="/tools/ratio-calculator" element={<Suspense fallback={null}><RatioCalculator /></Suspense>} />
                      <Route path="/tools/speed-calculator" element={<Suspense fallback={null}><SpeedCalculator /></Suspense>} />
                      <Route path="/tools/area-calculator" element={<Suspense fallback={null}><AreaCalculator /></Suspense>} />
                      <Route path="/tools/fraction-calculator" element={<Suspense fallback={null}><FractionCalculator /></Suspense>} />
                      <Route path="/tools/date-calculator" element={<Suspense fallback={null}><DateCalculator /></Suspense>} />
                      <Route path="/tools/fuel-calculator" element={<Suspense fallback={null}><FuelCalculator /></Suspense>} />
                      <Route path="/tools/cgpa-calculator" element={<Suspense fallback={null}><CGPACalculator /></Suspense>} />
                      <Route path="/tools/gpa-to-percentage" element={<Suspense fallback={null}><GPAToPercentage /></Suspense>} />
                      <Route path="/tools/percentage-to-gpa" element={<Suspense fallback={null}><PercentageToGPA /></Suspense>} />
                      <Route path="/tools/grade-calculator" element={<Suspense fallback={null}><GradeCalculator /></Suspense>} />
                      <Route path="/tools/marks-calculator" element={<Suspense fallback={null}><MarksCalculator /></Suspense>} />
                      <Route path="/tools/attendance-calculator" element={<Suspense fallback={null}><AttendanceCalculator /></Suspense>} />
                      <Route path="/tools/result-calculator" element={<Suspense fallback={null}><ResultCalculator /></Suspense>} />
                      <Route path="/tools/formula-sheet" element={<Suspense fallback={null}><FormulaSheet /></Suspense>} />
                      <Route path="/tools/periodic-table" element={<Suspense fallback={null}><PeriodicTable /></Suspense>} />
                      <Route path="/tools/multiplication-table" element={<Suspense fallback={null}><MultiplicationTable /></Suspense>} />
                      <Route path="/tools/currency-converter" element={<Suspense fallback={null}><CurrencyConverter /></Suspense>} />
                      <Route path="/tools/temperature-converter" element={<Suspense fallback={null}><TemperatureConverter /></Suspense>} />
                      <Route path="/tools/roman-converter" element={<Suspense fallback={null}><RomanConverter /></Suspense>} />
                      <Route path="/tools/binary-converter" element={<Suspense fallback={null}><BinaryConverter /></Suspense>} />
                      <Route path="/tools/case-converter" element={<Suspense fallback={null}><CaseConverter /></Suspense>} />
                      <Route path="/tools/image-resizer" element={<Suspense fallback={null}><ImageResizer /></Suspense>} />
                      <Route path="/tools/image-compressor" element={<Suspense fallback={null}><ImageCompressor /></Suspense>} />
                      <Route path="/tools/pdf-compressor" element={<Suspense fallback={null}><PDFCompressor /></Suspense>} />
                      <Route path="/tools/pdf-merger" element={<Suspense fallback={null}><PDFMerger /></Suspense>} />
                      <Route path="/tools/image-converter" element={<Suspense fallback={null}><ImageConverter /></Suspense>} />
                      <Route path="/tools/pdf-to-text" element={<Suspense fallback={null}><PDFToText /></Suspense>} />
                      <Route path="/tools/pdf-splitter" element={<Suspense fallback={null}><PDFSplitter /></Suspense>} />
                      <Route path="/tools/stopwatch" element={<Suspense fallback={null}><Stopwatch /></Suspense>} />
                      <Route path="/tools/world-clock" element={<Suspense fallback={null}><WorldClock /></Suspense>} />
                      <Route path="/tools/word-counter" element={<Suspense fallback={null}><WordCounter /></Suspense>} />
                      <Route path="/tools/character-counter" element={<Suspense fallback={null}><CharacterCounter /></Suspense>} />
                      <Route path="/tools/qr-generator" element={<Suspense fallback={null}><QRGenerator /></Suspense>} />
                      <Route path="/tools/password-generator" element={<Suspense fallback={null}><PasswordGenerator /></Suspense>} />
                      <Route path="/tools/name-generator" element={<Suspense fallback={null}><NameGenerator /></Suspense>} />
                      <Route path="/tools/color-picker" element={<Suspense fallback={null}><ColorPicker /></Suspense>} />
                      <Route path="/tools/random-number" element={<Suspense fallback={null}><RandomNumber /></Suspense>} />
                      <Route path="/tools/equation-solver" element={<Suspense fallback={null}><EquationSolver /></Suspense>} />
                      
                      {/* School Attendance System */}
                      <Route path="/tools/school-attendance-system" element={<InstantAuthGuard title="School Attendance  System" description="Complete attendance tracking  management" actionName="HR Dashboard"><Suspense fallback={null}><AttendanceDashboard /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/student-attendance" element={<InstantAuthGuard title="Student Attendance" description="Sign in to mark student attendance" actionName="Student Attendance"><Suspense fallback={null}><StudentAttendancePage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/staff-attendance" element={<InstantAuthGuard title="Staff Attendance" description="Sign in to mark staff attendance" actionName="Staff Attendance"><Suspense fallback={null}><StaffAttendancePage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/setup" element={<InstantAuthGuard title="HR Setup" description="Sign in to configure HR settings" actionName="HR Setup"><Suspense fallback={null}><HRSetupPage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/leaves" element={<InstantAuthGuard title="Leave Management" description="Sign in to manage leaves" actionName="Leaves"><Suspense fallback={null}><LeavesPage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/holidays" element={<InstantAuthGuard title="Holiday Calendar" description="Sign in to manage holidays" actionName="Holidays"><Suspense fallback={null}><HolidaysPage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/reports" element={<InstantAuthGuard title="Attendance Reports" description="Sign in to view reports" actionName="Reports"><Suspense fallback={null}><AttendanceReportsPage /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/quick-entry" element={<InstantAuthGuard title="Quick Manual Entry" description="Sign in to enter attendance" actionName="Quick Entry"><Suspense fallback={null}><QuickManualEntry /></Suspense></InstantAuthGuard>} />
                      <Route path="/tools/school-attendance-system/analytics" element={<InstantAuthGuard title="Attendance Analytics" description="Sign in to view attendance analytics" actionName="Analytics"><Suspense fallback={null}><AttendanceAnalytics /></Suspense></InstantAuthGuard>} />
                      
                      {/* Legal & Info Pages */}
                      <Route path="/about" element={<Suspense fallback={null}><About /></Suspense>} />
                      <Route path="/contact" element={<Suspense fallback={null}><Contact /></Suspense>} />
                      <Route path="/privacy-policy" element={<Suspense fallback={null}><PrivacyPolicy /></Suspense>} />
                      <Route path="/terms-of-service" element={<Suspense fallback={null}><TermsOfService /></Suspense>} />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
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
  );
};

export default App;
