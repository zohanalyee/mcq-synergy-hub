import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Upload, Search, Edit, Trash2, ExternalLink, GraduationCap, Building2, Calendar } from "lucide-react";
import { BulkScholarshipImportDialog } from "./BulkScholarshipImportDialog";
import { getScholarshipsContent } from "@/services/bulkScholarshipService";
import EnhancedEditContentDialog from "@/components/admin/content/EnhancedEditContentDialog";
import { ContentItem } from "@/interfaces/content";
import { updateContentStatus, deleteContent } from "@/services/supabaseContentService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const transformRowToContentItem = (row: any): ContentItem => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  category: row.category,
  tags: row.tags || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: row.status,
  createdBy: row.created_by,
  imageUrl: row.image_url,
  fileUrl: row.file_url,
  deadline: row.deadline,
  institution: row.institution,
  scholarshipType: row.scholarship_type,
  applyLink: row.apply_link,
});

export function ScholarshipsManager() {
  const [scholarships, setScholarships] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null);

  const fetchScholarships = async () => {
    setLoading(true);
    const data = await getScholarshipsContent();
    setScholarships(data.map(transformRowToContentItem));
    setLoading(false);
  };

  useEffect(() => {
    fetchScholarships();
  }, []);

  const filteredScholarships = scholarships.filter(scholarship => 
    scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.scholarshipType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveEdit = async (updatedItem: Partial<ContentItem>) => {
    if (!editItem) return;
    
    const result = await updateContentStatus(editItem.id, editItem.status, updatedItem);
    if (result) {
      toast.success("Scholarship updated successfully");
      fetchScholarships();
      setEditItem(null);
    } else {
      toast.error("Failed to update scholarship");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    
    const result = await deleteContent(deleteItem.id);
    if (result.success) {
      toast.success("Scholarship deleted successfully");
      fetchScholarships();
    } else {
      toast.error(result.error || "Failed to delete scholarship");
    }
    setDeleteItem(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { text: "Expired", variant: "destructive" as const };
    if (daysUntil <= 7) return { text: `${daysUntil}d left`, variant: "destructive" as const };
    if (daysUntil <= 30) return { text: `${daysUntil}d left`, variant: "secondary" as const };
    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Scholarships Manager
              </CardTitle>
              <CardDescription>
                Manage scholarship listings - {scholarships.length} total scholarships
              </CardDescription>
            </div>
            <Button onClick={() => setImportDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import Scholarships
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredScholarships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No scholarships match your search" : "No scholarships found. Import some scholarships to get started."}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScholarships.slice(0, 50).map((scholarship) => {
                    const deadlineStatus = getDeadlineStatus(scholarship.deadline);
                    return (
                      <TableRow key={scholarship.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {scholarship.imageUrl && (
                              <img 
                                src={scholarship.imageUrl} 
                                alt="" 
                                className="h-8 w-8 rounded object-cover"
                              />
                            )}
                            <span className="font-medium line-clamp-1">{scholarship.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {scholarship.institution ? (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {scholarship.institution}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {scholarship.scholarshipType ? (
                            <Badge variant="outline">{scholarship.scholarshipType}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(scholarship.deadline)}
                            </span>
                            {deadlineStatus && (
                              <Badge variant={deadlineStatus.variant} className="text-[10px]">
                                {deadlineStatus.text}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={scholarship.status === 'approved' ? 'default' : 'secondary'}>
                            {scholarship.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {scholarship.applyLink && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(scholarship.applyLink, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditItem(scholarship)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteItem(scholarship)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredScholarships.length > 50 && (
                <div className="p-2 text-center text-sm text-muted-foreground border-t">
                  Showing first 50 of {filteredScholarships.length} scholarships
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <BulkScholarshipImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchScholarships}
      />

      <EnhancedEditContentDialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        currentItem={editItem}
        onSave={handleSaveEdit}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scholarship</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
