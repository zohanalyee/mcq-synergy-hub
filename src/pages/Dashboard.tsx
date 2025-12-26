import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import WeeklyProgressChart from "@/components/dashboard/WeeklyProgressChart";
import SubjectPieChart from "@/components/dashboard/SubjectPieChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SubjectBarChart from "@/components/dashboard/SubjectBarChart";
import WeaknessSection from "@/components/dashboard/WeaknessSection";
import EmptyDashboard from "@/components/dashboard/EmptyDashboard";
import RecentAchievements from "@/components/dashboard/RecentAchievements";
import SubjectsMasteryTab from "@/components/dashboard/SubjectsMasteryTab";
import StreakCounter from "@/components/gamification/StreakCounter";
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

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-1">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[120px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!user) {
      return <EmptyDashboard />;
    }

    switch (activeTab) {
      case "overview":
        return (
          <>
            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              <WeeklyProgressChart data={chartWeeklyData} />
              <RecentActivity />
              <RecentAchievements />
            </motion.div>

            {/* Weakness Section for Overview */}
            {hasData && <WeaknessSection weaknesses={weaknesses} />}
          </>
        );

      case "performance":
        if (!hasData) {
          return <EmptyDashboard />;
        }
        return (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SubjectPieChart data={chartSubjectData} />
              <SubjectBarChart data={chartSubjectData} />
            </div>
          </motion.div>
        );

      case "subjects":
        return <SubjectsMasteryTab />;

      default:
        return null;
    }
  };

  return (
    <Header>
      <div className="container mx-auto px-4 pt-4 pb-12">
        {/* AI Coach Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Personal Coach</h1>
              <p className="text-xs text-muted-foreground">
                {hasData 
                  ? `${totalTests} tests • ${averageScore}% avg`
                  : "Track progress & get recommendations"
                }
              </p>
            </div>
          </div>
          <StreakCounter />
        </div>

        <DashboardTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {renderTabContent()}
      </div>
    </Header>
  );
};

export default Dashboard;
