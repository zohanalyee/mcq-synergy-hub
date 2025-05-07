
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBoxProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClearSearch?: () => void;
}

export const SearchBox = ({ searchQuery, setSearchQuery, onClearSearch }: SearchBoxProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder="Search quizzes by title or subject..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          onClick={onClearSearch}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
