
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentCategory } from "@/interfaces/content";
import { Calendar } from "lucide-react";
import CSVUploader from "@/components/CSVUploader";

interface CategoryFieldsProps {
  category: ContentCategory;
  form: any; // Using any to make it work with react-hook-form
}

const CategoryFields = ({ category, form }: CategoryFieldsProps) => {
  const handleCSVChange = (file: File | undefined) => {
    form.setValue('csvFile', file);
  };

  switch (category) {
    case 'job':
      return (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="cadre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Cadre/Grade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job cadre/grade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="grade-1">Grade 1</SelectItem>
                    <SelectItem value="grade-2">Grade 2</SelectItem>
                    <SelectItem value="grade-3">Grade 3</SelectItem>
                    <SelectItem value="grade-4">Grade 4</SelectItem>
                    <SelectItem value="grade-5">Grade 5</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Enter department name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="governmentLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Government Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select government level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="provincial">Provincial</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application Deadline</FormLabel>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    
    case 'scholarship':
      return (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="scholarshipType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scholarship Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scholarship type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="merit">Merit-based</SelectItem>
                    <SelectItem value="need">Need-based</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution</FormLabel>
                <FormControl>
                  <Input placeholder="Enter institution name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application Deadline</FormLabel>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    
    case 'past_paper':
      return (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="examType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exam Type</FormLabel>
                <FormControl>
                  <Input placeholder="Enter exam type (e.g., Final, Midterm)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="examYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input placeholder="Enter year (e.g., 2023)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case 'mcq':
      return (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with MCQs or enter the details manually.
            Each MCQ should include a question, options, correct answer, subject, and topic.
          </p>
          <CSVUploader onFileChange={handleCSVChange} category="mcq" />
        </div>
      );
        
    case 'quiz':
      return (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with quiz questions or enter the details manually.
            Each quiz should include a title, questions, options, correct answers, subject, topic, and time limit.
          </p>
          <CSVUploader onFileChange={handleCSVChange} category="quiz" />
        </div>
      );
    
    default:
      return null;
  }
};

export default CategoryFields;
