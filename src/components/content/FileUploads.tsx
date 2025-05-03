
import { useState } from "react";
import { FormLabel } from "@/components/ui/form";
import { FileText, Image } from "lucide-react";

interface FileUploadsProps {
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  documentName: string | null;
}

const FileUploads = ({ 
  onImageChange, 
  onDocumentChange, 
  imagePreview, 
  documentName 
}: FileUploadsProps) => {
  return (
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
            onChange={onImageChange}
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
            onChange={onDocumentChange}
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
  );
};

export default FileUploads;
