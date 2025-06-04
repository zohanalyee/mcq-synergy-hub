
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ContentSubmission, ContentCategory } from "@/interfaces/content";
import { submitContent } from "@/services/contentService";
import { useUserRole } from "@/contexts/UserRoleContext";
import { toast } from "sonner";
import { Plus } from "lucide-react";

// Import form components
import BasicInfoFields from "@/components/content/BasicInfoFields";
import CategoryFields from "@/components/content/CategoryFields";
import FileUploads from "@/components/content/FileUploads";
import SEOFields from "@/components/SEOFields";

interface QuickSubmissionDialogProps {
  category: ContentCategory;
  buttonText?: string;
}

const QuickSubmissionDialog = ({ category, buttonText }: QuickSubmissionDialogProps) => {
  const { userRole } = useUserRole();
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  
  const form = useForm<ContentSubmission>({
    defaultValues: {
      title: "",
      description: "",
      category: category,
      tags: [],
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
    }
  });

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

  const onSubmit = async (data: ContentSubmission) => {
    setIsSubmitting(true);
    
    try {
      const fullSubmission = { ...data, tags, category };
      const newItem = submitContent(fullSubmission, userRole);
      
      toast.success(`${category} submitted successfully`, {
        description: "Content has been added and will appear on the page."
      });
      
      // Reset form and close dialog
      form.reset({
        title: "",
        description: "",
        category: category,
        tags: [],
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
      });
      setTags([]);
      setImagePreview(null);
      setDocumentName(null);
      setOpen(false);
      
      // Refresh the page to show new content
      window.location.reload();
      
    } catch (error) {
      console.error("Error submitting content:", error);
      toast.error("Failed to submit content", {
        description: "Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryDisplayName = category === 'scholarship' ? 'Scholarship' : 'Job';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex gap-2">
          <Plus className="h-4 w-4" />
          {buttonText || `Add ${categoryDisplayName}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New {categoryDisplayName}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BasicInfoFields form={form} tags={tags} setTags={setTags} />
            
            <CategoryFields category={category} form={form} />
            
            <FileUploads 
              onImageChange={handleImageChange}
              onDocumentChange={handleDocumentChange}
              imagePreview={imagePreview}
              documentName={documentName}
            />
            
            <SEOFields form={form} />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : `Submit ${categoryDisplayName}`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSubmissionDialog;
