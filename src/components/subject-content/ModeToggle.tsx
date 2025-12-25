import { BookOpen, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

export type StudyMode = "read" | "practice";

interface ModeToggleProps {
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
}

export const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/50 border border-border/50 backdrop-blur-sm">
      <button
        onClick={() => onModeChange("read")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300",
          mode === "read"
            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <BookOpen className="w-4 h-4" />
        <span>Read Mode</span>
      </button>
      <button
        onClick={() => onModeChange("practice")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300",
          mode === "practice"
            ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <PenTool className="w-4 h-4" />
        <span>Practice Mode</span>
      </button>
    </div>
  );
};

export default ModeToggle;
