import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Link2
} from "lucide-react";
import { documentService, Document, UploadProgress, DocumentLMSMetadata } from "@/services/documentService";
import { format } from "date-fns";
import DocumentLMSSelector, { LMSSelection } from "./DocumentLMSSelector";
import { supabase } from "@/integrations/supabase/client";

interface DocumentWithLMS extends Document {
  system_name?: string;
  level_name?: string;
  subject_name?: string;
  topic_name?: string;
}

const DocumentLibrary = () => {
  const [documents, setDocuments] = useState<DocumentWithLMS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [generatingMCQs, setGeneratingMCQs] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [lmsSelection, setLmsSelection] = useState<LMSSelection>({});

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.getDocumentsWithLMS();
      setDocuments(docs);
    } catch (error) {
      toast.error("Failed to fetch documents");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = documentService.validateFile(file);
    if (!validation.valid) {
      setFileError(validation.error || "Invalid file");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    
    // Auto-fill title from filename if empty
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.pdf$/i, "");
      setTitle(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error("Please provide a title and select a PDF file");
      return;
    }

    setIsUploading(true);
    let documentId: string | null = null;

    try {
      // Step 1: Upload to storage
      setUploadProgress({
        stage: "uploading",
        message: "Uploading PDF to storage...",
        progress: 20,
      });
      
      const fileUrl = await documentService.uploadToStorage(selectedFile);

      // Step 2: Create document record with LMS metadata
      setUploadProgress({
        stage: "uploading",
        message: "Creating document record...",
        progress: 40,
      });
      
      const lmsMetadata: DocumentLMSMetadata = {
        system_id: lmsSelection.systemId,
        level_id: lmsSelection.levelId,
        subject_id: lmsSelection.subjectId,
        topic_id: lmsSelection.topicId,
      };
      
      const docRecord = await documentService.createDocument(
        title.trim(),
        selectedFile.name,
        fileUrl,
        lmsMetadata
      );
      documentId = docRecord.id;

      // Step 3: Trigger server-side processing
      setUploadProgress({
        stage: "processing",
        message: "Processing PDF on server (extracting text & generating embeddings)...",
        progress: 60,
      });

      await documentService.processDocument(docRecord.id, title.trim(), fileUrl);

      // Step 4: Completed
      setUploadProgress({
        stage: "completed",
        message: "Document processed successfully!",
        progress: 100,
      });

      toast.success("Document uploaded and processed successfully!");
      
      // Reset form
      setTitle("");
      setSelectedFile(null);
      setLmsSelection({});
      const fileInput = document.getElementById("pdf-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      // Refresh documents list
      await fetchDocuments();

    } catch (error: any) {
      console.error("Upload error:", error);
      console.error("Error details:", {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        context: error?.context,
      });
      
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setUploadProgress({
        stage: "failed",
        message: errorMessage,
        progress: 0,
      });

      // Update document status to failed if we created a record
      if (documentId) {
        try {
          await documentService.updateStatus(documentId, "failed");
        } catch {
          // Ignore status update errors
        }
      }

      toast.error(`Upload failed: ${errorMessage}`, {
        description: error?.context?.body ? String(error.context.body).slice(0, 200) : undefined,
      });
    } finally {
      setIsUploading(false);
      // Clear progress after delay
      setTimeout(() => setUploadProgress(null), 5000);
    }
  };

  const handleDelete = async (doc: DocumentWithLMS) => {
    try {
      await documentService.deleteDocument(doc.id, doc.file_url);
      toast.success("Document deleted");
      await fetchDocuments();
    } catch (error) {
      toast.error("Failed to delete document");
      console.error(error);
    }
  };

  const handleGenerateMCQs = async (doc: DocumentWithLMS) => {
    if (!doc.topic_id) {
      toast.error("Document must be linked to a topic to generate MCQs");
      return;
    }

    setGeneratingMCQs(doc.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-from-rag", {
        body: {
          document_id: doc.id,
          topic_id: doc.topic_id,
          subject: doc.subject_name,
          topic: doc.topic_name,
          count: 10,
          difficulty_distribution: { easy: 4, medium: 4, hard: 2 },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Generated ${data.questions_saved || 0} MCQs from document!`);
    } catch (error) {
      console.error("MCQ generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate MCQs");
    } finally {
      setGeneratingMCQs(null);
    }
  };

  const getLMSBadge = (doc: DocumentWithLMS) => {
    if (doc.topic_name) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="gap-1 max-w-32 truncate">
                <Link2 className="h-3 w-3" />
                {doc.topic_name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {doc.system_name} → {doc.level_name} → {doc.subject_name} → {doc.topic_name}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <span className="text-muted-foreground text-sm">Not linked</span>;
  };

  const getStatusBadge = (status: Document["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-primary/20 text-primary">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Document Library
          </h2>
          <p className="text-muted-foreground">
            Upload course books for RAG-based learning assistance
          </p>
        </div>
        <Button variant="outline" onClick={fetchDocuments} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Document
          </CardTitle>
          <CardDescription>
            Upload a PDF document — text extraction and embedding generation happens on the server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                placeholder="Enter document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">PDF File * (Max 25MB)</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="cursor-pointer"
              />
              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}
              {selectedFile && !fileError && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                </p>
              )}
            </div>
          </div>

          {/* LMS Selector */}
          <DocumentLMSSelector
            value={lmsSelection}
            onChange={setLmsSelection}
            disabled={isUploading}
          />

          {/* Upload Progress */}
          {uploadProgress && (
            <Alert
              variant={
                uploadProgress.stage === "failed"
                  ? "destructive"
                  : uploadProgress.stage === "completed"
                  ? "default"
                  : "default"
              }
              className={
                uploadProgress.stage === "completed"
                  ? "border-primary/30 bg-primary/10"
                  : ""
              }
            >
              {uploadProgress.stage === "failed" && (
                <AlertTriangle className="h-4 w-4" />
              )}
              {uploadProgress.stage === "completed" && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
              {!["failed", "completed"].includes(uploadProgress.stage) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <p>{uploadProgress.message}</p>
                  {uploadProgress.progress !== undefined && uploadProgress.stage !== "failed" && (
                    <Progress value={uploadProgress.progress} className="h-2" />
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || isUploading}
            className="w-full md:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Process
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? "s" : ""} in library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first PDF to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>LMS Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>{getLMSBadge(doc)}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>
                      {doc.page_count ? `${doc.page_count} chunks` : "-"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(doc.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* Generate MCQs Button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleGenerateMCQs(doc)}
                                disabled={doc.status !== "completed" || !doc.topic_id || generatingMCQs === doc.id}
                              >
                                {generatingMCQs === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4 text-primary" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {!doc.topic_id 
                                ? "Link document to a topic first"
                                : doc.status !== "completed"
                                ? "Document still processing"
                                : "Generate MCQs from this document"
                              }
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {/* View Document */}
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        
                        {/* Delete Document */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{doc.title}" and all its
                                embeddings. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DocumentLibrary;
