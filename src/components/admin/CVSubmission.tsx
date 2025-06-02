
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { submitContent } from "@/services/contentService";
import { useUserRole } from "@/contexts/UserRoleContext";

interface CVSubmissionData {
  title: string;
  description: string;
  candidateName: string;
  experience: string;
  skills: string;
  education: string;
  contactInfo: string;
  tags: string[];
  cvFile?: File;
  extractJobsFromCV: boolean;
  extractMCQsFromCV: boolean;
  extractQuizzesFromCV: boolean;
  showInSubjects: boolean;
  showInSyllabus: boolean;
  showInMockTests: boolean;
}

const CVSubmission = () => {
  const { userRole } = useUserRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [extractionResults, setExtractionResults] = useState<string[]>([]);

  const form = useForm<CVSubmissionData>({
    defaultValues: {
      title: "",
      description: "",
      candidateName: "",
      experience: "entry",
      skills: "",
      education: "",
      contactInfo: "",
      tags: [],
      extractJobsFromCV: true,
      extractMCQsFromCV: false,
      extractQuizzesFromCV: false,
      showInSubjects: true,
      showInSyllabus: false,
      showInMockTests: false,
    }
  });

  const handleCVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('cvFile', file);
      setCvFileName(file.name);
      
      // Simulate automatic extraction
      simulateExtraction(file);
    }
  };

  const simulateExtraction = (file: File) => {
    // Simulate extraction process
    toast.info("Analyzing CV file...", {
      description: "Extracting information from the uploaded CV"
    });

    setTimeout(() => {
      const results = [
        "Extracted candidate name and contact information",
        "Identified relevant job positions and requirements",
        "Generated sample MCQs based on skills mentioned"
      ];
      setExtractionResults(results);
      
      toast.success("CV analysis complete", {
        description: "Information has been automatically extracted"
      });
    }, 2000);
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      const newTags = [...tags, tag.trim()];
      setTags(newTags);
      form.setValue('tags', newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  const onSubmit = async (data: CVSubmissionData) => {
    setIsSubmitting(true);
    
    try {
      const submission = {
        ...data,
        category: 'cv' as const,
        tags,
        documentFile: data.cvFile,
      };

      const newItem = submitContent(submission, userRole);
      
      toast.success("CV submitted successfully", {
        description: "CV has been added to the system with extracted content."
      });
      
      // Reset form
      form.reset();
      setTags([]);
      setCvFileName(null);
      setExtractionResults([]);
      
    } catch (error) {
      console.error("Error submitting CV:", error);
      toast.error("Failed to submit CV", {
        description: "Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" />
            CVs Submission
          </CardTitle>
          <p className="text-muted-foreground">
            Upload CVs with automatic content extraction for jobs, MCQs, and quizzes.
          </p>
        </CardHeader>
        
        <CardContent className="px-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* CV File Upload Section */}
              <div className="space-y-4">
                <FormLabel>CV File Upload</FormLabel>
                <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="cv-file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleCVFileChange}
                  />
                  <label htmlFor="cv-file" className="cursor-pointer w-full block">
                    {cvFileName ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-primary" />
                        <p className="text-lg font-medium text-primary">{cvFileName}</p>
                        <p className="text-sm text-muted-foreground">Click to change file</p>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-lg font-medium">Drop CV file here or click to upload</p>
                        <p className="text-sm">Supports PDF, DOC, DOCX formats</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Extraction Options */}
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h4 className="font-medium">Automatic Extraction Options</h4>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="extractJobsFromCV"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Extract Job Information</FormLabel>
                          <FormDescription>
                            Automatically extract relevant job positions and requirements
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="extractMCQsFromCV"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Generate MCQs from Skills</FormLabel>
                          <FormDescription>
                            Create multiple choice questions based on mentioned skills
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="extractQuizzesFromCV"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Create Quizzes from Experience</FormLabel>
                          <FormDescription>
                            Generate quiz questions based on work experience
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Extraction Results */}
              {extractionResults.length > 0 && (
                <div className="space-y-4 border rounded-md p-4 bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Extraction Results
                  </h4>
                  <ul className="space-y-2">
                    {extractionResults.map((result, index) => (
                      <li key={index} className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        {result}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CV Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter CV title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="candidateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter candidate full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide details about this CV"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Candidate Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level (0-1 years)</SelectItem>
                          <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                          <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                          <SelectItem value="senior">Senior (5-8 years)</SelectItem>
                          <SelectItem value="lead">Lead (8+ years)</SelectItem>
                          <SelectItem value="executive">Executive/Management</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <FormControl>
                        <Input placeholder="Highest qualification or degree" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., React, Node.js, Project Management" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter key skills separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input placeholder="Email, phone, LinkedIn profile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags Section */}
              <div className="space-y-4">
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-primary hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  placeholder="Add tags and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <FormDescription>
                  Add relevant tags to help categorize this CV
                </FormDescription>
              </div>

              {/* Visibility Settings */}
              <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                <h4 className="font-medium">Content Visibility</h4>
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
                            Display this CV in the subjects page
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
                            Include this CV in the custom syllabus builder
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
                            Make this CV available in mock tests
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? "Submitting..." : "Submit CV"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CVSubmission;
