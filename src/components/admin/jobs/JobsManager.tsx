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
import { Upload, Search, Edit, Trash2, ExternalLink, MapPin, Briefcase } from "lucide-react";
import { BulkJobImportDialog } from "./BulkJobImportDialog";
import { getJobsContent } from "@/services/bulkJobService";
import { supabase } from "@/integrations/supabase/client";
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
  department: row.department,
  governmentLevel: row.government_level,
  cadre: row.cadre,
  location: row.location,
  applyLink: row.apply_link,
});

export function JobsManager() {
  const [jobs, setJobs] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    const data = await getJobsContent();
    setJobs(data.map(transformRowToContentItem));
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveEdit = async (updatedItem: Partial<ContentItem>) => {
    if (!editItem) return;
    
    const result = await updateContentStatus(editItem.id, editItem.status, updatedItem);
    if (result) {
      toast.success("Job updated successfully");
      fetchJobs();
      setEditItem(null);
    } else {
      toast.error("Failed to update job");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    
    const result = await deleteContent(deleteItem.id);
    if (result.success) {
      toast.success("Job deleted successfully");
      fetchJobs();
    } else {
      toast.error(result.error || "Failed to delete job");
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Jobs Manager
              </CardTitle>
              <CardDescription>
                Manage job listings - {jobs.length} total jobs
              </CardDescription>
            </div>
            <Button onClick={() => setImportDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import Jobs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
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
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No jobs match your search" : "No jobs found. Import some jobs to get started."}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.slice(0, 50).map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {job.imageUrl && (
                            <img 
                              src={job.imageUrl} 
                              alt={job.title} 
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <span className="font-medium line-clamp-1">{job.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{job.department || "-"}</TableCell>
                      <TableCell>
                        {job.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{formatDate(job.deadline)}</TableCell>
                      <TableCell>
                        <Badge variant={job.status === 'approved' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {job.applyLink && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(job.applyLink, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditItem(job)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteItem(job)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredJobs.length > 50 && (
                <div className="p-2 text-center text-sm text-muted-foreground border-t">
                  Showing first 50 of {filteredJobs.length} jobs
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <BulkJobImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchJobs}
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
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
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
