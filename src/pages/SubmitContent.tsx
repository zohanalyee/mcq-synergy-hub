
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import SEOFields from "@/components/SEOFields";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ContentSubmission, ContentCategory } from "@/interfaces/content";
import { submitContent } from "@/services/contentService";
import { useUserRole } from "@/contexts/UserRoleContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import refactored components
import CategorySelection from "@/components/content/CategorySelection";
import BasicInfoFields from "@/components/content/BasicInfoFields";
import CategoryFields from "@/components/content/CategoryFields";
import FileUploads from "@/components/content/FileUploads";
import SubmitButton from "@/components/content/SubmitButton";

const SubmitContent = () => {
  const navigate = useNavigate();
  const { toast: hookToast } = useToast();
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
      category: "scholarship",
      tags: [],
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
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
      
      // Submit content with the correct userRole type
      submitContent(fullSubmission, userRole);
      
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
              Share scholarships, job opportunities, past papers, MCQs or quizzes with the community. 
              All submissions will be reviewed before being published.
            </p>
          </div>

          <Card className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Content Type Selection */}
                <CategorySelection form={form} />

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
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
                <div className="flex justify-end pt-4">
                  <SubmitButton isSubmitting={isSubmitting} />
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
