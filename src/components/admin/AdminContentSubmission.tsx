
import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ContentSubmission, ContentCategory } from "@/interfaces/content";
import { submitContent } from "@/services/contentService";
import { useUserRole } from "@/contexts/UserRoleContext";
import { toast } from "sonner";
import { CSVProcessingResult } from "@/services/csvProcessorService";

// Import form components
import CategorySelection from "@/components/content/CategorySelection";
import CSVCategorySelection from "@/components/admin/CSVCategorySelection";
import BasicInfoFields from "@/components/content/BasicInfoFields";
import CategoryFields from "@/components/content/CategoryFields";
import FileUploads from "@/components/content/FileUploads";
import SubmitButton from "@/components/content/SubmitButton";
import SEOFields from "@/components/SEOFields";
import EnhancedCSVUploader from "@/components/admin/EnhancedCSVUploader";

const AdminContentSubmission = () => {
  const { userRole } = useUserRole();
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [csvResults, setCsvResults] = useState<CSVProcessingResult[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [csvCategory, setCsvCategory] = useState<ContentCategory>("scholarship");
  
  const form = useForm<ContentSubmission>({
    defaultValues: {
      title: "",
      description: "",
      category: "scholarship",
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

  // Handle CSV processing results
  const handleCSVResults = (results: CSVProcessingResult[]) => {
    setCsvResults(results);
    
    const totalItems = results.reduce((sum, r) => sum + r.items.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    
    if (totalErrors === 0 && totalItems > 0) {
      toast.success(`Ready to submit ${totalItems} items`, {
        description: "Review the items below and click 'Submit All' to add them to the system"
      });
    }
  };

  // Submit all CSV items
  const handleBulkSubmit = async () => {
    if (csvResults.length === 0) return;

    setBulkSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const result of csvResults) {
        for (const item of result.items) {
          try {
            await submitContent(item, userRole);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error('Failed to submit item:', error);
          }
        }
      }

      if (errorCount === 0) {
        toast.success(`Successfully submitted ${successCount} items`);
      } else {
        toast.warning(`Submitted ${successCount} items with ${errorCount} errors`);
      }

      // Reset CSV results after successful submission
      setCsvResults([]);
      
    } catch (error) {
      toast.error('Failed to submit items');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Form submission for manual entry
  const onSubmit = async (data: ContentSubmission) => {
    setIsSubmitting(true);
    
    try {
      const fullSubmission = { ...data, tags };
      const newItem = await submitContent(fullSubmission, userRole);
      
      toast.success("Content submitted successfully", {
        description: "Content has been added to the system."
      });
      
      // Reset form
      form.reset({
        title: "",
        description: "",
        category: "scholarship",
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
            Add new content manually or upload CSV files for bulk processing.
          </p>
        </CardHeader>
        
        <CardContent className="px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>
            
            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <CategorySelection form={form} />

                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="seo">SEO Options</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-6">
                      <BasicInfoFields form={form} tags={tags} setTags={setTags} />
                    </TabsContent>

                    <TabsContent value="details" className="space-y-6">
                      <CategoryFields category={selectedCategory} form={form} />
                      
                      <FileUploads 
                        onImageChange={handleImageChange}
                        onDocumentChange={handleDocumentChange}
                        imagePreview={imagePreview}
                        documentName={documentName}
                      />
                    </TabsContent>
                    
                    <TabsContent value="seo" className="space-y-6">
                      <SEOFields form={form} />
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end pt-4 border-t">
                    <SubmitButton isSubmitting={isSubmitting} />
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* CSV Upload Tab */}
            <TabsContent value="csv" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bulk Upload via CSV</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload CSV files to add multiple items at once. Each content type has its own format.
                  </p>
                </div>

                <CSVCategorySelection value={csvCategory} onChange={setCsvCategory} />

                <EnhancedCSVUploader
                  category={csvCategory}
                  onFilesProcessed={handleCSVResults}
                  allowMultiple={true}
                />

                {csvResults.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-medium">Ready for Submission</h4>
                        <p className="text-sm text-muted-foreground">
                          {csvResults.reduce((sum, r) => sum + r.items.length, 0)} items processed and ready to submit
                        </p>
                      </div>
                      <Button
                        onClick={handleBulkSubmit}
                        disabled={bulkSubmitting}
                        className="flex items-center gap-2"
                      >
                        {bulkSubmitting ? 'Submitting...' : 'Submit All Items'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminContentSubmission;
