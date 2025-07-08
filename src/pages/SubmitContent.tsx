
import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import SEOFields from "@/components/SEOFields";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ContentCategory } from "@/interfaces/content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import refactored components
import CategorySelection from "@/components/content/CategorySelection";
import BasicInfoFields from "@/components/content/BasicInfoFields";
import CategoryFields from "@/components/content/CategoryFields";
import FileUploads from "@/components/content/FileUploads";
import SubmitButton from "@/components/content/SubmitButton";

// Import the new submission hook
import { useContentSubmission } from "@/hooks/useContentSubmission";

const SubmitContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
  
  // Use the enhanced submission hook
  const {
    form,
    tags,
    setTags,
    imagePreview,
    documentName,
    isSubmitting,
    handleImageChange,
    handleDocumentChange,
    onSubmit,
  } = useContentSubmission("/");

  const selectedCategory = form.watch("category") as ContentCategory;

  // Show loading state while checking authentication
  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 pt-28 pb-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  // Show auth required message for non-authenticated users
  if (!user) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 pt-28 pb-16">
          <div className="max-w-3xl mx-auto">
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to submit content. You'll be redirected to the authentication page.
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In to Continue
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

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
