
import { ContentItem } from "@/interfaces/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { useState, useEffect } from "react";

interface EditContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentItem: ContentItem | null;
  onSave: (title: string, description: string) => void;
}

const EditContentDialog: React.FC<EditContentDialogProps> = ({ 
  open, 
  onOpenChange, 
  currentItem, 
  onSave 
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (currentItem) {
      setTitle(currentItem.title);
      setDescription(currentItem.description);
    }
  }, [currentItem]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
          <DialogDescription>
            Make changes to the selected content item.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          
          {currentItem?.imageUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Image Preview</label>
              <div className="border rounded-md p-2">
                <img 
                  src={currentItem.imageUrl} 
                  alt="Content" 
                  className="max-h-40 mx-auto object-contain" 
                />
              </div>
            </div>
          )}
          
          {currentItem?.fileUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Attached Document</label>
              <div className="border rounded-md p-2 flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <a href={currentItem.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  View Document
                </a>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(title, description)}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditContentDialog;
