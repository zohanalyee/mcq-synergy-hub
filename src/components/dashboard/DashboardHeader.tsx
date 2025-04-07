
import { motion } from "framer-motion";

const DashboardHeader = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">View your progress and analytics</p>
    </motion.div>
  );
};

export default DashboardHeader;
