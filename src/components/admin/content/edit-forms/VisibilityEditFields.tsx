
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ContentItem } from "@/interfaces/content";

interface VisibilityEditFieldsProps {
  formData: Partial<ContentItem>;
  onChange: (field: keyof ContentItem, value: any) => void;
}

const VisibilityEditFields = ({ formData, onChange }: VisibilityEditFieldsProps) => {
  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
      <h3 className="font-medium">Content Visibility Settings</h3>
      <p className="text-sm text-muted-foreground">
        Choose where this content should appear in the application
      </p>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="showInSubjects"
            checked={formData.showInSubjects ?? true}
            onCheckedChange={(checked) => onChange('showInSubjects', checked)}
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
            checked={formData.showInSyllabus ?? false}
            onCheckedChange={(checked) => onChange('showInSyllabus', checked)}
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
            checked={formData.showInMockTests ?? false}
            onCheckedChange={(checked) => onChange('showInMockTests', checked)}
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
  );
};

export default VisibilityEditFields;
