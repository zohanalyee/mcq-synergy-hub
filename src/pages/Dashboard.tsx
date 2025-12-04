import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import WeeklyProgressChart from "@/components/dashboard/WeeklyProgressChart";
import SubjectPieChart from "@/components/dashboard/SubjectPieChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SubjectBarChart from "@/components/dashboard/SubjectBarChart";
import WeaknessSection from "@/components/dashboard/WeaknessSection";
import EmptyDashboard from "@/components/dashboard/EmptyDashboard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { subjectData, weeklyProgressData } from "@/data/dashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Brain } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const { 
    subjectPerformance, 
    weaknesses, 
    weeklyProgress, 
    loading, 
    hasData,
    totalTests,
    averageScore 
  } = useDashboardData();

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Use real data if available, otherwise fall back to sample data
  const chartSubjectData = hasData ? subjectPerformance : subjectData;
  const chartWeeklyData = hasData && weeklyProgress.some(w => w.score > 0) 
    ? weeklyProgress 
    : weeklyProgressData;

  return (
    <Header>
      <div className="container mx-auto px-4 pt-8 pb-16">
        {/* AI Coach Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Personal Coach</h1>
            <p className="text-sm text-muted-foreground">
              {hasData 
                ? `${totalTests} tests completed • ${averageScore}% average score`
                : "Track your progress and get personalized recommendations"
              }
            </p>
          </div>
        </div>

        <DashboardTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[200px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !user ? (
          <EmptyDashboard />
        ) : !hasData ? (
          <EmptyDashboard />
        ) : (
          <>
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <WeeklyProgressChart data={chartWeeklyData} />
              <SubjectPieChart data={chartSubjectData} />
              <RecentActivity />
              <SubjectBarChart data={chartSubjectData} />
            </motion.div>

            {/* Weakness Section */}
            <WeaknessSection weaknesses={weaknesses} />
          </>
        )}
      </div>
    </Header>
  );
};

export default Dashboard;
