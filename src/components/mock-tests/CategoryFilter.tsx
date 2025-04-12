
import { Button } from "@/components/ui/button";

type CategoryFilterProps = {
  categories: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

export const CategoryFilter = ({ categories, activeFilter, onFilterChange }: CategoryFilterProps) => {
  return (
    <div className="mb-8 overflow-x-auto pb-2">
      <div className="flex space-x-2 min-w-max">
        {categories.map((category, index) => (
          <Button 
            key={index} 
            variant={activeFilter === category ? "default" : "outline"} 
            onClick={() => onFilterChange(category)} 
            size="sm" 
            className="capitalize"
          >
            {category === "all" ? "All" : category}
          </Button>
        ))}
      </div>
    </div>
  );
};
