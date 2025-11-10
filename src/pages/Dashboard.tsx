
import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import WeeklyProgressChart from "@/components/dashboard/WeeklyProgressChart";
import SubjectPieChart from "@/components/dashboard/SubjectPieChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SubjectBarChart from "@/components/dashboard/SubjectBarChart";
import { subjectData, weeklyProgressData } from "@/data/dashboardData";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <DashboardHeader />

        <DashboardTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <WeeklyProgressChart data={weeklyProgressData} />
          <SubjectPieChart data={subjectData} />
          <RecentActivity />
          <SubjectBarChart data={subjectData} />
        </motion.div>
      </div>
    </>
  );
};

export default Dashboard;
