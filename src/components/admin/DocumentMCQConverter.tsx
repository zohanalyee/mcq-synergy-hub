import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, Save, Trash2, Eye, EyeOff } from "lucide-react";

interface ExtractedQuestion {
  id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_option: string;
  explanation: string;
  subject_id: string | null;
  suggested_subject: string;
  topic_id: string | null;
  suggested_topic: string;
  difficulty: string;
  verified: boolean;
  verification_note: string;
  confidence: number;
  selected: boolean;
}

interface ConversionResult {
  metadata: {
    total_questions: number;
    source_type: string;
    detected_subject: string | null;
    extraction_confidence: number;
  };
  questions: ExtractedQuestion[];
  summary: {
    total: number;
    verified_correct: number;
    flagged: number;
    easy: number;
    medium: number;
    hard: number;
  };
}

type Stage = "idle" | "uploading" | "processing" | "done" | "error";

const DocumentMCQConverter = () => {
  const [stage, setStage] = useState<Stage>("idle");
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large", { description: "Maximum 20MB allowed." });
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt", "docx", "doc"].includes(ext || "")) {
      toast.error("Unsupported format", { description: "Use PDF, DOCX, or TXT files." });
      return;
    }

    setStage("uploading");

    try {
      // For TXT files, read directly
      if (ext === "txt") {
        const text = await file.text();
        await processText(text, "txt");
        return;
      }

      // For PDF/DOCX, upload to storage then pass URL
      const filePath = `temp-mcq/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("course_books")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("course_books")
        .getPublicUrl(filePath);

      // Since course_books is private, get signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from("course_books")
        .createSignedUrl(filePath, 600);

      if (signedError) throw signedError;

      await processFile(signedData.signedUrl, ext || "pdf");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Upload failed", { description: err.message });
      setStage("error");
    }
  };

  const processText = async (text: string, sourceType: string) => {
    setStage("processing");
    try {
      const { data, error } = await supabase.functions.invoke("convert-document-mcqs", {
        body: { raw_text: text, source_type: sourceType },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const enriched = (data.questions || []).map((q: any) => ({ ...q, selected: true }));
      setResult(data);
      setQuestions(enriched);
      setStage("done");
      toast.success(`Extracted ${enriched.length} questions!`);
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error("Processing failed", { description: err.message });
      setStage("error");
    }
  };

  const processFile = async (fileUrl: string, sourceType: string) => {
    setStage("processing");
    try {
      const { data, error } = await supabase.functions.invoke("convert-document-mcqs", {
        body: { file_url: fileUrl, source_type: sourceType },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const enriched = (data.questions || []).map((q: any) => ({ ...q, selected: true }));
      setResult(data);
      setQuestions(enriched);
      setStage("done");
      toast.success(`Extracted ${enriched.length} questions!`);
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error("Processing failed", { description: err.message });
      setStage("error");
    }
  };

  const handlePasteSubmit = () => {
    if (rawText.trim().length < 50) {
      toast.error("Text too short", { description: "Paste at least 50 characters of MCQ content." });
      return;
    }
    processText(rawText, "txt");
  };

  const toggleQuestion = (id: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q)));
  };

  const toggleAll = (checked: boolean) => {
    setQuestions((prev) => prev.map((q) => ({ ...q, selected: checked })));
  };

  const saveToQuestionBank = async () => {
    const selected = questions.filter((q) => q.selected);
    if (selected.length === 0) {
      toast.error("No questions selected");
      return;
    }

    setSaving(true);
    let savedCount = 0;
    const errors: string[] = [];

    for (const q of selected) {
      try {
        const { error } = await supabase.from("content_items").insert({
          title: q.question,
          description: q.question,
          category: "mcq",
          status: "approved",
          subject: q.suggested_subject || null,
          topic: q.suggested_topic || null,
          topic_id: q.topic_id || null,
          difficulty: q.difficulty || "Medium",
          options: q.options,
          correct_option: q.correct_option,
          explanation: q.explanation || null,
          source_type: "document_conversion",
          show_in_subjects: true,
          show_in_syllabus: true,
          show_in_mock_tests: true,
        });
        if (error) {
          errors.push(error.message);
        } else {
          savedCount++;
        }
      } catch (err: any) {
        errors.push(err.message);
      }
    }

    setSaving(false);

    if (savedCount > 0) {
      toast.success(`Saved ${savedCount} questions to Question Bank!`);
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} questions failed to save`);
    }
  };

  const reset = () => {
    setStage("idle");
    setRawText("");
    setResult(null);
    setQuestions([]);
    setExpandedQ(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedCount = questions.filter((q) => q.selected).length;
  const flaggedCount = questions.filter((q) => !q.verified).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document → MCQ Converter
          </CardTitle>
          <CardDescription>
            Upload a document or paste text containing MCQs. AI will extract, classify, and verify all questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(stage === "idle" || stage === "error") && (
            <div className="space-y-6">
              {/* File Upload */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Drop a file or click to upload (PDF, DOCX, TXT — max 20MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Paste Text */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Paste MCQ text here... (e.g. Q1. What is...? a) ... b) ... c) ... d) ... Answer: b)"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <Button onClick={handlePasteSubmit} disabled={rawText.trim().length < 50}>
                  Extract MCQs from Text
                </Button>
              </div>

              {stage === "error" && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  Processing failed. Please try again with different content.
                </div>
              )}
            </div>
          )}

          {(stage === "uploading" || stage === "processing") && (
            <div className="flex flex-col items-center py-12 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">
                  {stage === "uploading" ? "Uploading document..." : "AI is extracting & classifying MCQs..."}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stage === "processing" && "This may take 30-60 seconds for large documents."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {stage === "done" && result && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Extraction Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Total: {questions.length}
                </Badge>
                <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-sm px-3 py-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified: {questions.length - flaggedCount}
                </Badge>
                {flaggedCount > 0 && (
                  <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30 text-sm px-3 py-1">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Flagged: {flaggedCount}
                  </Badge>
                )}
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Easy: {result.summary?.easy || 0}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Medium: {result.summary?.medium || 0}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Hard: {result.summary?.hard || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Question Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Extracted Questions ({selectedCount} selected)</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={reset}>
                    <Trash2 className="h-4 w-4 mr-1" /> Clear
                  </Button>
                  <Button size="sm" onClick={saveToQuestionBank} disabled={saving || selectedCount === 0}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save {selectedCount} to Question Bank
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedCount === questions.length}
                          onCheckedChange={(c) => toggleAll(!!c)}
                        />
                      </TableHead>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((q, idx) => (
                      <>
                        <TableRow
                          key={q.id}
                          className={!q.verified ? "bg-yellow-500/5" : ""}
                        >
                          <TableCell>
                            <Checkbox checked={q.selected} onCheckedChange={() => toggleQuestion(q.id)} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm">{q.question}</TableCell>
                          <TableCell className="text-sm">{q.suggested_subject || "—"}</TableCell>
                          <TableCell className="text-sm">{q.suggested_topic || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                q.difficulty === "Easy"
                                  ? "border-green-500/50 text-green-700"
                                  : q.difficulty === "Hard"
                                  ? "border-red-500/50 text-red-700"
                                  : "border-yellow-500/50 text-yellow-700"
                              }
                            >
                              {q.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {q.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                            >
                              {expandedQ === q.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedQ === q.id && (
                          <TableRow key={`${q.id}-detail`}>
                            <TableCell colSpan={8} className="bg-muted/30">
                              <div className="p-3 space-y-2 text-sm">
                                <p className="font-medium">{q.question}</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(q.options).map(([key, val]) => (
                                    <div
                                      key={key}
                                      className={`p-2 rounded border ${
                                        key === q.correct_option
                                          ? "border-green-500 bg-green-500/10 font-medium"
                                          : "border-border"
                                      }`}
                                    >
                                      <span className="text-muted-foreground mr-1">{key})</span> {val}
                                    </div>
                                  ))}
                                </div>
                                {q.explanation && (
                                  <p className="text-muted-foreground">
                                    <span className="font-medium">Explanation:</span> {q.explanation}
                                  </p>
                                )}
                                {!q.verified && q.verification_note && (
                                  <p className="text-yellow-700 bg-yellow-500/10 p-2 rounded">
                                    ⚠️ {q.verification_note}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Confidence: {Math.round((q.confidence || 0) * 100)}%
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DocumentMCQConverter;
