import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Edit, ExternalLink, Loader2, CheckCheck } from "lucide-react";

export default function OpportunityReviewQueue() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["pending-opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_opportunities")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-opportunities"] });
    queryClient.invalidateQueries({ queryKey: ["pending-opportunities-count"] });
  };

  const approveMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("external_opportunities")
        .update({ status: "approved", reviewed_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Approved!"); invalidate(); },
  });

  const rejectMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("external_opportunities")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Rejected"); invalidate(); },
  });

  const bulkApproveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("external_opportunities")
        .update({ status: "approved", reviewed_at: new Date().toISOString() } as any)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: () => { toast.success("All pending items approved!"); invalidate(); },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description,
      organization: item.organization,
      apply_url: item.apply_url,
      deadline_date: item.deadline_date,
      image_url: item.image_url,
      location: item.location,
      qualification: item.qualification,
      salary: item.salary,
      experience: item.experience,
      positions: item.positions,
      department: item.department,
      eligibility: item.eligibility,
      amount: item.amount,
      field_of_study: item.field_of_study,
      education_level: item.education_level,
      tender_number: item.tender_number,
      tender_value: item.tender_value,
      tender_category: item.tender_category,
      document_url: item.document_url,
    });
  };

  const handleSaveEdit = async () => {
    try {
      // Remove empty strings → null
      const cleanForm: any = {};
      for (const [key, value] of Object.entries(editForm)) {
        cleanForm[key] = value === "" ? null : value;
      }
      const { error } = await supabase
        .from("external_opportunities")
        .update(cleanForm)
        .eq("id", editingItem.id);
      if (error) throw error;
      toast.success("Saved!");
      setEditingItem(null);
      invalidate();
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    }
  };

  return (
    <>
      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Pending Review ({pending.length})</CardTitle>
            {pending.length > 0 && (
              <Button
                size="sm" variant="outline"
                className="h-7 text-xs border-emerald-500/20 text-emerald-400"
                onClick={() => bulkApproveMut.mutate()}
                disabled={bulkApproveMut.isPending}
              >
                <CheckCheck className="h-3 w-3 mr-1" /> Approve All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No items pending review</p>
          ) : (
            <div className="space-y-2">
              {pending.map((item: any) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                  {item.image_url && (
                    <img
                      src={item.image_url} alt=""
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                      <span className="text-xs font-medium truncate">{item.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.organization} • {item.source_name}
                      {item.location && ` • ${item.location}`}
                    </p>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => approveMut.mutate(item.id)} disabled={approveMut.isPending}>
                        <Check className="h-3 w-3 mr-0.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => handleEdit(item)}>
                        <Edit className="h-3 w-3 mr-0.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] text-red-400 border-red-500/20" onClick={() => rejectMut.mutate(item.id)} disabled={rejectMut.isPending}>
                        <X className="h-3 w-3 mr-0.5" /> Reject
                      </Button>
                      <a href={item.apply_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Opportunity</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Common fields */}
            <div>
              <Label className="text-xs">Title</Label>
              <Input className="h-8 text-sm" value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Organization</Label>
                <Input className="h-8 text-sm" value={editForm.organization || ""} onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input className="h-8 text-sm" value={editForm.location || ""} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Apply URL</Label>
                <Input className="h-8 text-sm" value={editForm.apply_url || ""} onChange={(e) => setEditForm({ ...editForm, apply_url: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Deadline</Label>
                <Input className="h-8 text-sm" value={editForm.deadline_date || ""} onChange={(e) => setEditForm({ ...editForm, deadline_date: e.target.value })} type="date" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input className="h-8 text-sm" value={editForm.image_url || ""} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} />
              {editForm.image_url && (
                <img src={editForm.image_url} alt="Preview" className="mt-2 w-full h-24 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>

            {/* Job fields */}
            {editingItem?.type === "job" && (
              <>
                <p className="text-xs font-semibold text-muted-foreground pt-2 border-t border-border/20">Job Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Qualification</Label>
                    <Input className="h-8 text-sm" value={editForm.qualification || ""} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Salary</Label>
                    <Input className="h-8 text-sm" value={editForm.salary || ""} onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Experience</Label>
                    <Input className="h-8 text-sm" value={editForm.experience || ""} onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Positions</Label>
                    <Input className="h-8 text-sm" type="number" value={editForm.positions || ""} onChange={(e) => setEditForm({ ...editForm, positions: e.target.value ? parseInt(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label className="text-xs">Department</Label>
                    <Input className="h-8 text-sm" value={editForm.department || ""} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {/* Scholarship fields */}
            {editingItem?.type === "scholarship" && (
              <>
                <p className="text-xs font-semibold text-muted-foreground pt-2 border-t border-border/20">Scholarship Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Eligibility</Label>
                    <Input className="h-8 text-sm" value={editForm.eligibility || ""} onChange={(e) => setEditForm({ ...editForm, eligibility: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <Input className="h-8 text-sm" value={editForm.amount || ""} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Field of Study</Label>
                    <Input className="h-8 text-sm" value={editForm.field_of_study || ""} onChange={(e) => setEditForm({ ...editForm, field_of_study: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Education Level</Label>
                    <Input className="h-8 text-sm" value={editForm.education_level || ""} onChange={(e) => setEditForm({ ...editForm, education_level: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {/* Tender fields */}
            {editingItem?.type === "tender" && (
              <>
                <p className="text-xs font-semibold text-muted-foreground pt-2 border-t border-border/20">Tender Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Tender Number</Label>
                    <Input className="h-8 text-sm" value={editForm.tender_number || ""} onChange={(e) => setEditForm({ ...editForm, tender_number: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Tender Value</Label>
                    <Input className="h-8 text-sm" value={editForm.tender_value || ""} onChange={(e) => setEditForm({ ...editForm, tender_value: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Input className="h-8 text-sm" value={editForm.tender_category || ""} onChange={(e) => setEditForm({ ...editForm, tender_category: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Document URL</Label>
                    <Input className="h-8 text-sm" value={editForm.document_url || ""} onChange={(e) => setEditForm({ ...editForm, document_url: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingItem(null)} className="flex-1 h-8 text-sm">Cancel</Button>
              <Button onClick={handleSaveEdit} className="flex-1 h-8 text-sm">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
