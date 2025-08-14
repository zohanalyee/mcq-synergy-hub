import { useState } from 'react';
import { Check, X, Eye, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContentSubmission } from "@/interfaces/content";
import { CSVProcessingResult } from "@/services/csvProcessorService";
import { bulkContentService, BulkUploadResult } from "@/services/bulkContentService";
import { toast } from "sonner";

interface BulkUploadPreviewProps {
  results: CSVProcessingResult[];
  onUploadComplete: (result: BulkUploadResult) => void;
}

const BulkUploadPreview = ({ results, onUploadComplete }: BulkUploadPreviewProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<ContentSubmission | null>(null);

  // Flatten all items from all results
  const allItems = results.flatMap((result, resultIndex) => 
    result.items.map((item, itemIndex) => ({
      ...item,
      uniqueId: `${resultIndex}-${itemIndex}`,
      fileName: result.fileName || `File ${resultIndex + 1}`
    }))
  );

  // Category-specific validation
  const isValidItem = (item: any) => {
    // Basic validation - category is always required
    if (!item.category) return false;
    
    // For MCQ and Quiz, check for question instead of title
    if (item.category === 'mcq' || item.category === 'quiz') {
      return item.title || (item as any).question; // Either title or question field
    }
    
    // For other categories, title is required
    return item.title;
  };

  const validItems = allItems.filter(isValidItem);
  const invalidItems = allItems.filter(item => !isValidItem(item));

  // Select/deselect all valid items
  const toggleSelectAll = () => {
    if (selectedItems.size === validItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(validItems.map(item => item.uniqueId)));
    }
  };

  // Toggle individual item selection
  const toggleItemSelection = (uniqueId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(uniqueId)) {
      newSelection.delete(uniqueId);
    } else {
      newSelection.add(uniqueId);
    }
    setSelectedItems(newSelection);
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    const itemsToUpload = validItems.filter(item => selectedItems.has(item.uniqueId));
    
    if (itemsToUpload.length === 0) {
      toast.error("No items selected for upload");
      return;
    }

    setUploading(true);
    try {
      const result = await bulkContentService.batchInsert(itemsToUpload);
      
      if (result.successful > 0) {
        toast.success(`Successfully uploaded ${result.successful} items`, {
          description: result.failed > 0 ? `${result.failed} items failed` : undefined
        });
      }
      
      if (result.duplicates > 0) {
        toast.warning(`${result.duplicates} duplicates skipped`);
      }
      
      if (result.errors.length > 0 && result.successful === 0) {
        toast.error("Upload failed", {
          description: result.errors[0]
        });
      }

      onUploadComplete(result);
    } catch (error: any) {
      toast.error("Upload failed", {
        description: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  // Render item preview dialog
  const ItemPreviewDialog = ({ item }: { item: ContentSubmission }) => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Content Preview</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-96">
        <div className="space-y-3">
          <div>
            <strong>Title:</strong> {item.title}
          </div>
          <div>
            <strong>Description:</strong> {item.description}
          </div>
          <div>
            <strong>Category:</strong> 
            <Badge variant="outline" className="ml-2">{item.category}</Badge>
          </div>
          {item.subject && (
            <div>
              <strong>Subject:</strong> {item.subject}
            </div>
          )}
          {item.topic && (
            <div>
              <strong>Topic:</strong> {item.topic}
            </div>
          )}
          {item.difficulty && (
            <div>
              <strong>Difficulty:</strong> 
              <Badge variant="secondary" className="ml-2">{item.difficulty}</Badge>
            </div>
          )}
          {item.options && (
            <div>
              <strong>Options:</strong>
              <div className="mt-1 space-y-1">
                {Object.entries(item.options).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                ))}
              </div>
              {item.correctOption && (
                <div className="mt-2">
                  <strong>Correct Answer:</strong> 
                  <Badge variant="default" className="ml-2">{item.correctOption}</Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );

  if (allItems.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No valid items found in the uploaded files.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Upload Preview ({allItems.length} items)</span>
          <div className="flex gap-2">
            <Badge variant="outline">
              {validItems.length} valid
            </Badge>
            {invalidItems.length > 0 && (
              <Badge variant="destructive">
                {invalidItems.length} invalid
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary and Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              disabled={validItems.length === 0}
            >
              {selectedItems.size === validItems.length ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Select All Valid
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} of {validItems.length} selected
            </span>
          </div>
          
          <Button
            onClick={handleBulkUpload}
            disabled={selectedItems.size === 0 || uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Selected ({selectedItems.size})
              </>
            )}
          </Button>
        </div>

        {/* Invalid Items Warning */}
        {invalidItems.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {invalidItems.length} items have missing required fields and will be skipped.
            </AlertDescription>
          </Alert>
        )}

        {/* Items Table */}
        <div className="border rounded-lg">
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject/Topic</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allItems.map((item) => {
                  const isValid = isValidItem(item);
                  const isSelected = selectedItems.has(item.uniqueId);
                  
                  return (
                    <TableRow key={item.uniqueId} className={!isValid ? "opacity-50" : ""}>
                      <TableCell>
                        {isValid && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(item.uniqueId)}
                            className="rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.title || (item as any).question || <span className="text-red-500">Missing title/question</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.subject && item.topic ? `${item.subject} / ${item.topic}` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.fileName}
                      </TableCell>
                      <TableCell>
                        {isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <ItemPreviewDialog item={item} />
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUploadPreview;