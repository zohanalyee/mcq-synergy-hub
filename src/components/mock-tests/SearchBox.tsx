
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchBoxProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
};

export const SearchBox = ({ searchQuery, setSearchQuery, placeholder = "Search tests..." }: SearchBoxProps) => {
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
