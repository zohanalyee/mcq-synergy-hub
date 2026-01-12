import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bulkImportJobs, parseJobsJson, JobImportItem } from "@/services/bulkJobService";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Upload, FileJson, Briefcase } from "lucide-react";

interface BulkJobImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EXAMPLE_JSON = `[
  {
    "title": "Assistant Director",
    "department": "FPSC",
    "location": "Islamabad",
    "deadline": "2026-03-15",
    "description": "Full time government job...",
    "apply_link": "https://fpsc.gov.pk"
  }
]`;

export function BulkJobImportDialog({ open, onOpenChange, onSuccess }: BulkJobImportDialogProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedJobs, setParsedJobs] = useState<JobImportItem[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsedJobs(null);
    setParseErrors([]);
    setImportResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        setParseErrors(["File must contain a JSON array"]);
        return;
      }

      const { jobs, errors } = parseJobsJson(data);
      
      if (errors.length > 0 && jobs.length === 0) {
        setParseErrors(errors);
        return;
      }

      setParsedJobs(jobs);
      if (errors.length > 0) {
        setParseErrors(errors);
      }
    } catch (error) {
      setParseErrors(["Invalid JSON format - please check your file"]);
    }
  };

  const handleImport = async () => {
    if (!parsedJobs || parsedJobs.length === 0) return;

    setImporting(true);
    const result = await bulkImportJobs(parsedJobs);
    setImporting(false);
    setImportResult(result);

    if (result.errors.length === 0) {
      toast.success(`${result.inserted} Jobs Added Successfully`);
      onSuccess();
    } else if (result.inserted > 0) {
      toast.warning(`Imported ${result.inserted} jobs with ${result.errors.length} errors`);
      onSuccess();
    } else {
      toast.error("Import failed - no jobs were added");
    }
  };

  const handleClose = () => {
    setFileName(null);
    setParsedJobs(null);
    setParseErrors([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Bulk Import Jobs
          </DialogTitle>
          <DialogDescription>
            Upload a JSON file containing job listings to import them in bulk.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Example Format */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium mb-2">Expected JSON Format:</p>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground">
              {EXAMPLE_JSON}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Required:</strong> title, department | <strong>Optional:</strong> location, deadline, description, apply_link, government_level, cadre, tags
            </p>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing || !!importResult}
                >
                  {fileName ? "Choose Different File" : "Select JSON File"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              {fileName && (
                <p className="mt-2 text-sm font-medium text-primary">{fileName}</p>
              )}
            </div>
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && !parsedJobs && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...and {parseErrors.length - 5} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedJobs && !importResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Valid JSON</span>
              </div>
              <div className="flex gap-3">
                <Badge variant="secondary">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {parsedJobs.length} Jobs ready to import
                </Badge>
              </div>
              {parseErrors.length > 0 && (
                <p className="text-xs text-amber-600">
                  {parseErrors.length} items skipped due to validation errors
                </p>
              )}
              <div className="p-3 bg-muted/50 rounded-lg max-h-40 overflow-y-auto">
                {parsedJobs.slice(0, 5).map((job, i) => (
                  <div key={i} className="text-sm mb-2 last:mb-0">
                    <span className="font-medium">{job.title}</span>
                    <span className="text-muted-foreground ml-2">
                      ({job.department}{job.location ? `, ${job.location}` : ''})
                    </span>
                  </div>
                ))}
                {parsedJobs.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    ...and {parsedJobs.length - 5} more jobs
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={50} className="animate-pulse" />
              <p className="text-sm text-muted-foreground text-center">
                Importing jobs...
              </p>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert 
              variant={importResult.errors.length > 0 ? "default" : "default"} 
              className={importResult.inserted > 0 ? "border-green-500/50 bg-green-500/10" : "border-destructive/50 bg-destructive/10"}
            >
              <CheckCircle2 className={`h-4 w-4 ${importResult.inserted > 0 ? 'text-green-500' : 'text-destructive'}`} />
              <AlertDescription>
                <p className="font-medium">Import Complete!</p>
                <p className="text-sm mt-1">
                  {importResult.inserted} jobs imported successfully.
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-sm text-destructive">
                    <p className="font-medium">{importResult.errors.length} errors:</p>
                    <ul className="list-disc list-inside">
                      {importResult.errors.slice(0, 3).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 3 && (
                        <li>...and {importResult.errors.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importResult ? "Close" : "Cancel"}
          </Button>
          {!importResult && (
            <Button 
              onClick={handleImport} 
              disabled={!parsedJobs || parsedJobs.length === 0 || importing}
            >
              {importing ? "Importing..." : `Import ${parsedJobs?.length || 0} Jobs`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
