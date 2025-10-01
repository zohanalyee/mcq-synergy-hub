
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentItem } from "@/interfaces/content";
import BasicEditFields from "./edit-forms/BasicEditFields";
import CategoryEditFields from "./edit-forms/CategoryEditFields";
import SEOEditFields from "./edit-forms/SEOEditFields";
import VisibilityEditFields from "./edit-forms/VisibilityEditFields";
import FileEditFields from "./edit-forms/FileEditFields";

interface EnhancedEditContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentItem: ContentItem | null;
  onSave: (updatedData: Partial<ContentItem>) => void;
}

const EnhancedEditContentDialog = ({ 
  open, 
  onOpenChange, 
  currentItem, 
  onSave 
}: EnhancedEditContentDialogProps) => {
  const [formData, setFormData] = useState<Partial<ContentItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentItem) {
      setFormData({ ...currentItem });
    }
  }, [currentItem]);

  const handleFieldChange = (field: keyof ContentItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentItem) return;
    
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving content:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showVisibilityTab = currentItem && 
    ['mcq', 'quiz', 'past_paper'].includes(currentItem.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {currentItem?.category} Content</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="category">Category Fields</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            {showVisibilityTab && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="basic" className="space-y-4">
              <BasicEditFields 
                formData={formData} 
                onChange={handleFieldChange}
              />
            </TabsContent>

            <TabsContent value="category" className="space-y-4">
              <CategoryEditFields 
                category={currentItem?.category}
                formData={formData} 
                onChange={handleFieldChange}
              />
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <FileEditFields 
                formData={formData} 
                onChange={handleFieldChange}
              />
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <SEOEditFields 
                formData={formData} 
                onChange={handleFieldChange}
              />
            </TabsContent>

            {showVisibilityTab && (
              <TabsContent value="visibility" className="space-y-4">
                <VisibilityEditFields 
                  formData={formData} 
                  onChange={handleFieldChange}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedEditContentDialog;
