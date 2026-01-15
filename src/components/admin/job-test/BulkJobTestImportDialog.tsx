import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { 
  bulkImportJobTests, 
  parseJobTestsJson, 
  JobTestImportItem 
} from "@/services/bulkJobTestService";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, FileJson, ClipboardList } from "lucide-react";

interface BulkJobTestImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EXAMPLE_JSON = `[
  {
    "title": "Election Officer (BPS-17)",
    "description": "Comprehensive test for Election Officer position",
    "organization": "Election Commission",
    "duration": 90,
    "questions": 100,
    "syllabus": [
      { "topic": "English", "percentage": 20 },
      { "topic": "Constitution of Pakistan", "percentage": 30 },
      { "topic": "Election Act 2017", "percentage": 30 },
      { "topic": "Current Affairs", "percentage": 20 }
    ]
  },
  {
    "title": "Assistant Director (BPS-17)",
    "description": "Test for AD position",
    "organization": "FPSC",
    "duration": 120,
    "questions": 100,
    "syllabus": [
      { "topic": "General Knowledge", "percentage": 25 },
      { "topic": "Pakistan Affairs", "percentage": 25 },
      { "topic": "Quantitative Reasoning", "percentage": 25 },
      { "topic": "English", "percentage": 25 }
    ]
  }
]`;

export function BulkJobTestImportDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: BulkJobTestImportDialogProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<JobTestImportItem[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    errors: string[];
  } | null>(null);

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    setParseError(null);
    setParsedData(null);
    setImportResult(null);

    if (!value.trim()) return;

    try {
      const data = JSON.parse(value);
      
      if (!Array.isArray(data)) {
        setParseError("Input must be an array of job tests");
        return;
      }

      const { jobTests, errors } = parseJobTestsJson(data);
      
      if (errors.length > 0) {
        setParseError(errors[0]);
        return;
      }

      if (jobTests.length === 0) {
        setParseError("No valid job tests found in the JSON");
        return;
      }

      setParsedData(jobTests);
    } catch (e) {
      setParseError("Invalid JSON format");
    }
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setImporting(true);
    const result = await bulkImportJobTests(parsedData);
    setImporting(false);
    setImportResult(result);

    if (result.errors.length === 0) {
      toast.success(`Successfully imported ${result.inserted} job tests`);
      onSuccess();
    } else {
      toast.warning(`Imported ${result.inserted} job tests with ${result.errors.length} errors`);
    }
  };

  const handleClose = () => {
    setJsonInput("");
    setParsedData(null);
    setParseError(null);
    setImportResult(null);
    onOpenChange(false);
  };

  const totalJobTests = parsedData?.length || 0;
  const totalSyllabusItems = parsedData?.reduce((sum, test) => sum + test.syllabus.length, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Bulk Import Job Tests
          </DialogTitle>
          <DialogDescription>
            Import job tests with syllabus using JSON format. Paste your JSON array below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Example Format */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium mb-2">Expected JSON Format:</p>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground max-h-40 overflow-y-auto">
              {EXAMPLE_JSON}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Required:</strong> title, organization, syllabus (array with topic & percentage) | 
              <strong> Optional:</strong> description, duration, questions
            </p>
          </div>

          {/* JSON Input */}
          <div className="grid gap-2">
            <Label htmlFor="json">Paste JSON Here</Label>
            <Textarea
              id="json"
              placeholder="Paste your JSON array of job tests here..."
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              disabled={importing || !!importResult}
            />
          </div>

          {/* Parse Error */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedData && !importResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Valid JSON</span>
              </div>
              <div className="flex gap-3">
                <Badge variant="secondary">
                  <ClipboardList className="h-3 w-3 mr-1" />
                  {totalJobTests} Job Tests
                </Badge>
                <Badge variant="outline">
                  {totalSyllabusItems} Syllabus Items
                </Badge>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                {parsedData.map((item, i) => (
                  <div key={i} className="text-sm mb-3 last:mb-0 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {item.organization} • {item.duration} mins • {item.questions} questions
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.syllabus.map((s, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {s.topic} ({s.percentage}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={50} className="animate-pulse" />
              <p className="text-sm text-muted-foreground text-center">
                Importing job tests...
              </p>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert variant={importResult.errors.length > 0 ? "default" : "default"} className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <p className="font-medium">Import Complete!</p>
                <p className="text-sm mt-1">
                  Successfully imported {importResult.inserted} job tests.
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
              disabled={!parsedData || parsedData.length === 0 || importing}
            >
              {importing ? "Importing..." : `Import ${totalJobTests} Job Tests`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
