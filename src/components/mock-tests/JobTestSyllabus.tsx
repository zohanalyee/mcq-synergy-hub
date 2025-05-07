
import { motion } from "framer-motion";
import { SyllabusItem } from "@/data/jobTestsData";

interface JobTestSyllabusProps {
  isVisible: boolean;
  syllabus: SyllabusItem[];
}

export const JobTestSyllabus = ({ isVisible, syllabus }: JobTestSyllabusProps) => {
  if (!isVisible) return null;
  
  return (
    <motion.div 
      className="border rounded-lg p-3 bg-secondary/20"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <h4 className="text-sm font-medium mb-2">Official Test Syllabus:</h4>
      <div className="space-y-2">
        {syllabus.map((item: SyllabusItem, index: number) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span>{item.topic}</span>
            <span className="font-medium">{item.percentage}%</span>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <p className="text-xs text-muted-foreground">Percentages indicate exam weightage.</p>
      </div>
    </motion.div>
  );
};
