import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Filter, Search, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { bulkContentService } from "@/services/bulkContentService";
import { toast } from "sonner";

interface PendingContent {
  id: string;
  title: string;
  description: string;
  category: string;
  subject?: string;
  topic?: string;
  created_at: string;
  fileName?: string;
}

const PublishWorkflow = () => {
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewItem, setPreviewItem] = useState<PendingContent | null>(null);

  // Load pending content
  const loadPendingContent = async () => {
    setLoading(true);
    try {
      const data = await bulkContentService.getPendingContent(
        categoryFilter === 'all' ? undefined : categoryFilter
      );
      setPendingContent(data);
    } catch (error: any) {
      toast.error("Failed to load pending content", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingContent();
  }, [categoryFilter]);

  // Filter content based on search
  const filteredContent = pendingContent.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.subject && item.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.topic && item.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle item selection
  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredContent.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredContent.map(item => item.id)));
    }
  };

  // Publish selected items
  const handlePublish = async () => {
    if (selectedItems.size === 0) {
      toast.error("No items selected");
      return;
    }

    setLoading(true);
    try {
      const result = await bulkContentService.publishContent(Array.from(selectedItems));
      
      if (result.published > 0) {
        toast.success(`Successfully published ${result.published} items`);
        setSelectedItems(new Set());
        loadPendingContent(); // Reload the list
      }
      
      if (result.errors.length > 0) {
        toast.error("Some items failed to publish", {
          description: result.errors[0]
        });
      }
    } catch (error: any) {
      toast.error("Failed to publish content", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Content preview component
  const ContentPreview = ({ item }: { item: PendingContent }) => (
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
          <div>
            <strong>Created:</strong> {new Date(item.created_at).toLocaleDateString()}
          </div>
          {item.fileName && (
            <div>
              <strong>Source:</strong> {item.fileName}
            </div>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Publish Workflow ({filteredContent.length} pending)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="mcq">MCQ</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="scholarship">Scholarship</SelectItem>
                <SelectItem value="past_paper">Past Paper</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              disabled={filteredContent.length === 0}
            >
              {selectedItems.size === filteredContent.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={selectedItems.size === 0 || loading}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Publish Selected ({selectedItems.size})
            </Button>
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending content found
          </div>
        ) : (
          <div className="border rounded-lg">
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.size === filteredContent.length && filteredContent.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject/Topic</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12">Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContent.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.subject && item.topic ? `${item.subject} / ${item.topic}` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <ContentPreview item={item} />
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PublishWorkflow;