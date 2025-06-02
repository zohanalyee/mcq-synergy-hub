import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Subjects from "./pages/Subjects";
import Dashboard from "./pages/Dashboard";
import MockTests from "./pages/MockTests";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import GetStarted from "./pages/GetStarted";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PastPapers from "./pages/PastPapers";
import Jobs from "./pages/Jobs";
import Scholarships from "./pages/Scholarships";
import CustomSyllabus from "./pages/CustomSyllabus";
import SubjectContent from "./pages/SubjectContent";
import CustomQuizzes from "./pages/CustomQuizzes";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import NoticeBoard from "@/components/NoticeBoard";
import Profile from "./pages/Profile";
import Feedback from "./pages/Feedback";
import MCQs from "./pages/MCQs";
import Quizzes from "./pages/Quizzes";

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <UserRoleProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner position="top-center" />
              <NoticeBoard />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/get-started" element={<GetStarted />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/mock-tests" element={<MockTests />} />
                <Route path="/custom-quizzes" element={<CustomQuizzes />} />
                <Route path="/custom-syllabus" element={<CustomSyllabus />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/subject/:id" element={<SubjectContent />} />
                <Route path="/subject-content/:id" element={<SubjectContent />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/scholarships" element={<Scholarships />} />
                <Route path="/past-papers" element={<PastPapers />} />
                <Route path="/mcqs" element={<MCQs />} />
                <Route path="/quizzes" element={<Quizzes />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </UserRoleProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
