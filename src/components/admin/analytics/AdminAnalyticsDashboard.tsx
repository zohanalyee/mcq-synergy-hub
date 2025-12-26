import { motion } from "framer-motion";
import ActivityHeatmap from "./ActivityHeatmap";
import RealtimePulse from "./RealtimePulse";
import UserRetentionMetrics from "./UserRetentionMetrics";

const AdminAnalyticsDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Deep insights into user behavior and platform performance
          </p>
        </div>
      </div>

      {/* Module 1: Activity Heatmap */}
      <ActivityHeatmap />

      {/* Module 2: Real-Time Pulse & Peak Hours */}
      <RealtimePulse />

      {/* Module 3: User Retention & Quality */}
      <UserRetentionMetrics />
    </motion.div>
  );
};

export default AdminAnalyticsDashboard;
