import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LearningProvider } from "./contexts/LearningContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { FloatingToolsProvider } from "./contexts/FloatingToolsContext";
import { AppearanceProvider } from "./contexts/AppearanceContext";
import { DeviceCapabilityProvider } from "./contexts/DeviceCapabilityContext";
import PageLoader from "./components/PageLoader";
import NavigationLoader from "./components/NavigationLoader";
import FloatingToolsRenderer from "./components/tools/FloatingToolsRenderer";
import Index from "./pages/Index";
import Subjects from "./pages/Subjects";
import MockTests from "./pages/MockTests";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import GetStarted from "./pages/GetStarted";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Auth from "./pages/Auth";
import PastPapers from "./pages/PastPapers";
import Jobs from "./pages/Jobs";
import Scholarships from "./pages/Scholarships";
import CustomSyllabus from "./pages/CustomSyllabus";
import SubjectContent from "./pages/SubjectContent";
import CustomQuizzes from "./pages/CustomQuizzes";
import AdminPanel from "./pages/AdminPanel";
import ExternalCuration from "./pages/admin/ExternalCuration";
import NotFound from "./pages/NotFound";
import NoticeBoard from "@/components/NoticeBoard";
import FloatingFeedbackButton from "@/components/FloatingFeedbackButton";
import MobileBottomNav from "@/components/MobileBottomNav";
import Profile from "./pages/Profile";
import Feedback from "./pages/Feedback";
import Achievements from "./pages/Achievements";

import Quizzes from "./pages/Quizzes";
import SubmitContent from "./pages/SubmitContent";
import QuestionBank from "./pages/QuestionBank";
import AskDocument from "./pages/AskDocument";
import TestSession from "./pages/TestSession";
import Notifications from "./pages/Notifications";

// Existing Tool Pages
import CalendarTool from "./pages/tools/CalendarTool";
import MathTool from "./pages/tools/MathTool";
import AgeCalculator from "./pages/tools/AgeCalculator";
import TimerTool from "./pages/tools/TimerTool";
import GPACalculator from "./pages/tools/GPACalculator";
import UnitConverter from "./pages/tools/UnitConverter";
import NotesTool from "./pages/tools/NotesTool";

// Tools listing page
import Tools from "./pages/Tools";

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
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <LoadingProvider>
          <AuthProvider>
            <UserRoleProvider>
              <LearningProvider>
                <DeviceCapabilityProvider>
                  <AppearanceProvider>
                    <FloatingToolsProvider>
                    <TooltipProvider>
                    <PageLoader />
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
                    <NoticeBoard />
                    
                    <MobileBottomNav />
                    <FloatingToolsRenderer />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/sign-in" element={<SignIn />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/sign-up" element={<SignUp />} />
                      <Route path="/get-started" element={<GetStarted />} />
                      
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/admin/curation" element={<ExternalCuration />} />
                      <Route path="/subjects" element={<Subjects />} />
                      <Route path="/dashboard" element={<Analytics />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/mock-tests" element={<MockTests />} />
                      <Route path="/custom-quizzes" element={<CustomQuizzes />} />
                      <Route path="/custom-syllabus" element={<CustomSyllabus />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/feedback" element={<Feedback />} />
                      <Route path="/achievements" element={<Achievements />} />
                      <Route path="/subject/:id" element={<SubjectContent />} />
                      <Route path="/subject-content/:id" element={<SubjectContent />} />
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/scholarships" element={<Scholarships />} />
                      <Route path="/past-papers" element={<PastPapers />} />
                      
                      <Route path="/quizzes" element={<Quizzes />} />
                      <Route path="/question-bank" element={<QuestionBank />} />
                      <Route path="/submit-content" element={<SubmitContent />} />
                      <Route path="/ask-document" element={<AskDocument />} />
                      <Route path="/test-session/:id" element={<TestSession />} />
                      <Route path="/notifications" element={<Notifications />} />
                      
                    {/* Tool Routes */}
                      <Route path="/tools" element={<Tools />} />
                      <Route path="/tools/calendar" element={<CalendarTool />} />
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
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </TooltipProvider>
                    </FloatingToolsProvider>
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
