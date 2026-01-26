import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
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
import Dashboard from "./pages/Dashboard";
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
import TestSession from "./pages/TestSession";

// Tool Pages
import CalendarTool from "./pages/tools/CalendarTool";
import MathTool from "./pages/tools/MathTool";
import AgeCalculator from "./pages/tools/AgeCalculator";
import TimerTool from "./pages/tools/TimerTool";
import GPACalculator from "./pages/tools/GPACalculator";
import UnitConverter from "./pages/tools/UnitConverter";
import NotesTool from "./pages/tools/NotesTool";

const App = () => {
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
                    <FloatingFeedbackButton />
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
                      <Route path="/dashboard" element={<Dashboard />} />
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
                      <Route path="/test-session/:id" element={<TestSession />} />
                      
                      {/* Tool Routes */}
                      <Route path="/tools/calendar" element={<CalendarTool />} />
                      <Route path="/tools/math" element={<MathTool />} />
                      <Route path="/tools/age-calculator" element={<AgeCalculator />} />
                      <Route path="/tools/timer" element={<TimerTool />} />
                      <Route path="/tools/gpa-calculator" element={<GPACalculator />} />
                      <Route path="/tools/units" element={<UnitConverter />} />
                      <Route path="/tools/notes" element={<NotesTool />} />
                      
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
