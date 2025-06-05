
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentCategory } from "@/interfaces/content";
import CSVUploader from "@/components/CSVUploader";
import { useEffect, useState } from "react";
import { getSubjects } from "@/services/adminService";
import { getTopics } from "@/services/adminService";

interface MCQQuizFieldsProps {
  category: ContentCategory;
  form: any;
}

const MCQQuizFields = ({ category, form }: MCQQuizFieldsProps) => {
  const [subjects, setSubjects] = useState<{ title: string }[]>([]);
  const [topics, setTopics] = useState<{ title: string }[]>([]);
  const selectedSubject = form.watch('subject') || '';

  useEffect(() => {
    const loadSubjects = () => {
      const subjects = getSubjects();
      setSubjects(subjects);
    };
    
    loadSubjects();
  }, []);

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

    if (selectedSubject) {
      loadTopics();
    }
  }, [selectedSubject, form]);

  const handleCSVChange = (file: File | undefined) => {
    form.setValue('csvFile', file);
  };

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
    </div>
  );
};

export default MCQQuizFields;
