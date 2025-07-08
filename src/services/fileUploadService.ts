import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FileUploadResult {
  url: string;
  path: string;
}

export class FileUploadService {
  // Upload file to Supabase Storage
  static async uploadFile(file: File, bucket: string = 'content-files'): Promise<FileUploadResult | null> {
    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      console.log(`Uploading file: ${file.name} to ${bucket}/${filePath}`);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('File upload error:', error);
        toast.error('File upload failed', {
          description: `Failed to upload ${file.name}: ${error.message}`,
          duration: 4000,
        });
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log(`File uploaded successfully: ${publicUrl}`);

      return {
        url: publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Upload failed', {
        description: 'Failed to upload file. Please try again.',
        duration: 4000,
      });
      return null;
    }
  }

  // Upload image file
  static async uploadImage(file: File): Promise<FileUploadResult | null> {
    return this.uploadFile(file, 'content-files');
  }

  // Upload document file
  static async uploadDocument(file: File): Promise<FileUploadResult | null> {
    return this.uploadFile(file, 'content-files');
  }

  // Validate file type and size
  static validateFile(file: File, type: 'image' | 'document'): boolean {
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 25 * 1024 * 1024; // 10MB for images, 25MB for docs
    
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: `File size must be less than ${type === 'image' ? '10MB' : '25MB'}`,
        duration: 4000,
      });
      return false;
    }

    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const documentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

    const allowedTypes = type === 'image' ? imageTypes : documentTypes;
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: `Please select a valid ${type} file`,
        duration: 4000,
      });
      return false;
    }

    return true;
  }
}