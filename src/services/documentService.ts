import { supabase } from "@/integrations/supabase/client";

export interface Document {
  id: string;
  title: string;
  filename: string;
  file_url: string;
  status: "pending" | "processing" | "completed" | "failed";
  page_count: number | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface UploadProgress {
  stage: "uploading" | "processing" | "completed" | "failed";
  message: string;
  progress?: number;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const documentService = {
  // Fetch all documents
  async getDocuments(): Promise<Document[]> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Document[];
  },

  // Upload PDF to storage
  async uploadToStorage(file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `books/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("course_books")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("course_books")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },

  // Create document record
  async createDocument(title: string, filename: string, fileUrl: string): Promise<Document> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("documents")
      .insert({
        title,
        filename,
        file_url: fileUrl,
        status: "pending",
        user_id: userData?.user?.id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Document;
  },

  // Update document status
  async updateStatus(
    documentId: string,
    status: Document["status"],
    pageCount?: number
  ): Promise<void> {
    const updateData: Record<string, unknown> = { status };
    if (pageCount !== undefined) {
      updateData.page_count = pageCount;
    }

    const { error } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", documentId);

    if (error) throw error;
  },

  // Trigger server-side PDF processing (Edge Function handles extraction + embeddings)
  async processDocument(documentId: string, title: string, fileUrl: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke("process-book", {
      body: {
        documentId,
        title,
        fileUrl,
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  },

  // Delete document
  async deleteDocument(documentId: string, fileUrl: string): Promise<void> {
    // Extract file path from URL
    const urlParts = fileUrl.split("/course_books/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from("course_books").remove([filePath]);
    }

    // Delete document sections first (cascade)
    await supabase
      .from("document_sections")
      .delete()
      .eq("document_id", documentId);

    // Delete document record
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (error) throw error;
  },

  // Validate file
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.includes("pdf")) {
      return { valid: false, error: "Only PDF files are allowed" };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      };
    }

    return { valid: true };
  },

  MAX_FILE_SIZE,
};
