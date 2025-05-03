
import { useRef, useState } from 'react';
import { Upload, File, Check, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

    // Check file type
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      setFile(undefined);
      onFileChange(undefined);
      return;
    }

    setFile(selectedFile);
    setError(null);
    onFileChange(selectedFile);

    // Preview CSV content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').slice(0, 3); // Show only first 3 lines
      setPreview(lines);
    };
    reader.readAsText(selectedFile);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
                Format: {category === 'mcq' 
                  ? 'Question, OptionA, OptionB, OptionC, OptionD, Correct, Subject, Topic, Difficulty, Explanation' 
                  : 'Title, Question, OptionA, OptionB, OptionC, OptionD, Correct, Subject, Topic, Time, Marks, Explanation'}
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
        
        <a 
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(
            category === 'mcq' 
              ? 'Question,OptionA,OptionB,OptionC,OptionD,CorrectOption,Subject,Topic,Difficulty,Explanation\nWhat is the capital of Pakistan?,Karachi,Lahore,Islamabad,Peshawar,C,General Knowledge,Pakistan Affairs,Easy,Islamabad became the capital in 1967.' 
              : 'Quiz Title,Question,OptionA,OptionB,OptionC,OptionD,CorrectOption,Subject,Topic,Time(sec),Marks,Explanation\nGeneral Science Quiz,What planet is known as the Red Planet?,Venus,Earth,Mars,Jupiter,C,Science,Solar System,30,1,Mars appears red due to iron.'
          )}`} 
          download={`${category === 'mcq' ? 'mcq' : 'quiz'}_template.csv`}
          className="text-xs underline text-muted-foreground hover:text-primary"
        >
          Download template
        </a>
      </div>
    </div>
  );
};

export default CSVUploader;
