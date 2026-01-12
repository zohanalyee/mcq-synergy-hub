import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, ExternalLink, X, Loader2 } from "lucide-react";
import { ContentItem } from "@/interfaces/content";
import { useState } from "react";
import { FileUploadService } from "@/services/fileUploadService";
import { toast } from "sonner";

interface FileEditFieldsProps {
  formData: Partial<ContentItem>;
  onChange: (field: keyof ContentItem, value: any) => void;
}

const FileEditFields = ({ formData, onChange }: FileEditFieldsProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(formData.imageUrl || null);
  const [documentName, setDocumentName] = useState<string | null>(
    formData.fileUrl ? 'Current document' : null
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!FileUploadService.validateFile(file, 'image')) {
      return;
    }

    setUploadingImage(true);
    const result = await FileUploadService.uploadImage(file);
    setUploadingImage(false);

    if (result) {
      setImagePreview(result.url);
      onChange('imageUrl', result.url);
      toast.success('Image uploaded successfully');
    }
  };

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!FileUploadService.validateFile(file, 'document')) {
      return;
    }

    setUploadingDocument(true);
    const result = await FileUploadService.uploadDocument(file);
    setUploadingDocument(false);

    if (result) {
      setDocumentName(file.name);
      onChange('fileUrl', result.url);
      toast.success('Document uploaded successfully');
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    onChange('imageUrl', undefined);
  };

  const removeDocument = () => {
    setDocumentName(null);
    onChange('fileUrl', undefined);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Image Upload</Label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          {imagePreview ? (
            <div className="space-y-4">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-40 rounded-md mx-auto"
              />
              <div className="flex justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(imagePreview, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={removeImage}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {uploadingImage ? (
                <>
                  <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
                  <p className="mt-4 text-sm text-muted-foreground">Uploading image...</p>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>Choose Image</span>
                      </Button>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Document Upload</Label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          {documentName ? (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-muted rounded-md">
                <p className="font-medium">{documentName}</p>
                <p className="text-sm text-muted-foreground">Document uploaded</p>
              </div>
              <div className="flex justify-center gap-2">
                {formData.fileUrl && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(formData.fileUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={removeDocument}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {uploadingDocument ? (
                <>
                  <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
                  <p className="mt-4 text-sm text-muted-foreground">Uploading document...</p>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4">
                    <Label htmlFor="document-upload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>Choose Document</span>
                      </Button>
                    </Label>
                    <Input
                      id="document-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleDocumentChange}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    PDF, DOC, DOCX, TXT up to 25MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileEditFields;
