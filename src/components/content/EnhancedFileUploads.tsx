import { useState } from "react";
import { FormLabel } from "@/components/ui/form";
import { FileText, Image, Upload, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface EnhancedFileUploadsProps {
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  documentName: string | null;
  isUploading?: boolean;
}

const EnhancedFileUploads = ({ 
  onImageChange, 
  onDocumentChange, 
  imagePreview, 
  documentName,
  isUploading = false
}: EnhancedFileUploadsProps) => {
  const [dragActive, setDragActive] = useState<{ image: boolean; document: boolean }>({
    image: false,
    document: false
  });

  const handleDrag = (e: React.DragEvent, type: 'image' | 'document') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'image' | 'document') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Create a proper FileList-like object
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const event = {
        target: { files: dataTransfer.files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      if (type === 'image') {
        onImageChange(event);
      } else {
        onDocumentChange(event);
      }
    }
  };

  const removeImage = () => {
    const input = document.getElementById('image') as HTMLInputElement;
    if (input) {
      input.value = '';
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  };

  const removeDocument = () => {
    const input = document.getElementById('document') as HTMLInputElement;
    if (input) {
      input.value = '';
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Enhanced Image Upload */}
      <div className="space-y-2">
        <FormLabel htmlFor="image">Image (Optional)</FormLabel>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${dragActive.image ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${imagePreview ? 'bg-accent/30' : 'hover:bg-accent/50'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={(e) => handleDrag(e, 'image')}
          onDragLeave={(e) => handleDrag(e, 'image')}
          onDragOver={(e) => handleDrag(e, 'image')}
          onDrop={(e) => handleDrop(e, 'image')}
        >
          <input
            type="file"
            id="image"
            accept="image/*"
            className="hidden"
            onChange={onImageChange}
            disabled={isUploading}
          />
          
          {imagePreview ? (
            <div className="space-y-4">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-32 mx-auto object-contain rounded" 
              />
              <div className="flex justify-center gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(imagePreview, '_blank')}
                  disabled={isUploading}
                >
                  <Image className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={removeImage}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <label htmlFor="image" className="cursor-pointer w-full block">
              <div className="text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm font-medium mb-2">
                  {dragActive.image ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Enhanced Document Upload */}
      <div className="space-y-2">
        <FormLabel htmlFor="document">Document (Optional)</FormLabel>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${dragActive.document ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${documentName ? 'bg-accent/30' : 'hover:bg-accent/50'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={(e) => handleDrag(e, 'document')}
          onDragLeave={(e) => handleDrag(e, 'document')}
          onDragOver={(e) => handleDrag(e, 'document')}
          onDrop={(e) => handleDrop(e, 'document')}
        >
          <input
            type="file"
            id="document"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={onDocumentChange}
            disabled={isUploading}
          />
          
          {documentName ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium text-sm">{documentName}</p>
                <div className="flex items-center justify-center mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">File ready</span>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={removeDocument}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <label htmlFor="document" className="cursor-pointer w-full block">
              <div className="text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm font-medium mb-2">
                  {dragActive.document ? 'Drop document here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs">PDF, DOC, DOCX, TXT up to 25MB</p>
              </div>
            </label>
          )}
        </div>
      </div>
      
      {isUploading && (
        <div className="col-span-full">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uploading files...</span>
              <span className="text-sm text-muted-foreground">Please wait</span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFileUploads;