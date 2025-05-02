
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import SubmitContent from "./pages/SubmitContent";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import NoticeBoard from "./components/NoticeBoard";
import Profile from "./pages/Profile";
import Feedback from "./pages/Feedback";

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UserRoleProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <NoticeBoard />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mock-tests" element={<MockTests />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/get-started" element={<GetStarted />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/past-papers" element={<PastPapers />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/scholarships" element={<Scholarships />} />
                <Route path="/custom-syllabus" element={<CustomSyllabus />} />
                <Route path="/subject-content/:subjectSlug" element={<SubjectContent />} />
                <Route path="/custom-quizzes" element={<CustomQuizzes />} />
                <Route path="/submit-content" element={<SubmitContent />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </UserRoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
