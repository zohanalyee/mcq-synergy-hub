
import { useRef, useState } from 'react';
import { Upload, File, Check, AlertCircle, Download, Wand2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentCategory } from '@/interfaces/content';
import { processAndSubmitCSV, generateCSVTemplate, CSVProcessingResult } from '@/services/enhancedCSVProcessor';
import { useUserRole } from '@/contexts/UserRoleContext';
import { toast } from 'sonner';

interface EnhancedCSVUploaderProps {
  category: ContentCategory;
  onFilesProcessed?: (results: CSVProcessingResult[]) => void;
  allowMultiple?: boolean;
  autoSubmit?: boolean;
}

const EnhancedCSVUploader = ({ 
  category, 
  onFilesProcessed,
  allowMultiple = true,
  autoSubmit = true
}: EnhancedCSVUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<CSVProcessingResult[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userRole } = useUserRole();

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const csvFiles = Array.from(selectedFiles).filter(
      file => file.type === 'text/csv' || file.name.endsWith('.csv')
    );

    if (csvFiles.length === 0) {
      toast.error('Please select valid CSV files');
      return;
    }

    if (!allowMultiple && csvFiles.length > 1) {
      toast.error('Please select only one CSV file');
      return;
    }

    setFiles(csvFiles);
    setResults([]);

    // Auto-process if enabled
    if (autoSubmit) {
      processFiles(csvFiles);
    }
  };

  const processFiles = async (filesToProcess?: File[]) => {
    const targetFiles = filesToProcess || files;
    if (targetFiles.length === 0) return;

    setProcessing(true);
    const processResults: CSVProcessingResult[] = [];

    try {
      for (const file of targetFiles) {
        const content = await file.text();
        const result = await processAndSubmitCSV(content, category, userRole, file.name);
        processResults.push(result);
      }

      setResults(processResults);
      if (onFilesProcessed) {
        onFilesProcessed(processResults);
      }

      const totalSuccess = processResults.reduce((sum, r) => sum + (r.successCount || 0), 0);
      const totalErrors = processResults.reduce((sum, r) => sum + r.errors.length, 0);

      if (totalErrors > 0) {
        toast.error(`Processed with ${totalErrors} errors`, {
          description: `${totalSuccess} items saved successfully`
        });
      } else {
        toast.success(`Successfully processed and saved ${totalSuccess} items`);
      }

    } catch (error) {
      toast.error('Failed to process CSV files');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files);
  };

  const downloadTemplate = () => {
    const template = generateCSVTemplate(category);
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV Upload for {category.charAt(0).toUpperCase() + category.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple={allowMultiple}
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
            />
            
            {files.length > 0 ? (
              <div className="space-y-2">
                <File className="h-8 w-8 mx-auto text-primary" />
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {autoSubmit ? 'Processing automatically...' : 'Click to change files'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Drop CSV files here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {allowMultiple ? 'Multiple files supported' : 'Single file only'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>

            {!autoSubmit && (
              <Button
                onClick={() => processFiles()}
                disabled={files.length === 0 || processing}
                className="flex items-center gap-2"
              >
                {processing ? 'Processing...' : 'Process & Submit'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{result.fileName || `File ${index + 1}`}</span>
                  <div className="flex gap-2">
                    {result.successCount && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        {result.successCount} saved
                      </Badge>
                    )}
                    {result.errors.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {result.errors.length} errors
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {result.errors.length > 0 && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errors Found</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        {result.errors.slice(0, 3).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {result.errors.length > 3 && (
                          <li>... and {result.errors.length - 3} more errors</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.successCount && result.successCount > 0 && (
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Successfully saved {result.successCount} items to database
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedCSVUploader;
