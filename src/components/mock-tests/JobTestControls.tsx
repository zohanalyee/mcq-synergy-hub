
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, SlidersHorizontal, Loader2 } from "lucide-react";

interface JobTestControlsProps {
  testId: number;
  isSyllabusExpanded: boolean;
  isCustomizeExpanded: boolean;
  onToggleSyllabus: (testId: number) => void;
  onToggleCustomize: (testId: number, event: React.MouseEvent) => void;
  onStartTest: () => void;
  showStartButton: boolean;
  isGenerating?: boolean;
}

export const JobTestControls = ({
  testId,
  isSyllabusExpanded,
  isCustomizeExpanded,
  onToggleSyllabus,
  onToggleCustomize,
  onStartTest,
  showStartButton,
  isGenerating = false
}: JobTestControlsProps) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1 justify-center text-xs sm:text-sm px-2 sm:px-4" 
          onClick={() => onToggleSyllabus(testId)}
        >
          {isSyllabusExpanded ? (
            <><span className="hidden sm:inline">Hide Syllabus</span><span className="sm:hidden">Syllabus</span> <ArrowUp className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></>
          ) : (
            <><span className="hidden sm:inline">Show Syllabus</span><span className="sm:hidden">Syllabus</span> <ArrowDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" /></>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1 justify-center text-xs sm:text-sm px-2 sm:px-4" 
          onClick={e => onToggleCustomize(testId, e)}
        >
          <SlidersHorizontal className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
          <span>Customize</span>
        </Button>
      </div>
      
      {showStartButton && (
        <Button 
          className="w-full text-xs sm:text-sm" 
          size="sm"
          onClick={onStartTest} 
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Generating Test...</span>
              <span className="sm:hidden">Generating...</span>
            </>
          ) : (
            'Start Test'
          )}
        </Button>
      )}
    </div>
  );
};
