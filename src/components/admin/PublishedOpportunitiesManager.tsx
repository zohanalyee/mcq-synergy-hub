import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Loader2, Search, Globe } from "lucide-react";
import { toast } from "sonner";

const typeColors: Record<string, string> = {
  job: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  scholarship: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  tender: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  board_result: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function PublishedOpportunitiesManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editItem, setEditItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["published-opportunities", typeFilter],
    queryFn: async () => {
      let q = supabase.from("external_opportunities").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(200);
      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = items.filter((i: any) =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.organization?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const { id, ...updates } = editItem;
      const { error } = await supabase.from("external_opportunities").update(updates).eq("id", id);
      if (error) throw error;
      toast.success("Updated successfully");
      setEditItem(null);
      queryClient.invalidateQueries({ queryKey: ["published-opportunities"] });
    } catch (e: any) {
      toast.error("Update failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("external_opportunities").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Deleted successfully");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["published-opportunities"] });
    } catch (e: any) {
      toast.error("Delete failed: " + e.message);
    }
  };

  const set = (field: string, value: any) => setEditItem((prev: any) => prev ? { ...prev, [field]: value } : null);

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          Published Content ({filtered.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
            <option value="all">All Types</option>
            <option value="job">Jobs</option>
            <option value="scholarship">Scholarships</option>
            <option value="tender">Tenders</option>
            <option value="board_result">Board Results</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No published items found</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/20">
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Org</TableHead>
                  <TableHead className="text-xs">Deadline</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item: any) => (
                  <TableRow key={item.id} className="border-border/10">
                    <TableCell className="text-xs max-w-[200px] truncate font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${typeColors[item.type] || ''}`}>{item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{item.organization || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.deadline_date || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditItem({ ...item })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={(v) => !v && setEditItem(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader><DialogTitle>Edit Published Item</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Title</Label><Input value={editItem.title || ''} onChange={(e) => set("title", e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Organization</Label><Input value={editItem.organization || ''} onChange={(e) => set("organization", e.target.value)} className="h-8 text-xs" /></div>
              </div>
              <div><Label className="text-xs">Description</Label><Textarea value={editItem.description || ''} onChange={(e) => set("description", e.target.value)} rows={3} className="text-xs" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Location</Label><Input value={editItem.location || ''} onChange={(e) => set("location", e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Deadline</Label><Input type="date" value={editItem.deadline_date || ''} onChange={(e) => set("deadline_date", e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Salary</Label><Input value={editItem.salary || ''} onChange={(e) => set("salary", e.target.value)} className="h-8 text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Apply URL</Label><Input value={editItem.apply_url || ''} onChange={(e) => set("apply_url", e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Image URL</Label><Input value={editItem.image_url || ''} onChange={(e) => set("image_url", e.target.value)} className="h-8 text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Document URL</Label><Input value={editItem.document_url || ''} onChange={(e) => set("document_url", e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Qualification</Label><Input value={editItem.qualification || ''} onChange={(e) => set("qualification", e.target.value)} className="h-8 text-xs" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Eligibility</Label><Input value={editItem.eligibility || ''} onChange={(e) => set("eligibility", e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Amount</Label><Input value={editItem.amount || ''} onChange={(e) => set("amount", e.target.value)} className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Positions</Label><Input type="number" value={editItem.positions || ''} onChange={(e) => set("positions", parseInt(e.target.value) || null)} className="h-8 text-xs" /></div>
              </div>
              {editItem.image_url && (
                <div><Label className="text-xs">Image Preview</Label><img src={editItem.image_url} alt="" className="max-h-32 rounded border border-border/30 mt-1" /></div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this published opportunity.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
