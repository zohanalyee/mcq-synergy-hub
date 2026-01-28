import { motion } from "framer-motion";
import { GraduationCap, Layers } from "lucide-react";
import { SystemWithLevels, LevelWithSystem } from "@/hooks/useSubjectsPageData";
import { cn } from "@/lib/utils";

interface SystemLevelFilterProps {
  systems: SystemWithLevels[];
  availableLevels: LevelWithSystem[];
  selectedSystemIds: string[];
  selectedLevelIds: string[];
  toggleSystemFilter: (systemId: string) => void;
  toggleLevelFilter: (levelId: string) => void;
}

const SystemLevelFilter = ({
  systems,
  availableLevels,
  selectedSystemIds,
  selectedLevelIds,
  toggleSystemFilter,
  toggleLevelFilter
}: SystemLevelFilterProps) => {
  return (
    <div className="space-y-4">
      {/* Educational Systems Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <GraduationCap className="h-4 w-4" />
          <span>Educational Boards</span>
        </div>
        <div 
          className="overflow-x-auto pb-2 scrollbar-thin"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          }}
        >
          <div className="flex gap-2 min-w-max px-2">
            <motion.button
              onClick={() => {
                // Clear all system selections (show all)
                if (selectedSystemIds.length > 0) {
                  selectedSystemIds.forEach(id => toggleSystemFilter(id));
                }
              }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                selectedSystemIds.length === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              All Boards
            </motion.button>
            {systems.map((system) => (
              <motion.button
                key={system.id}
                onClick={() => toggleSystemFilter(system.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  selectedSystemIds.includes(system.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {system.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Levels Filter - only show if there are levels */}
      {availableLevels.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>Classes / Levels</span>
          </div>
          <div 
            className="overflow-x-auto pb-2 scrollbar-thin"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            }}
          >
            <div className="flex gap-2 min-w-max px-2">
              <motion.button
                onClick={() => {
                  // Clear all level selections
                  if (selectedLevelIds.length > 0) {
                    selectedLevelIds.forEach(id => toggleLevelFilter(id));
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  selectedLevelIds.length === 0
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                All Levels
              </motion.button>
              {availableLevels.map((level) => (
                <motion.button
                  key={level.id}
                  onClick={() => toggleLevelFilter(level.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1",
                    selectedLevelIds.includes(level.id)
                      ? "bg-primary/80 text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{level.name}</span>
                  {selectedSystemIds.length === 0 && (
                    <span className="text-[10px] opacity-70">({level.systemName})</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLevelFilter;
