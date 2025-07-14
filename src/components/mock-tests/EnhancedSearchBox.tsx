import { useState } from "react";
import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedSearchBoxProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClearSearch: () => void;
  placeholder?: string;
}

export const EnhancedSearchBox = ({ 
  searchQuery, 
  setSearchQuery, 
  onClearSearch,
  placeholder = "Search tests..."
}: EnhancedSearchBoxProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div 
      className="relative max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`relative group transition-all duration-300 ${isFocused ? 'transform scale-105' : ''}`}>
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors duration-300 group-hover:text-primary" />
        
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            pl-12 pr-12 h-14 text-lg bg-background/50 backdrop-blur-sm border-2
            transition-all duration-300 ease-in-out
            ${isFocused 
              ? 'border-primary/50 shadow-elegant bg-background/80' 
              : 'border-border/50 hover:border-border/70 hover:bg-background/70'
            }
            focus:border-primary focus:shadow-elegant focus:bg-background
          `}
        />
        
        <AnimatePresence>
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearSearch}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Enhanced visual feedback */}
      <AnimatePresence>
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Searching for: "<span className="text-primary font-medium">{searchQuery}</span>"</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};