
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentItem, ContentCategory } from "@/interfaces/content";

interface CategoryEditFieldsProps {
  category?: ContentCategory;
  formData: Partial<ContentItem>;
  onChange: (field: keyof ContentItem, value: any) => void;
}

const CategoryEditFields = ({ category, formData, onChange }: CategoryEditFieldsProps) => {
  if (!category) return null;

  switch (category) {
    case 'job':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Job Cadre/Grade</Label>
            <Select 
              value={formData.cadre || ""} 
              onValueChange={(value) => onChange('cadre', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job cadre/grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grade-1">Grade 1</SelectItem>
                <SelectItem value="grade-2">Grade 2</SelectItem>
                <SelectItem value="grade-3">Grade 3</SelectItem>
                <SelectItem value="grade-4">Grade 4</SelectItem>
                <SelectItem value="grade-5">Grade 5</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Input
              value={formData.department || ""}
              onChange={(e) => onChange('department', e.target.value)}
              placeholder="Enter department name"
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location || ""}
              onChange={(e) => onChange('location', e.target.value)}
              placeholder="e.g., Islamabad, Lahore"
            />
          </div>

          <div className="space-y-2">
            <Label>Apply Link</Label>
            <Input
              value={formData.applyLink || ""}
              onChange={(e) => onChange('applyLink', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Government Level</Label>
            <Select 
              value={formData.governmentLevel || ""} 
              onValueChange={(value) => onChange('governmentLevel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select government level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="federal">Federal</SelectItem>
                <SelectItem value="provincial">Provincial</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Application Deadline</Label>
            <Input
              type="date"
              value={formData.deadline || ""}
              onChange={(e) => onChange('deadline', e.target.value)}
            />
          </div>
        </div>
      );

    case 'scholarship':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Scholarship Type</Label>
            <Select 
              value={formData.scholarshipType || ""} 
              onValueChange={(value) => onChange('scholarshipType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scholarship type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undergraduate">Undergraduate</SelectItem>
                <SelectItem value="graduate">Graduate</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="merit">Merit Based</SelectItem>
                <SelectItem value="need">Need Based</SelectItem>
                <SelectItem value="international">International</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Institution</Label>
            <Input
              value={formData.institution || ""}
              onChange={(e) => onChange('institution', e.target.value)}
              placeholder="Enter institution name"
            />
          </div>

          <div className="space-y-2">
            <Label>Application Deadline</Label>
            <Input
              type="date"
              value={formData.deadline || ""}
              onChange={(e) => onChange('deadline', e.target.value)}
            />
          </div>
        </div>
      );

    case 'mcq':
    case 'quiz':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={formData.subject || ""}
              onChange={(e) => onChange('subject', e.target.value)}
              placeholder="Enter subject"
            />
          </div>

          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              value={formData.topic || ""}
              onChange={(e) => onChange('topic', e.target.value)}
              placeholder="Enter topic"
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select 
              value={formData.difficulty || ""} 
              onValueChange={(value) => onChange('difficulty', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {category === 'quiz' && (
            <>
              <div className="space-y-2">
                <Label>Time Limit (seconds per question)</Label>
                <Input
                  type="number"
                  value={formData.timeLimit || ""}
                  onChange={(e) => onChange('timeLimit', parseInt(e.target.value) || 30)}
                  placeholder="30"
                  min={10}
                  max={300}
                />
              </div>

              <div className="space-y-2">
                <Label>Marks per Question</Label>
                <Input
                  type="number"
                  value={formData.marks || ""}
                  onChange={(e) => onChange('marks', parseInt(e.target.value) || 1)}
                  placeholder="1"
                  min={1}
                  max={10}
                />
              </div>
            </>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Exam Type</Label>
            <Input
              value={formData.examType || ""}
              onChange={(e) => onChange('examType', e.target.value)}
              placeholder="Enter exam type"
            />
          </div>

          <div className="space-y-2">
            <Label>Exam Year</Label>
            <Input
              value={formData.examYear || ""}
              onChange={(e) => onChange('examYear', e.target.value)}
              placeholder="Enter exam year"
            />
          </div>
        </div>
      );
  }
};

export default CategoryEditFields;
