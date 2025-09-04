import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseCSV } from "@/services/csvProcessorService";

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

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploading(true);
    try {
      // Read the CSV file
      const csvText = await file.text();
      
      // Parse CSV data
      const result = await parseCSV(csvText, "mcq");
      
      if (result.errors.length > 0) {
        toast.error(`CSV has ${result.errors.length} errors. Please fix them and try again.`);
        console.error("CSV errors:", result.errors);
        return;
      }

      // Process each question and insert into content_items
      let successCount = 0;
      let failureCount = 0;

      for (const item of result.items) {
        try {
          // Ensure we have all required MCQ fields
          if (!item.description || !item.options) {
            failureCount++;
            continue;
          }

          const { error } = await supabase
            .from('content_items')
            .insert({
              title: item.title || `MCQ: ${item.description?.substring(0, 50)}...`,
              description: item.description,
              options: item.options,
              correct_option: item.correctOption,
              subject: item.subject,
              topic: item.topic,
              difficulty: item.difficulty,
              explanation: item.explanation,
              category: 'mcq',
              status: 'approved',
              marks: item.marks || 1,
              time_limit: item.timeLimit || 60,
              created_by: (await supabase.auth.getUser()).data.user?.id
            });

          if (error) {
            console.error("Error inserting question:", error);
            failureCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error("Error processing question:", error);
          failureCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} questions to Question Bank!`);
      }
      
      if (failureCount > 0) {
        toast.warning(`${failureCount} questions failed to upload. Check console for details.`);
      }

      if (result.warnings.length > 0) {
        toast.info(`${result.warnings.length} warnings during processing.`);
      }

      setIsOpen(false);
      setFile(null);
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload questions. Please check the file format.");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const csvContent = [
      "title,question,option_a,option_b,option_c,option_d,correct_option,subject,topic,subtopic,difficulty,explanation,marks,time_limit",
      "Basic Math Question,What is 2+2?,2,3,4,5,C,Mathematics,Arithmetic,Addition,Easy,Basic arithmetic operation,1,60",
      "Geography Question,What is the capital of France?,London,Paris,Berlin,Madrid,B,Geography,Countries,Europe,Medium,France is a European country,1,90",
      "Science Question,What is the chemical symbol for water?,H2O,CO2,NaCl,O2,A,Chemistry,Basic Chemistry,Chemical Formulas,Easy,Water has the chemical formula H2O,2,45"
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
      <DialogContent className="max-w-2xl">
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
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-800 dark:text-green-200">File selected: {file.name}</span>
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