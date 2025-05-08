
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ContentItem } from "@/interfaces/content";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface EditContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentItem: ContentItem | null;
  onSave: (title: string, description: string, visibility?: {
    showInSubjects?: boolean;
    showInSyllabus?: boolean;
    showInMockTests?: boolean;
  }) => void;
}

const EditContentDialog = ({ 
  open, 
  onOpenChange, 
  currentItem, 
  onSave 
}: EditContentDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // Visibility state
  const [showInSubjects, setShowInSubjects] = useState(false);
  const [showInSyllabus, setShowInSyllabus] = useState(false);
  const [showInMockTests, setShowInMockTests] = useState(false);

  useEffect(() => {
    if (currentItem) {
      setTitle(currentItem.title);
      setDescription(currentItem.description);
      setShowInSubjects(currentItem.showInSubjects ?? true);
      setShowInSyllabus(currentItem.showInSyllabus ?? false);
      setShowInMockTests(currentItem.showInMockTests ?? false);
    }
  }, [currentItem]);

  const handleSave = () => {
    onSave(
      title, 
      description, 
      {
        showInSubjects,
        showInSyllabus,
        showInMockTests
      }
    );
  };

  // Check if the item is eligible for visibility settings
  const showVisibilityOptions = currentItem && 
    (currentItem.category === 'mcq' || 
     currentItem.category === 'quiz' || 
     currentItem.category === 'past_paper');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Content description"
              className="min-h-[100px]"
            />
          </div>

          {/* Visibility Options */}
          {showVisibilityOptions && (
            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
              <h3 className="font-medium">Visibility Settings</h3>
              <p className="text-sm text-muted-foreground">Select where this content should appear:</p>
              
              <div className="flex flex-col space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="showInSubjects"
                    checked={showInSubjects}
                    onCheckedChange={(checked) => setShowInSubjects(checked as boolean)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="showInSubjects">
                      Subject-wise Practice
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show in the subjects page for regular practice
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="showInSyllabus"
                    checked={showInSyllabus}
                    onCheckedChange={(checked) => setShowInSyllabus(checked as boolean)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="showInSyllabus">
                      Custom Syllabus Builder
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Include in the custom syllabus builder page
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="showInMockTests"
                    checked={showInMockTests}
                    onCheckedChange={(checked) => setShowInMockTests(checked as boolean)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="showInMockTests">
                      Timed Mock Tests
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Make available in the mock tests section
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditContentDialog;
