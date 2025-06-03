
import { useRef, useState } from 'react';
import { Upload, File, Check, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateCSVTemplate } from '@/services/csvProcessorService';

interface CSVUploaderProps {
  onFileChange: (file: File | undefined) => void;
  category: 'mcq' | 'quiz';
}

const CSVUploader = ({ onFileChange, category }: CSVUploaderProps) => {
  const [file, setFile] = useState<File | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      setFile(undefined);
      onFileChange(undefined);
      return;
    }

    setFile(selectedFile);
    setError(null);
    onFileChange(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').slice(0, 3);
      setPreview(lines);
    };
    reader.readAsText(selectedFile);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
      <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-accent/50 transition-colors cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div onClick={handleUploadClick} className="w-full cursor-pointer">
          {file ? (
            <div className="space-y-2">
              <File className="h-8 w-8 mx-auto text-primary" />
              <div className="flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium">{file.name}</p>
              </div>
              <p className="text-xs text-muted-foreground">Click to change file</p>
            </div>
          ) : (
            <div className="text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">
                Click to upload a CSV file with {category === 'mcq' ? 'MCQs' : 'quizzes'}
              </p>
              <p className="text-xs mt-1">
                Use the template format for best results
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview && (
        <div className="border rounded-md p-3">
          <p className="text-sm font-medium mb-2">Preview:</p>
          <div className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto max-h-24">
            {preview.map((line, i) => (
              <div key={i} className="mb-1">{line}</div>
            ))}
            {preview.length === 3 && <div className="text-muted-foreground">...</div>}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
        >
          {file ? 'Change CSV' : 'Select CSV'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
        >
          Download Template
        </Button>
      </div>
    </div>
  );
};

export default CSVUploader;
