import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentSubmission, ContentCategory } from "@/interfaces/content";
import { submitContent } from "@/services/contentService";
import { useUserRole } from "@/contexts/UserRoleContext";
import { toast } from "sonner";

// Import form components
import CategorySelection from "@/components/content/CategorySelection";
import BasicInfoFields from "@/components/content/BasicInfoFields";
import CategoryFields from "@/components/content/CategoryFields";
import FileUploads from "@/components/content/FileUploads";
import SubmitButton from "@/components/content/SubmitButton";
import SEOFields from "@/components/SEOFields";

const AdminContentSubmission = () => {
  const { userRole } = useUserRole();
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  const form = useForm<ContentSubmission>({
    defaultValues: {
      title: "",
      description: "",
      category: "cv", // Changed default to cv
      tags: [],
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      showInSubjects: true,
      showInSyllabus: false,
      showInMockTests: false,
    }
  });

  const selectedCategory = form.watch("category") as ContentCategory;

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
      
      // Submit content with admin approval
      const newItem = submitContent(fullSubmission, userRole);
      
      // Auto-approve since it's submitted by admin
      // In a real app, you might want to still have a review process
      
      // Show success notification
      toast.success("Content submitted successfully", {
        description: "Content has been added to the system."
      });
      
      // Reset form
      form.reset({
        title: "",
        description: "",
        category: "cv", // Changed default to cv
        tags: [],
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        showInSubjects: true,
        showInSyllabus: false,
        showInMockTests: false,
      });
      setTags([]);
      setImagePreview(null);
      setDocumentName(null);
      setActiveTab("basic");
      
    } catch (error) {
      console.error("Error submitting content:", error);
      toast.error("Failed to submit content", {
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
          <CardTitle className="text-2xl">Submit Content</CardTitle>
          <p className="text-muted-foreground">
            Add new CVs, scholarships, jobs, MCQs, quizzes, and past papers to the system.
          </p>
        </CardHeader>
        
        <CardContent className="px-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Content Type Selection */}
              <CategorySelection form={form} />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="seo">SEO Options</TabsTrigger>
                </TabsList>
                
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <BasicInfoFields form={form} tags={tags} setTags={setTags} />
                </TabsContent>

                {/* Category-specific Details Tab */}
                <TabsContent value="details" className="space-y-6">
                  <CategoryFields category={selectedCategory} form={form} />
                  
                  {/* File Upload Section */}
                  <FileUploads 
                    onImageChange={handleImageChange}
                    onDocumentChange={handleDocumentChange}
                    imagePreview={imagePreview}
                    documentName={documentName}
                  />
                </TabsContent>
                
                {/* SEO Options Tab */}
                <TabsContent value="seo" className="space-y-6">
                  <SEOFields form={form} />
                </TabsContent>
              </Tabs>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t">
                <SubmitButton isSubmitting={isSubmitting} />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminContentSubmission;
