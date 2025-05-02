
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { PlusCircle, X, FileText, Image, Check, Calendar, List, Briefcase, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentSubmission, ContentCategory } from "@/interfaces/content";
import { submitContent } from "@/services/contentService";
import { useUserRole } from "@/contexts/UserRoleContext";

const SubmitContent = () => {
  const navigate = useNavigate();
  const { toast: hookToast } = useToast();
  const { userRole } = useUserRole();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ContentSubmission>({
    defaultValues: {
      title: "",
      description: "",
      category: "scholarship",
      tags: [],
    }
  });

  const selectedCategory = form.watch("category") as ContentCategory;

  // Handle tag input
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle file uploads
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('imageFile', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('documentFile', file);
      setDocumentName(file.name);
    }
  };

  // Form submission
  const onSubmit = async (data: ContentSubmission) => {
    setIsSubmitting(true);
    
    try {
      // Add tags to the submission
      const fullSubmission = { ...data, tags };
      
      // Submit content
      submitContent(fullSubmission, userRole === 'guest' ? 'anonymous' : userRole);
      
      // Show success notification
      toast.success("Content submitted successfully", {
        description: "Your submission will be reviewed by an administrator."
      });
      
      // Redirect after a short delay
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error submitting content:", error);
      hookToast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit content. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Submit Content", href: "/submit-content", isCurrent: true },
  ];

  // Render category-specific fields
  const renderCategoryFields = () => {
    switch (selectedCategory) {
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
      
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <PageBreadcrumb items={breadcrumbItems} />
        
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Submit Content</h1>
            <p className="text-muted-foreground">
              Share scholarships, job opportunities, past papers, or MCQs with the community. 
              All submissions will be reviewed before being published.
            </p>
          </div>

          <Card className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Content Type */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Content Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-wrap gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="scholarship" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center">
                              <GraduationCap className="h-4 w-4 mr-1" />
                              Scholarship
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="job" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              Job
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="mcq" />
                            </FormControl>
                            <FormLabel className="font-normal">MCQ</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="past_paper" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              Past Paper
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a clear, descriptive title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  rules={{ required: "Description is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide detailed information..." 
                          className="min-h-[200px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category-specific fields */}
                {renderCategoryFields()}

                {/* Tags */}
                <div className="space-y-2">
                  <FormLabel htmlFor="tags">Tags</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add relevant tags (press Enter)"
                    />
                    <Button type="button" size="sm" onClick={handleAddTag}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="px-3 py-1">
                          {tag}
                          <button 
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* File Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <FormLabel htmlFor="image">Image (Optional)</FormLabel>
                    <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <label htmlFor="image" className="cursor-pointer w-full block">
                        {imagePreview ? (
                          <div className="space-y-2">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="max-h-40 mx-auto object-contain" 
                            />
                            <p className="text-sm text-primary">Change image</p>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            <Image className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Click to upload an image</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div className="space-y-2">
                    <FormLabel htmlFor="document">Document (Optional)</FormLabel>
                    <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="document"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleDocumentChange}
                      />
                      <label htmlFor="document" className="cursor-pointer w-full block">
                        {documentName ? (
                          <div className="space-y-2">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <p className="text-sm text-primary">{documentName}</p>
                            <p className="text-xs text-muted-foreground">Click to change</p>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Click to upload a document</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="min-w-[150px]" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin">◌</span>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Submit for Review</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default SubmitContent;
