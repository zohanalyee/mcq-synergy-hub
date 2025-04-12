
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SubjectsSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SubjectsSearch = ({ searchQuery, setSearchQuery }: SubjectsSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search subjects..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <button 
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SubjectsSearch;
