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
  bulkImportScholarships, 
  parseScholarshipsJson, 
  ScholarshipImportItem 
} from "@/services/bulkScholarshipService";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, GraduationCap, FileJson } from "lucide-react";

interface BulkScholarshipImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EXAMPLE_JSON = `[
  {
    "title": "Merit Scholarship 2025",
    "institution": "HEC Pakistan",
    "scholarship_type": "Merit-based",
    "deadline": "2025-06-30",
    "description": "Full scholarship for top students...",
    "apply_link": "https://hec.gov.pk/apply"
  },
  {
    "title": "Need-Based Financial Aid",
    "institution": "Punjab University",
    "scholarship_type": "Need-based",
    "deadline": "2025-05-15"
  }
]`;

export function BulkScholarshipImportDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: BulkScholarshipImportDialogProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<ScholarshipImportItem[] | null>(null);
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
        setParseError("Input must be an array");
        return;
      }

      const { scholarships, errors } = parseScholarshipsJson(data);
      
      if (errors.length > 0) {
        setParseError(errors[0]);
        return;
      }

      if (scholarships.length === 0) {
        setParseError("No valid scholarships found in the JSON");
        return;
      }

      setParsedData(scholarships);
    } catch (e) {
      setParseError("Invalid JSON format");
    }
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setImporting(true);
    const result = await bulkImportScholarships(parsedData);
    setImporting(false);
    setImportResult(result);

    if (result.errors.length === 0) {
      toast.success(`Successfully imported ${result.inserted} scholarships`);
      onSuccess();
    } else {
      toast.warning(`Imported ${result.inserted} scholarships with ${result.errors.length} errors`);
    }
  };

  const handleClose = () => {
    setJsonInput("");
    setParsedData(null);
    setParseError(null);
    setImportResult(null);
    onOpenChange(false);
  };

  const totalScholarships = parsedData?.length || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Bulk Import Scholarships
          </DialogTitle>
          <DialogDescription>
            Import scholarships using JSON format. Paste your JSON array below.
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
              <strong>Required:</strong> title, institution | <strong>Optional:</strong> scholarship_type, deadline, description, apply_link, tags
            </p>
          </div>

          {/* JSON Input */}
          <div className="grid gap-2">
            <Label htmlFor="json">Paste JSON Here</Label>
            <Textarea
              id="json"
              placeholder="Paste your JSON array here..."
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
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {totalScholarships} Scholarships
                </Badge>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg max-h-40 overflow-y-auto">
                {parsedData.map((item, i) => (
                  <div key={i} className="text-sm mb-2 last:mb-0">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground ml-2">
                      ({item.institution}
                      {item.scholarship_type && ` • ${item.scholarship_type}`}
                      {item.deadline && ` • Due: ${item.deadline}`})
                    </span>
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
                Importing scholarships...
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
                  Successfully imported {importResult.inserted} scholarships.
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
              {importing ? "Importing..." : `Import ${totalScholarships} Scholarships`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
