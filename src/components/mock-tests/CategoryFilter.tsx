
import { Button } from "@/components/ui/button";

type CategoryFilterProps = {
  categories: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

export const CategoryFilter = ({ categories, activeFilter, onFilterChange }: CategoryFilterProps) => {
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <Button 
            key={index} 
            variant={activeFilter === category ? "default" : "outline"} 
            onClick={() => onFilterChange(category)} 
            size="sm" 
            className="capitalize hover-lift transition-all duration-200 text-sm px-3 py-2"
          >
            {category === "all" ? "All Subjects" : category}
          </Button>
        ))}
      </div>
    </div>
  );
};
