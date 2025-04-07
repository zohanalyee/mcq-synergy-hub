
import { Button } from "@/components/ui/button";

interface SubjectFilterProps {
  filter: string;
  setFilter: (filter: string) => void;
}

const SubjectFilter = ({ filter, setFilter }: SubjectFilterProps) => {
  return (
    <div className="space-x-2">
      <Button 
        variant={filter === "all" ? "default" : "outline"} 
        onClick={() => setFilter("all")}
        size="sm"
      >
        All
      </Button>
      <Button 
        variant={filter === "mathematics" ? "default" : "outline"} 
        onClick={() => setFilter("mathematics")}
        size="sm"
      >
        Mathematics
      </Button>
      <Button 
        variant={filter === "computer science" ? "default" : "outline"} 
        onClick={() => setFilter("computer science")}
        size="sm"
      >
        CS
      </Button>
    </div>
  );
};

export default SubjectFilter;
