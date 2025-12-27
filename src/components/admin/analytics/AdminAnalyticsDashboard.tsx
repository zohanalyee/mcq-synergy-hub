import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ActivityHeatmap from "./ActivityHeatmap";
import RealtimePulse from "./RealtimePulse";
import UserRetentionMetrics from "./UserRetentionMetrics";
import AIUsageLogs from "./AIUsageLogs";
import { BarChart3, Activity, Bot } from "lucide-react";

const AdminAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Platform performance and AI usage insights
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="ai-usage" className="flex items-center gap-1.5">
              <Bot className="h-4 w-4" />
              AI Usage
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Module 1: Activity Heatmap */}
          <ActivityHeatmap />

          {/* Module 2: Real-Time Pulse & Peak Hours */}
          <RealtimePulse />

          {/* Module 3: User Retention & Quality */}
          <UserRetentionMetrics />
        </div>
      )}

      {activeTab === "ai-usage" && (
        <AIUsageLogs />
      )}
    </motion.div>
  );
};

export default AdminAnalyticsDashboard;
