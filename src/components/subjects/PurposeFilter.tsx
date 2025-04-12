
import { motion } from "framer-motion";
import { FileText, CheckSquare } from "lucide-react";

interface PurposeFilterProps {
  options: string[];
  selectedPurpose: string;
  setSelectedPurpose: (purpose: string) => void;
}

const PurposeFilter = ({ options, selectedPurpose, setSelectedPurpose }: PurposeFilterProps) => {
  return (
    <div className="flex space-x-2">
      {options.map((purpose) => (
        <motion.button
          key={purpose}
          onClick={() => setSelectedPurpose(purpose)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
            selectedPurpose === purpose
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {purpose === "Reading" && <FileText className="h-4 w-4" />}
          {purpose === "MCQs" && <CheckSquare className="h-4 w-4" />}
          {purpose}
        </motion.button>
      ))}
    </div>
  );
};

export default PurposeFilter;
