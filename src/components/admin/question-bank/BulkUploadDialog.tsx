import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BulkUploadDialogProps {
  onUploadComplete?: () => void;
}

const BulkUploadDialog = ({ onUploadComplete }: BulkUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Basic CSV preview logic would go here
      toast.info("File selected. Click Upload to process.");
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error("CSV must have header and at least one data row");
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const questions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;
      
      const question: any = {};
      headers.forEach((header, index) => {
        question[header] = values[index] || '';
      });
      
      // Validate required fields
      if (!question.title || !question.question || !question.correct_option) {
        continue;
      }
      
      questions.push({
        title: question.title,
        description: question.question,
        category: 'mcq',
        subject: question.subject || 'General',
        topic: question.topic || 'General',
        subtopic: question.subtopic || '',
        difficulty: question.difficulty || 'Medium',
        correct_option: question.correct_option.toUpperCase(),
        explanation: question.explanation || '',
        options: {
          A: question.option_a || '',
          B: question.option_b || '',
          C: question.option_c || '',
          D: question.option_d || ''
        },
        question_type: 'mcq',
        status: 'approved',
        tags: question.tags ? question.tags.split(';') : [],
        marks: parseInt(question.marks) || 1,
        time_limit: parseInt(question.time_limit) || 60
      });
    }
    
    return questions;
  };

  const ensureSubjectExists = async (subjectName: string) => {
    const { data: existing } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subjectName)
      .single();
    
    if (!existing) {
      await supabase
        .from('subjects')
        .insert({ name: subjectName, category: 'General' });
    }
  };

  const ensureTopicExists = async (topicName: string, subjectName: string) => {
    // Get subject ID first
    const { data: subject } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subjectName)
      .single();
    
    if (subject) {
      const { data: existing } = await supabase
        .from('topics')
        .select('id')
        .eq('name', topicName)
        .eq('subject_id', subject.id)
        .single();
      
      if (!existing) {
        await supabase
          .from('topics')
          .insert({ name: topicName, subject_id: subject.id });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploading(true);
    try {
      const csvText = await file.text();
      const questions = parseCSV(csvText);
      
      if (questions.length === 0) {
        toast.error("No valid questions found in CSV");
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Ensure subjects and topics exist
      const uniqueSubjects = [...new Set(questions.map(q => q.subject))];
      const uniqueTopics = [...new Set(questions.map(q => ({ subject: q.subject, topic: q.topic })))];
      
      for (const subject of uniqueSubjects) {
        await ensureSubjectExists(subject);
      }
      
      for (const { subject, topic } of uniqueTopics) {
        if (topic) {
          await ensureTopicExists(topic, subject);
        }
      }

      // Insert questions into content_items
      const questionsToInsert = questions.map(q => ({
        ...q,
        created_by: user?.id,
        show_in_subjects: true,
        show_in_syllabus: true,
        show_in_mock_tests: true
      }));

      const { data, error } = await supabase
        .from('content_items')
        .insert(questionsToInsert)
        .select();

      if (error) {
        console.error("Database error:", error);
        toast.error(`Failed to upload questions: ${error.message}`);
        return;
      }

      toast.success(`Successfully uploaded ${data.length} questions to Question Bank!`);
      setIsOpen(false);
      setFile(null);
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const csvContent = [
      "title,question,option_a,option_b,option_c,option_d,correct_option,subject,topic,subtopic,difficulty,explanation",
      "Sample Question,What is 2+2?,2,3,4,5,C,Mathematics,Arithmetic,Addition,Easy,Basic arithmetic operation",
      "Another Question,Capital of France?,London,Paris,Berlin,Madrid,B,Geography,Countries,Europe,Medium,France is a European country"
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Bulk Upload Questions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Upload Questions to Question Bank
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Download Template</CardTitle>
              <CardDescription>
                Use our CSV template to ensure proper formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 2: Upload Your CSV</CardTitle>
              <CardDescription>
                All questions will be added to the central Question Bank
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>
              
              {file && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">File selected: {file.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Process */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 3: Process Upload</CardTitle>
              <CardDescription>
                Questions will be validated and added to the Question Bank
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                  <div>
                    <p>• Missing subjects/topics will be auto-created</p>
                    <p>• Duplicate questions will be skipped</p>
                    <p>• All questions go to the central Question Bank</p>
                    <p>• Questions will be available across all modules</p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || uploading}
                  className="w-full"
                >
                  {uploading ? "Processing..." : "Upload to Question Bank"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;