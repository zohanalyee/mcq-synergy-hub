
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchBoxProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
  onClearSearch?: () => void;
};

export const SearchBox = ({ 
  searchQuery, 
  setSearchQuery, 
  placeholder = "Search tests...", 
  onClearSearch 
}: SearchBoxProps) => {
  const handleClear = () => {
    setSearchQuery("");
    if (onClearSearch) {
      onClearSearch();
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
