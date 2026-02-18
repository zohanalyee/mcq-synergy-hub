import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Link2,
  Brain,
  Zap,
  FolderOpen,
  ChevronDown,
  Edit,
} from "lucide-react";
import { documentService, Document, UploadProgress, DocumentLMSMetadata } from "@/services/documentService";
import { format } from "date-fns";
import DocumentLMSSelector, { LMSSelection } from "./DocumentLMSSelector";
import { supabase } from "@/integrations/supabase/client";
import { ManualCategorizationDialog } from "./ManualCategorizationDialog";

interface QueueStatus {
  processed_pages: number;
  total_pages: number;
  status: string;
  current_batch: number | null;
  total_batches: number | null;
}

interface DocumentWithLMS extends Document {
  system_name?: string;
  level_name?: string;
  subject_name?: string;
  topic_name?: string;
  queue_status?: QueueStatus | null;
}

interface ChunkPreview {
  index: number;
  content: string;
  preview: string;
}

interface AIMetadata {
  system: string;
  level: string;
  subject: string;
  topic: string;
  confidence: number;
  reasoning?: string;
}

interface SmartUploadFile {
  file: File;
  status: 'pending' | 'analyzing' | 'uploading' | 'linking' | 'processing' | 'complete' | 'error';
  progress: number;
  metadata?: AIMetadata;
  chunks?: ChunkPreview[];
  documentId?: string;
  error?: string;
  requiresApproval?: boolean;
  processingFailed?: boolean;
}

interface FixDialogState {
  open: boolean;
  filename: string;
  metadata: AIMetadata;
  chunks: ChunkPreview[];
  documentId: string;
}

const DocumentLibrary = () => {
  const [documents, setDocuments] = useState<DocumentWithLMS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [generatingMCQs, setGeneratingMCQs] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'smart' | 'manual'>('smart');
  const [smartFiles, setSmartFiles] = useState<Map<string, SmartUploadFile>>(new Map());
  const [retryingProcessing, setRetryingProcessing] = useState<string | null>(null);
  
  // Manual form state
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [lmsSelection, setLmsSelection] = useState<LMSSelection>({});

  // Fix categorization dialog
  const [fixDialog, setFixDialog] = useState<FixDialogState | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.getDocumentsWithLMS();
      
      // Auto-timeout: mark documents stuck in 'processing' for >15 min as 'failed'
      const stuckDocs = docs.filter(d => 
        d.status === 'processing' && 
        (Date.now() - new Date(d.updated_at).getTime()) > 15 * 60 * 1000
      );
      for (const doc of stuckDocs) {
        try {
          await documentService.updateStatus(doc.id, 'failed');
          doc.status = 'failed';
          toast.warning(`"${doc.title}" was stuck processing and marked as failed.`);
        } catch (e) {
          console.error('Failed to auto-timeout document:', doc.id, e);
        }
      }

      // Fetch queue status for documents in processing/pending
      const processingDocIds = docs.filter(d => d.status === 'processing').map(d => d.id);
      if (processingDocIds.length > 0) {
        const { data: queueData } = await supabase
          .from('pdf_processing_queue')
          .select('document_id, processed_pages, total_pages, status, current_batch, total_batches')
          .in('document_id', processingDocIds);
        
        if (queueData) {
          const queueMap = new Map(queueData.map(q => [q.document_id, q as QueueStatus & { document_id: string }]));
          docs.forEach(doc => {
            const qs = queueMap.get(doc.id);
            if (qs) {
              (doc as DocumentWithLMS).queue_status = {
                processed_pages: qs.processed_pages,
                total_pages: qs.total_pages,
                status: qs.status,
                current_batch: qs.current_batch,
                total_batches: qs.total_batches,
              };
            }
          });
        }
      }
      
      setDocuments(docs);
    } catch (error) {
      toast.error("Failed to fetch documents");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== SMART UPLOAD =====
  const readPDFText = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Extract readable text from raw PDF (best effort)
        const cleaned = text
          .replace(/[^\x20-\x7E\n\r]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        resolve(cleaned.substring(0, 3000));
      };
      reader.onerror = () => resolve(file.name);
      reader.readAsText(file);
    });
  };

  const handleSmartUpload = async (files: FileList) => {
    const fileArray = Array.from(files).filter(f => f.type.includes('pdf'));
    if (fileArray.length === 0) {
      toast.error("Please select PDF files only");
      return;
    }

    // Initialize file states
    const newFiles = new Map<string, SmartUploadFile>();
    fileArray.forEach(f => {
      newFiles.set(f.name, { file: f, status: 'pending', progress: 0 });
    });
    setSmartFiles(newFiles);

    // Process each file sequentially
    for (const file of fileArray) {
      const key = file.name;
      
      try {
        // Step 1: Analyze with AI
        setSmartFiles(prev => {
          const next = new Map(prev);
          next.set(key, { ...next.get(key)!, status: 'analyzing', progress: 15 });
          return next;
        });

        const firstPageText = await readPDFText(file);

        const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-pdf-metadata', {
          body: { filename: file.name, first_page_text: firstPageText }
        });

        if (aiError || !aiResult?.success) {
          throw new Error(aiResult?.error || aiError?.message || 'AI categorization failed');
        }

        const metadata = aiResult.metadata;

        setSmartFiles(prev => {
          const next = new Map(prev);
          next.set(key, { ...next.get(key)!, status: 'uploading', progress: 35, metadata });
          return next;
        });

        // Step 2: Upload file to storage
        const fileUrl = await documentService.uploadToStorage(file);

        // Step 3: Create document record
        setSmartFiles(prev => {
          const next = new Map(prev);
          next.set(key, { ...next.get(key)!, progress: 50 });
          return next;
        });

        const nameWithoutExt = file.name.replace(/\.pdf$/i, "");
        const docRecord = await documentService.createDocument(
          nameWithoutExt,
          file.name,
          fileUrl
        );

        // Step 4: Auto-link to LMS hierarchy
        setSmartFiles(prev => {
          const next = new Map(prev);
          next.set(key, { ...next.get(key)!, status: 'linking', progress: 65 });
          return next;
        });

        const { data: linkResult, error: linkError } = await supabase.functions.invoke('auto-link-document', {
          body: { document_id: docRecord.id, metadata }
        });

        if (linkError || !linkResult?.success) {
          console.error('Auto-link failed:', linkResult?.error || linkError);
        }

        // Step 5: Process PDF (text extraction + embeddings) - NON-FATAL
        let processingFailed = false;
        setSmartFiles(prev => {
          const next = new Map(prev);
          next.set(key, { ...next.get(key)!, status: 'processing', progress: 80 });
          return next;
        });

        try {
          await documentService.processDocument(docRecord.id, nameWithoutExt, fileUrl);
        } catch (processError) {
          console.warn('Processing failed (non-fatal):', processError);
          processingFailed = true;
        }

        // Step 6: Fetch chunk previews (only if processing succeeded)
        let chunks: ChunkPreview[] = [];
        if (!processingFailed) {
          try {
            const { data: chunkData } = await supabase
              .from('document_sections')
              .select('section_index, content')
              .eq('document_id', docRecord.id)
              .order('section_index')
              .limit(10);
            chunks = (chunkData || []).map(c => ({
              index: c.section_index,
              content: c.content,
              preview: c.content.substring(0, 200) + (c.content.length > 200 ? '...' : ''),
            }));
          } catch (e) {
            console.error('Failed to fetch chunks:', e);
          }
        }

        // Step 7: Complete (upload + linking succeeded regardless of processing)
        const requiresApproval = linkResult?.requires_approval ?? false;
        setSmartFiles(prev => {
          const next = new Map(prev);
          next.set(key, { 
            ...next.get(key)!, 
            status: 'complete', 
            progress: 100, 
            requiresApproval,
            processingFailed,
            chunks,
            documentId: docRecord.id,
          });
          return next;
        });

        if (processingFailed) {
          toast.warning(`${file.name} uploaded & linked, but text extraction is pending.`, {
            description: 'You can retry processing later using the button below.'
          });
        } else if (requiresApproval) {
          toast.success(`${file.name} uploaded! New categories need review.`, {
            description: `AI: ${metadata.system} → ${metadata.level} → ${metadata.subject} → ${metadata.topic}`
          });
        } else {
          toast.success(`${file.name} uploaded and linked!`);
        }

      } catch (error: any) {
        console.error(`Smart upload error for ${key}:`, error);
        setSmartFiles(prev => {
          const next = new Map(prev);
          next.set(key, { ...next.get(key)!, status: 'error', error: error.message });
          return next;
        });
        toast.error(`Failed: ${file.name}`, { description: error.message });
      }
    }

    await fetchDocuments();
  };

  // ===== MANUAL UPLOAD =====
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
      setUploadProgress({ stage: "uploading", message: "Uploading PDF to storage...", progress: 20 });
      const fileUrl = await documentService.uploadToStorage(selectedFile);

      setUploadProgress({ stage: "uploading", message: "Creating document record...", progress: 40 });
      const lmsMetadata: DocumentLMSMetadata = {
        system_id: lmsSelection.systemId,
        level_id: lmsSelection.levelId,
        subject_id: lmsSelection.subjectId,
        topic_id: lmsSelection.topicId,
      };
      const docRecord = await documentService.createDocument(title.trim(), selectedFile.name, fileUrl, lmsMetadata);
      documentId = docRecord.id;

      setUploadProgress({ stage: "processing", message: "Processing PDF on server...", progress: 60 });
      await documentService.processDocument(docRecord.id, title.trim(), fileUrl);

      setUploadProgress({ stage: "completed", message: "Document processed successfully!", progress: 100 });
      toast.success("Document uploaded and processed successfully!");
      
      setTitle("");
      setSelectedFile(null);
      setLmsSelection({});
      const fileInput = document.getElementById("pdf-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      await fetchDocuments();

    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadProgress({ stage: "failed", message: errorMessage, progress: 0 });
      if (documentId) {
        try { await documentService.updateStatus(documentId, "failed"); } catch {}
      }
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 5000);
    }
  };

  const handleDelete = async (doc: DocumentWithLMS) => {
    try {
      await documentService.deleteDocument(doc.id, doc.file_url);
      toast.success(`"${doc.title}" deleted successfully`);
      await fetchDocuments();
    } catch (error: any) {
      const msg = error?.message || "Unknown error";
      toast.error(`Failed to delete "${doc.title}": ${msg}`);
      console.error("Delete error:", error);
    }
  };

  const handleRetryFromTable = async (doc: DocumentWithLMS) => {
    setRetryingProcessing(doc.id);
    try {
      await documentService.updateStatus(doc.id, 'processing');
      await documentService.processDocument(doc.id, doc.title, doc.file_url);
      toast.info('Processing started in background...');
      
      // Poll for completion
      const poll = async () => {
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 10000));
          const { data } = await supabase
            .from('documents').select('status').eq('id', doc.id).maybeSingle();
          if (data?.status === 'completed') {
            toast.success(`"${doc.title}" processed successfully!`);
            await fetchDocuments();
            setRetryingProcessing(null);
            return;
          }
          if (data?.status === 'failed') {
            throw new Error('Processing failed');
          }
        }
        throw new Error('Processing timed out');
      };
      poll().catch(err => {
        toast.error(`Processing failed: ${err.message}`);
        setRetryingProcessing(null);
        fetchDocuments();
      });
    } catch (error: any) {
      toast.error(`Failed to start processing: ${error?.message || 'Unknown error'}`);
      setRetryingProcessing(null);
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

  const getSmartStatusLabel = (status: SmartUploadFile['status']) => {
    switch (status) {
      case 'analyzing': return 'AI Analyzing...';
      case 'uploading': return 'Uploading...';
      case 'linking': return 'Auto-linking...';
      case 'processing': return 'Processing...';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return 'Pending';
    }
  };

  const handleRetryProcessing = async (filename: string, state: SmartUploadFile) => {
    if (!state.documentId) return;
    setRetryingProcessing(filename);
    
    try {
      const fileUrl = (await supabase.from('documents').select('file_url').eq('id', state.documentId).single()).data?.file_url;
      if (!fileUrl) throw new Error('Document not found');
      
      await documentService.processDocument(state.documentId, filename.replace(/\.pdf$/i, ''), fileUrl);
      
      // Poll for completion
      const pollForStatus = async () => {
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 10000));
          const { data: doc } = await supabase.from('documents').select('status').eq('id', state.documentId!).single();
          if (doc?.status === 'completed') {
            // Fetch chunks
            const { data: chunkData } = await supabase
              .from('document_sections')
              .select('section_index, content')
              .eq('document_id', state.documentId!)
              .order('section_index')
              .limit(10);
            const chunks = (chunkData || []).map(c => ({
              index: c.section_index,
              content: c.content,
              preview: c.content.substring(0, 200) + (c.content.length > 200 ? '...' : ''),
            }));
            
            setSmartFiles(prev => {
              const next = new Map(prev);
              next.set(filename, { ...next.get(filename)!, processingFailed: false, chunks });
              return next;
            });
            toast.success(`PDF processing complete! ${chunkData?.length || 0} chunks created.`);
            setRetryingProcessing(null);
            await fetchDocuments();
            return;
          } else if (doc?.status === 'failed') {
            throw new Error('Processing failed on retry');
          }
        }
        throw new Error('Processing timed out');
      };
      
      pollForStatus().catch(err => {
        console.error('Polling error:', err);
        toast.error('Processing retry failed');
        setRetryingProcessing(null);
      });
      
      toast.info('Processing started! This may take a few minutes...');
    } catch (error) {
      console.error('Retry processing error:', error);
      toast.error('Failed to retry processing');
      setRetryingProcessing(null);
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

      {/* Upload Card with Smart/Manual Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Choose Smart Upload for AI auto-categorization, or Manual Upload for traditional dropdown selection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'smart' | 'manual')}>
            <TabsList className="mb-4">
              <TabsTrigger value="smart" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                🤖 Smart Upload
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Manual Upload
              </TabsTrigger>
            </TabsList>

            {/* Smart Upload Tab */}
            <TabsContent value="smart" className="space-y-4">
              <Alert className="border-primary/30 bg-primary/5">
                <Zap className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong>AI-Powered:</strong> Drop your PDFs and AI will automatically detect Board, Class, Subject & Topic. New categories are hidden from students until you approve them.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={(e) => e.target.files && handleSmartUpload(e.target.files)}
                  className="hidden"
                  id="smart-upload-input"
                />
                <label htmlFor="smart-upload-input" className="cursor-pointer">
                  <Brain className="h-12 w-12 mx-auto mb-3 text-primary opacity-60" />
                  <p className="text-lg font-medium">Drop PDFs or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI will automatically detect Board, Class, Subject & Topic
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports multiple files • Max 25MB each
                  </p>
                </label>
              </div>

              {/* Smart Upload Progress */}
              {smartFiles.size > 0 && (
                <div className="space-y-3">
                  {Array.from(smartFiles.entries()).map(([filename, state]) => (
                    <Card key={filename} className="border-border/50">
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="font-medium text-sm truncate">{filename}</p>
                            {state.metadata && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">{state.metadata.system}</Badge>
                                <span className="text-muted-foreground">→</span>
                                <Badge variant="outline" className="text-xs">{state.metadata.level}</Badge>
                                <span className="text-muted-foreground">→</span>
                                <Badge variant="outline" className="text-xs">{state.metadata.subject}</Badge>
                                <span className="text-muted-foreground">→</span>
                                <Badge variant="outline" className="text-xs">{state.metadata.topic}</Badge>
                                {state.metadata.confidence && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${state.metadata.confidence < 0.7 ? 'text-yellow-500 border-yellow-500/30' : 'text-primary border-primary/30'}`}
                                  >
                                    {(state.metadata.confidence * 100).toFixed(0)}%
                                  </Badge>
                                )}
                              </div>
                            )}
                            {state.error && (
                              <p className="text-xs text-destructive">{state.error}</p>
                            )}
                            {state.status !== 'complete' && state.status !== 'error' && (
                              <Progress value={state.progress} className="h-1.5 mt-1" />
                            )}
                          </div>
                          <div className="shrink-0">
                            {state.status === 'complete' ? (
                              state.processingFailed ? (
                                <Badge className="bg-amber-500/20 text-amber-600">
                                  <AlertTriangle className="h-3 w-3 mr-1" />Text Extraction Pending
                                </Badge>
                              ) : state.requiresApproval ? (
                                <Badge className="bg-yellow-500/20 text-yellow-500">
                                  <AlertTriangle className="h-3 w-3 mr-1" />Needs Review
                                </Badge>
                              ) : (
                                <Badge className="bg-primary/20 text-primary">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />Complete
                                </Badge>
                              )
                            ) : state.status === 'error' ? (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />Error
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                {getSmartStatusLabel(state.status)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Retry Processing Button for failed processing */}
                        {state.status === 'complete' && state.processingFailed && (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryProcessing(filename, state)}
                              disabled={retryingProcessing === filename}
                              className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                            >
                              {retryingProcessing === filename ? (
                                <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Processing...</>
                              ) : (
                                <><RefreshCw className="h-3 w-3 mr-2" />Retry Processing</>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Chunk Preview & Fix Categorization */}
                        {state.status === 'complete' && state.chunks && state.chunks.length > 0 && (
                          <Collapsible className="mt-3">
                            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                              <FileText className="h-4 w-4" />
                              View Content ({state.chunks.length} chunks)
                              <ChevronDown className="h-3 w-3" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3 space-y-3">
                              <ScrollArea className="h-[200px] border rounded-lg p-3">
                                {state.chunks.slice(0, 5).map((chunk) => (
                                  <div key={chunk.index} className="mb-3 pb-3 border-b last:border-0">
                                    <Badge variant="outline" className="text-xs mb-1">
                                      Chunk {chunk.index + 1}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">
                                      {chunk.preview}
                                    </p>
                                  </div>
                                ))}
                                {state.chunks.length > 5 && (
                                  <p className="text-xs text-muted-foreground italic">
                                    +{state.chunks.length - 5} more chunks
                                  </p>
                                )}
                              </ScrollArea>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (state.metadata && state.documentId) {
                                    setFixDialog({
                                      open: true,
                                      filename,
                                      metadata: state.metadata,
                                      chunks: state.chunks || [],
                                      documentId: state.documentId,
                                    });
                                  }
                                }}
                                className={`w-full ${
                                  state.metadata && (state.metadata.system === 'Unknown' || state.metadata.topic === 'Unknown' || state.metadata.confidence < 0.7)
                                    ? 'border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10'
                                    : ''
                                }`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Fix Categorization
                              </Button>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Manual Upload Tab */}
            <TabsContent value="manual" className="space-y-4">
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
                  {fileError && <p className="text-sm text-destructive">{fileError}</p>}
                  {selectedFile && !fileError && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                    </p>
                  )}
                </div>
              </div>

              <DocumentLMSSelector
                value={lmsSelection}
                onChange={setLmsSelection}
                disabled={isUploading}
              />

              {uploadProgress && (
                <Alert
                  variant={uploadProgress.stage === "failed" ? "destructive" : "default"}
                  className={uploadProgress.stage === "completed" ? "border-primary/30 bg-primary/10" : ""}
                >
                  {uploadProgress.stage === "failed" && <AlertTriangle className="h-4 w-4" />}
                  {uploadProgress.stage === "completed" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  {!["failed", "completed"].includes(uploadProgress.stage) && <Loader2 className="h-4 w-4 animate-spin" />}
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
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Upload & Process</>
                )}
              </Button>
            </TabsContent>
          </Tabs>
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
                    <TableCell>
                      {getStatusBadge(doc.status)}
                      {doc.queue_status && doc.queue_status.status !== 'completed' && (
                        <div className="mt-1 space-y-0.5">
                          <Progress 
                            value={(doc.queue_status.processed_pages / doc.queue_status.total_pages) * 100} 
                            className="h-1.5"
                          />
                          <p className="text-xs text-muted-foreground">
                            Page {doc.queue_status.processed_pages}/{doc.queue_status.total_pages}
                            {' '}({Math.round((doc.queue_status.processed_pages / doc.queue_status.total_pages) * 100)}%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ~{Math.ceil((doc.queue_status.total_pages - doc.queue_status.processed_pages) / 50 * 2)} min remaining
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.page_count ? `${doc.page_count} chunks` : "-"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(doc.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* Retry Processing Button */}
                        {(doc.status === 'failed' || doc.status === 'processing') && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRetryFromTable(doc)}
                                  disabled={retryingProcessing === doc.id}
                                >
                                  {retryingProcessing === doc.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4 text-amber-500" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {doc.status === 'failed' ? "Retry Processing" : "Force Retry (currently processing)"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

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
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
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

      {/* Manual Categorization Dialog */}
      {fixDialog && (
        <ManualCategorizationDialog
          open={fixDialog.open}
          onClose={() => setFixDialog(null)}
          filename={fixDialog.filename}
          aiMetadata={fixDialog.metadata}
          chunks={fixDialog.chunks}
          documentId={fixDialog.documentId}
          onConfirm={async (correctedMetadata) => {
            try {
              const { data, error } = await supabase.functions.invoke('auto-link-document', {
                body: { document_id: fixDialog.documentId, metadata: correctedMetadata }
              });
              if (error || !data?.success) {
                throw new Error(data?.error || error?.message || 'Re-linking failed');
              }
              toast.success('Categorization updated successfully!');
              setFixDialog(null);
              await fetchDocuments();
            } catch (err: any) {
              toast.error(`Failed to update: ${err.message}`);
            }
          }}
        />
      )}
    </motion.div>
  );
};

export default DocumentLibrary;
