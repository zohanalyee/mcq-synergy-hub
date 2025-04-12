
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface FilterSummaryProps {
  count: number;
  isFiltered: boolean;
  clearFilters: () => void;
}

const FilterSummary = ({ count, isFiltered, clearFilters }: FilterSummaryProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-lg font-medium">
        {count} {count === 1 ? "Subject" : "Subjects"} Found
      </h2>
      
      {isFiltered && (
        <motion.button
          onClick={clearFilters}
          className="px-3 py-1 rounded text-sm font-medium bg-muted hover:bg-muted/70 flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="h-3.5 w-3.5" />
          Clear Filters
        </motion.button>
      )}
    </div>
  );
};

export default FilterSummary;
