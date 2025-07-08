import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { ContentSubmission, ContentCategory } from "@/interfaces/content";
import { submitContent } from "@/services/contentService";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploadService } from "@/services/fileUploadService";
import { FormValidationService } from "@/utils/formValidation";

export interface UseContentSubmissionReturn {
  form: any;
  tags: string[];
  setTags: (tags: string[]) => void;
  imagePreview: string | null;
  documentName: string | null;
  isSubmitting: boolean;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (data: ContentSubmission) => Promise<void>;
  validateForm: () => boolean;
  resetForm: () => void;
}

export const useContentSubmission = (redirectPath?: string): UseContentSubmissionReturn => {
  const navigate = useNavigate();
  const { userRole } = useUserRole();
  const { user, loading } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  
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

  // Validate authentication
  const validateAuth = (): boolean => {
    if (loading) {
      toast.error("Please wait", {
        description: "Checking authentication status...",
        duration: 2000,
      });
      return false;
    }

    if (!user) {
      toast.error("Authentication required", {
        description: "Please sign in to submit content.",
        duration: 4000,
      });
      // Redirect to auth page after a delay
      setTimeout(() => navigate("/auth"), 1500);
      return false;
    }

    return true;
  };

  // Enhanced form validation
  const validateForm = (): boolean => {
    const data = form.getValues();
    const validationErrors = FormValidationService.validateSubmission(data);

    if (validationErrors.length > 0) {
      const errorMessage = FormValidationService.formatValidationErrors(validationErrors);
      toast.error("Validation Error", {
        description: errorMessage,
        duration: 4000,
      });
      return false;
    }

    return true;
  };

  // Handle file uploads
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!FileUploadService.validateFile(file, 'image')) {
        return;
      }
      
      setImageFile(file);
      form.setValue('imageFile', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!FileUploadService.validateFile(file, 'document')) {
        return;
      }
      
      setDocumentFile(file);
      form.setValue('documentFile', file);
      setDocumentName(file.name);
    }
  };

  // Handle file uploads before submission
  const uploadFiles = async (): Promise<{ imageUrl?: string; fileUrl?: string }> => {
    const uploads: { imageUrl?: string; fileUrl?: string } = {};

    try {
      // Upload image if present
      if (imageFile) {
        const imageResult = await FileUploadService.uploadImage(imageFile);
        if (imageResult) {
          uploads.imageUrl = imageResult.url;
        } else {
          throw new Error('Image upload failed');
        }
      }

      // Upload document if present
      if (documentFile) {
        const docResult = await FileUploadService.uploadDocument(documentFile);
        if (docResult) {
          uploads.fileUrl = docResult.url;
        } else {
          throw new Error('Document upload failed');
        }
      }

      return uploads;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload files');
    }
  };

  // Form submission with comprehensive error handling
  const onSubmit = async (data: ContentSubmission) => {
    // Validate authentication first
    if (!validateAuth()) {
      return;
    }

    // Validate form data
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload files first if any
      const fileUploads = await uploadFiles();
      
      // Prepare submission with file URLs and tags
      const fullSubmission: ContentSubmission = { 
        ...data, 
        tags,
        ...fileUploads
      };
      
      console.log('Submitting content:', fullSubmission);
      
      // Submit content
      const result = await submitContent(fullSubmission, userRole);
      
      if (result) {
        toast.success("Content submitted successfully!", {
          description: "Your submission will be reviewed by an administrator.",
          duration: 3000,
        });
        
        // Reset form and redirect
        resetForm();
        if (redirectPath) {
          setTimeout(() => navigate(redirectPath), 1500);
        }
      } else {
        throw new Error('Submission returned no result');
      }
      
    } catch (error: any) {
      console.error("Error submitting content:", error);
      
      // Provide specific error messages
      let errorMessage = "Failed to submit content. Please try again.";
      let errorDescription = "";
      
      if (error?.message?.includes('auth')) {
        errorMessage = "Authentication error";
        errorDescription = "Please sign in and try again.";
      } else if (error?.message?.includes('network')) {
        errorMessage = "Network error";
        errorDescription = "Please check your connection and try again.";
      } else if (error?.message?.includes('validation')) {
        errorMessage = "Validation error";
        errorDescription = "Please check your input and try again.";
      } else if (error?.message?.includes('upload')) {
        errorMessage = "File upload failed";
        errorDescription = "Please try uploading your files again.";
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form and state
  const resetForm = () => {
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
    setImageFile(null);
    setDocumentFile(null);
  };

  return {
    form,
    tags,
    setTags,
    imagePreview,
    documentName,
    isSubmitting,
    handleImageChange,
    handleDocumentChange,
    onSubmit,
    validateForm,
    resetForm,
  };
};