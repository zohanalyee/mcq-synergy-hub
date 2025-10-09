
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
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="outline" className="flex items-center w-1/2 justify-center" onClick={() => onToggleSyllabus(testId)}>
          {isSyllabusExpanded ? (
            <>Hide Syllabus <ArrowUp className="ml-2 h-4 w-4" /></>
          ) : (
            <>Show Syllabus <ArrowDown className="ml-2 h-4 w-4" /></>
          )}
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center w-1/2 ml-2 justify-center" 
          onClick={e => onToggleCustomize(testId, e)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Customize
        </Button>
      </div>
      
      {showStartButton && (
        <Button className="w-full" onClick={onStartTest} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Test...
            </>
          ) : (
            'Start Test'
          )}
        </Button>
      )}
    </div>
  );
};
