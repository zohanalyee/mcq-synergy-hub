import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Settings, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QuestionAssignmentDialogProps {
  questionId: string;
  questionTitle: string;
  currentSubject?: string;
  currentTopic?: string;
  onAssignmentComplete?: () => void;
}

const QuestionAssignmentDialog = ({ 
  questionId, 
  questionTitle, 
  currentSubject,
  currentTopic,
  onAssignmentComplete 
}: QuestionAssignmentDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState({
    showInSubjects: false,
    showInSyllabus: false,
    showInMockTests: false
  });

  const handleCheckboxChange = (field: keyof typeof assignments, checked: boolean) => {
    setAssignments(prev => ({ ...prev, [field]: checked }));
  };

  const handleAssign = async () => {
    if (!assignments.showInSubjects && !assignments.showInSyllabus && !assignments.showInMockTests) {
      toast.error("Please select at least one section to assign this question to");
      return;
    }

    setLoading(true);
    try {
      // Update the question with visibility flags and approve it
      const { error } = await supabase
        .from('content_items')
        .update({
          show_in_subjects: assignments.showInSubjects,
          show_in_syllabus: assignments.showInSyllabus,
          show_in_mock_tests: assignments.showInMockTests,
          status: 'approved'
        })
        .eq('id', questionId);

      if (error) throw error;

      const assignedSections = [];
      if (assignments.showInSubjects) assignedSections.push("Subject-wise Practice");
      if (assignments.showInSyllabus) assignedSections.push("Custom Syllabus Builder");
      if (assignments.showInMockTests) assignedSections.push("Job Test Preparation");

      toast.success(`Question assigned to: ${assignedSections.join(", ")}`);
      setIsOpen(false);
      onAssignmentComplete?.();
    } catch (error) {
      console.error("Error assigning question:", error);
      toast.error("Failed to assign question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Assign to Sections
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Assign Question to Practice Sections
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Question Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="font-medium text-sm">{questionTitle}</p>
            <div className="flex gap-2">
              {currentSubject && (
                <Badge variant="outline" className="text-xs">
                  {currentSubject}
                </Badge>
              )}
              {currentTopic && (
                <Badge variant="outline" className="text-xs">
                  {currentTopic}
                </Badge>
              )}
            </div>
          </div>

          {/* Assignment Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Select Practice Sections:</Label>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id="subjects"
                  checked={assignments.showInSubjects}
                  onCheckedChange={(checked) => handleCheckboxChange('showInSubjects', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="subjects" className="font-medium cursor-pointer">
                    Subject-wise Practice
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show in MCQ Practice page for subject-based learning
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id="syllabus"
                  checked={assignments.showInSyllabus}
                  onCheckedChange={(checked) => handleCheckboxChange('showInSyllabus', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="syllabus" className="font-medium cursor-pointer">
                    Custom Syllabus Builder
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Include in custom syllabus topic practice
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id="mock-tests"
                  checked={assignments.showInMockTests}
                  onCheckedChange={(checked) => handleCheckboxChange('showInMockTests', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="mock-tests" className="font-medium cursor-pointer">
                    Job Test Preparation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Include in job test mock tests and preparation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={loading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? "Assigning..." : "Assign & Approve"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionAssignmentDialog;
