
import { useRef, useState } from 'react';
import { Upload, File, Check, AlertCircle, Download, Wand2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentCategory } from '@/interfaces/content';
import { parseCSV, generateCSVTemplate, CSVProcessingResult } from '@/services/csvProcessorService';
import { toast } from 'sonner';

interface EnhancedCSVUploaderProps {
  category: ContentCategory;
  onFilesProcessed: (results: CSVProcessingResult[]) => void;
  allowMultiple?: boolean;
}

const EnhancedCSVUploader = ({ 
  category, 
  onFilesProcessed, 
  allowMultiple = true 
}: EnhancedCSVUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<CSVProcessingResult[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    const processResults: CSVProcessingResult[] = [];

    try {
      for (const file of files) {
        const content = await file.text();
        const result = parseCSV(content, category);
        result.fileName = file.name;
        processResults.push(result);
      }

      setResults(processResults);
      onFilesProcessed(processResults);

      const totalItems = processResults.reduce((sum, r) => sum + r.items.length, 0);
      const totalErrors = processResults.reduce((sum, r) => sum + r.errors.length, 0);

      if (totalErrors > 0) {
        toast.error(`Processed with ${totalErrors} errors`, {
          description: `${totalItems} items processed successfully`
        });
      } else {
        toast.success(`Successfully processed ${totalItems} items`);
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

  const handleAIEnhancement = async () => {
    if (results.length === 0) return;
    
    toast.info('AI enhancement coming soon!', {
      description: 'This will auto-generate tags, SEO fields, and improve content quality'
    });
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
                  Click to change files or drag new ones here
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              
              {results.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIEnhancement}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  AI Enhance
                </Button>
              )}
            </div>

            <Button
              onClick={processFiles}
              disabled={files.length === 0 || processing}
              className="flex items-center gap-2"
            >
              {processing ? 'Processing...' : 'Process Files'}
            </Button>
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
                  <span>{result.fileName}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {result.items.length} items
                    </Badge>
                    {result.errors.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {result.errors.length} errors
                      </Badge>
                    )}
                    {result.warnings.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {result.warnings.length} warnings
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

                {result.warnings.length > 0 && (
                  <Alert className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        {result.warnings.slice(0, 2).map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                        {result.warnings.length > 2 && (
                          <li>... and {result.warnings.length - 2} more warnings</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.items.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Successfully processed {result.items.length} items from {result.fileName}
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
