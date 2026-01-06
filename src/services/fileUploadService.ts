import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FileUploadResult {
  url: string;
  path: string;
}

export class FileUploadService {
  // Get current user ID for file path organization
  private static async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  // Upload file to Supabase Storage with user-scoped path
  static async uploadFile(file: File, bucket: string = 'content-files'): Promise<FileUploadResult | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        toast.error('Authentication required', {
          description: 'You must be logged in to upload files.',
          duration: 4000,
        });
        return null;
      }

      // Generate unique file name with user folder for RLS enforcement
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      // Path structure: {userId}/uploads/{fileName} - userId first for RLS policy
      const filePath = `${userId}/uploads/${fileName}`;

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

      // Get signed URL (bucket is now private)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Failed to generate signed URL:', signedUrlError);
        // Return path anyway so URL can be regenerated later
        return {
          url: '',
          path: filePath
        };
      }

      console.log(`File uploaded successfully with signed URL`);

      return {
        url: signedUrlData.signedUrl,
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

  // Get a fresh signed URL for an existing file
  static async getSignedUrl(filePath: string, bucket: string = 'content-files', expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error || !data?.signedUrl) {
        console.error('Failed to generate signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
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