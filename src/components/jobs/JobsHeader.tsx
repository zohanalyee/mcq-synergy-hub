
import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

const JobsHeader = () => {
  return (
    <div className="mt-6 mb-12">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold flex items-center"
      >
        <Briefcase className="mr-2 h-8 w-8 text-primary" /> Jobs
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-muted-foreground mt-2"
      >
        Discover job opportunities in government and private sectors
      </motion.p>
    </div>
  );
};

export default JobsHeader;
