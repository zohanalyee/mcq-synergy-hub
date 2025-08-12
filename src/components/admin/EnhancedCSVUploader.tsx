
import { useRef, useState } from 'react';
import { Upload, File, Check, AlertCircle, Download, Wand2, Link as LinkIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentCategory } from '@/interfaces/content';
import { parseCSV, generateCSVTemplate, CSVProcessingResult, CSV_TEMPLATES } from '@/services/csvProcessorService';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { parseAiken } from '@/services/aikenParser';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  const [sheetUrl, setSheetUrl] = useState('');
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({}); // target -> source
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helpers
  const extractHeadersFromCSV = (csv: string): string[] => {
    const firstLine = csv.split('\n')[0] || '';
    return firstLine.split(',').map(h => h.trim());
  };

  const getFirstSheetCSV = async (file: File): Promise<string> => {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(ws);
  };

  const applyHeaderMappingToFirstLine = (csv: string, map: Record<string, string>): string => {
    if (!csv) return csv;
    const lines = csv.split('\n');
    if (lines.length === 0) return csv;
    const orig = lines[0].split(',');
    const inverted: Record<string, string> = {};
    // map is target->source; build source(lower)->target
    Object.entries(map).forEach(([target, source]) => {
      if (source) inverted[source.toLowerCase()] = target;
    });
    const remapped = orig.map(h => {
      const key = h.trim().toLowerCase();
      return inverted[key] ? inverted[key] : h;
    });
    lines[0] = remapped.join(',');
    return lines.join('\n');
  };

  const deriveGoogleCsvUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (!u.hostname.includes('docs.google.com')) return null;
      const path = u.pathname; // /spreadsheets/d/{id}/edit
      const match = path.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) return null;
      const id = match[1];
      const gid = u.searchParams.get('gid');
      let exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
      if (gid) exportUrl += `&gid=${gid}`;
      return exportUrl;
    } catch {
      return null;
    }
  };

  const handleFileChange = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const valid = Array.from(selectedFiles).filter(
      file => file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.txt')
    );

    if (valid.length === 0) {
      toast.error("Please select .csv, .xlsx, or AIKEN .txt files", { duration: 3000 });
      return;
    }

    if (!allowMultiple && valid.length > 1) {
      toast.error("Please select only one file", { duration: 3000 });
      return;
    }

    setFiles(valid);
    setResults([]);

    // Try to detect headers from the first structured file
    const first = valid[0];
    try {
      if (first.name.endsWith('.csv')) {
        const text = await first.text();
        setDetectedHeaders(extractHeadersFromCSV(text));
      } else if (first.name.endsWith('.xlsx')) {
        const csv = await getFirstSheetCSV(first);
        setDetectedHeaders(extractHeadersFromCSV(csv));
      } else {
        setDetectedHeaders([]);
      }
    } catch {
      setDetectedHeaders([]);
    }

    // Pre-suggest mappings for required fields when possible
    const required = (CSV_TEMPLATES[category] || []).map(f => f.name);
    const suggestions: Record<string, string> = {};
    for (const field of required) {
      const match = detectedHeaders.find(h => h.toLowerCase() === field.toLowerCase());
      if (match) suggestions[field] = match;
    }
    setHeaderMap(suggestions);
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    const processResults: CSVProcessingResult[] = [];

    try {
      for (const file of files) {
        if (file.name.endsWith('.txt')) {
          if (category !== 'mcq') {
            processResults.push({ items: [], errors: ["AIKEN format is only supported for MCQ"], warnings: [], fileName: file.name });
            continue;
          }
          const text = await file.text();
          const result = parseAiken(text);
          result.fileName = file.name;
          processResults.push(result);
        } else if (file.name.endsWith('.xlsx')) {
          const csv = await getFirstSheetCSV(file);
          const mapped = Object.keys(headerMap).length ? applyHeaderMappingToFirstLine(csv, headerMap) : csv;
          const result = parseCSV(mapped, category);
          result.fileName = file.name;
          processResults.push(result);
        } else {
          const csv = await file.text();
          const mapped = Object.keys(headerMap).length ? applyHeaderMappingToFirstLine(csv, headerMap) : csv;
          const result = parseCSV(mapped, category);
          result.fileName = file.name;
          processResults.push(result);
        }
      }

      setResults(processResults);
      onFilesProcessed(processResults);

      const totalItems = processResults.reduce((sum, r) => sum + r.items.length, 0);
      const totalErrors = processResults.reduce((sum, r) => sum + r.errors.length, 0);

      if (totalErrors > 0) {
        toast.error(`Processed with ${totalErrors} errors`, {
          description: `${totalItems} items processed successfully`,
          duration: 4000,
        });
      } else {
        toast.success(`Successfully processed ${totalItems} items`, {
          duration: 3000,
        });
      }

    } catch (error) {
      toast.error("Failed to process files", {
        duration: 4000,
      });
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
    
    toast.info("AI enhancement coming soon!", {
      description: "This will auto-generate tags, SEO fields, and improve content quality",
      duration: 3000,
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
              accept=".csv,.xlsx,.txt"
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

          {/* Import from Google Sheets */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="gsheet-url" className="text-sm">Import from Google Sheets (public)</Label>
            <div className="flex gap-2 items-center">
              <Input id="gsheet-url" placeholder="Paste Google Sheets URL" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={async () => {
                  if (!sheetUrl) return;
                  const exportUrl = deriveGoogleCsvUrl(sheetUrl);
                  if (!exportUrl) {
                    toast.error('Invalid Google Sheets URL');
                    return;
                  }
                  try {
                    setProcessing(true);
                    const res = await fetch(exportUrl);
                    if (!res.ok) throw new Error('Fetch failed');
                    const csv = await res.text();
                    setDetectedHeaders(extractHeadersFromCSV(csv));
                    const mapped = Object.keys(headerMap).length ? applyHeaderMappingToFirstLine(csv, headerMap) : csv;
                    const parsed = parseCSV(mapped, category);
                    parsed.fileName = 'Google Sheet';
                    setResults([parsed, ...results]);
                    onFilesProcessed([parsed]);
                    toast.success(`Imported ${parsed.items.length} items from Google Sheets`);
                  } catch (e) {
                    console.error(e);
                    toast.error('Failed to import from Google Sheets');
                  } finally {
                    setProcessing(false);
                  }
                }}
              >
                <LinkIcon className="h-4 w-4" /> Import
              </Button>
            </div>
          </div>

          {/* Optional: Column Mapping */}
          {detectedHeaders.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Map columns (optional)</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CSV_TEMPLATES[category].map((field) => (
                  <div key={field.name} className="space-y-1">
                    <Label className="text-xs">{field.name}{field.required ? ' *' : ''}</Label>
                    <Select
                      value={headerMap[field.name] || ''}
                      onValueChange={(v) => setHeaderMap(prev => ({ ...prev, [field.name]: v }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select source column" />
                      </SelectTrigger>
                      <SelectContent>
                        {detectedHeaders.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                        <SelectItem value="">(none)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">If your header names differ, map them to our expected fields. This will be applied before parsing.</p>
            </div>
          )}

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
                  <span>{result.fileName || `File ${index + 1}`}</span>
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
                    Successfully processed {result.items.length} items from {result.fileName || 'uploaded file'}
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
