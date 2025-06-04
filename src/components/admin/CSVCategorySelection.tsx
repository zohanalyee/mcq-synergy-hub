
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ContentCategory } from "@/interfaces/content";

interface CSVCategorySelectionProps {
  value: ContentCategory;
  onChange: (value: ContentCategory) => void;
}

const CSVCategorySelection = ({ value, onChange }: CSVCategorySelectionProps) => {
  return (
    <div className="space-y-2">
      <Label>Content Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select content type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="scholarship">Scholarship</SelectItem>
          <SelectItem value="job">Job</SelectItem>
          <SelectItem value="mcq">MCQs</SelectItem>
          <SelectItem value="quiz">Quiz</SelectItem>
          <SelectItem value="past_paper">Past Paper</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Choose the type of content you want to upload via CSV
      </p>
    </div>
  );
};

export default CSVCategorySelection;
