import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentCategory } from "@/interfaces/content";
import { Calendar } from "lucide-react";
import CSVUploader from "@/components/CSVUploader";
import { useEffect, useState } from "react";
import { getSubjects } from "@/services/adminService";
import { getTopics } from "@/services/adminService";

interface CategoryFieldsProps {
  category: ContentCategory;
  form: any; // Using any to make it work with react-hook-form
}

const CategoryFields = ({ category, form }: CategoryFieldsProps) => {
  const [subjects, setSubjects] = useState<{ title: string }[]>([]);
  const [topics, setTopics] = useState<{ title: string }[]>([]);
  const selectedSubject = form.watch('subject') || '';

  useEffect(() => {
    const loadSubjects = () => {
      const subjects = getSubjects();
      setSubjects(subjects);
    };
    
    if (category === 'mcq' || category === 'quiz') {
      loadSubjects();
    }
  }, [category]);

  useEffect(() => {
    const loadTopics = () => {
      if (selectedSubject) {
        const topicsData = getTopics();
        const subjectTopics = topicsData[selectedSubject] || [];
        setTopics(subjectTopics.map(topic => ({ title: topic })));
        
        // Reset topic when subject changes
        if (form.getValues('topic') && !subjectTopics.some(t => t === form.getValues('topic'))) {
          form.setValue('topic', '');
        }
      } else {
        setTopics([]);
        form.setValue('topic', '');
      }
    };

    if ((category === 'mcq' || category === 'quiz') && selectedSubject) {
      loadTopics();
    }
  }, [category, selectedSubject, form]);

  const handleCSVChange = (file: File | undefined) => {
    form.setValue('csvFile', file);
  };

  // Visibility settings component
  const VisibilitySettings = () => (
    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
      <h4 className="font-medium">Content Visibility</h4>
      <p className="text-sm text-muted-foreground">
        Choose where this content should appear in the application
      </p>
      
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="showInSubjects"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Show in Subjects</FormLabel>
                <FormDescription>
                  Display this content in the subjects page and subject-wise practice
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="showInSyllabus"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Show in Custom Syllabus</FormLabel>
                <FormDescription>
                  Include this content in the custom syllabus builder
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="showInMockTests"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Show in Mock Tests</FormLabel>
                <FormDescription>
                  Make this content available in timed mock tests
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );

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
          
          <VisibilitySettings />
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
                    <SelectItem value="merit">Merit Based</SelectItem>
                    <SelectItem value="need">Need Based</SelectItem>
                    <SelectItem value="international">International</SelectItem>
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
          
          <VisibilitySettings />
        </div>
      );
      
    case 'mcq':
    case 'quiz':
      return (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.title} value={sub.title}>
                        {sub.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the subject for these {category === 'mcq' ? 'MCQs' : 'quizzes'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
                  disabled={!selectedSubject}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedSubject ? "Select a topic" : "Select a subject first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.title} value={topic.title}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the specific topic within the subject
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="csvFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Upload CSV</FormLabel>
                <FormControl>
                  <CSVUploader 
                    onFileChange={handleCSVChange} 
                    category={category === 'mcq' ? 'mcq' : 'quiz'} 
                  />
                </FormControl>
                <FormDescription>
                  Upload a CSV file containing your {category === 'mcq' ? 'multiple choice questions' : 'quiz questions'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {category === 'quiz' && (
            <>
              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (seconds per question)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 30)} 
                        min={10}
                        max={300}
                      />
                    </FormControl>
                    <FormDescription>
                      How much time students have to answer each question
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks per Question</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} 
                        min={1}
                        max={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          <VisibilitySettings />
        </div>
      );
      
    default:
      return (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="examType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exam Type</FormLabel>
                <FormControl>
                  <Input placeholder="Enter exam type" {...field} />
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
                <FormLabel>Exam Year</FormLabel>
                <FormControl>
                  <Input placeholder="Enter exam year" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <VisibilitySettings />
        </div>
      );
  }
};

export default CategoryFields;
