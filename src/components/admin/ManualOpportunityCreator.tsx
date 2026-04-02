import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const initialForm = {
  type: "scholarship" as string,
  title: "",
  description: "",
  organization: "",
  apply_url: "",
  deadline_date: "",
  image_url: "",
  location: "Pakistan",
  sector: "government",
  region: "federal",
};

export default function ManualOpportunityCreator({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);

  const handleSubmit = async () => {
    if (!form.title || !form.apply_url) {
      toast.error("Title and Apply URL are required");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("external_opportunities").insert({
        type: form.type,
        title: form.title,
        description: form.description || null,
        organization: form.organization || null,
        apply_url: form.apply_url,
        deadline_date: form.deadline_date || null,
        image_url: form.image_url || null,
        location: form.location || null,
        sector: form.sector || null,
        region: form.region || null,
        status: "approved",
        source_name: "Manual Entry",
        metadata: { created_manually: true, created_at: new Date().toISOString() },
      });
      if (error) throw error;
      toast.success("Opportunity created!");
      setOpen(false);
      setForm(initialForm);
      onSuccess();
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Opportunity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scholarship">🎓 Scholarship</SelectItem>
                <SelectItem value="job">💼 Job</SelectItem>
                <SelectItem value="tender">🏛️ Tender</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Title *</Label>
            <Input className="h-8 text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="E.g., HEC Overseas Scholarship 2026" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Full description..." rows={4} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Organization</Label>
            <Input className="h-8 text-sm" value={form.organization} onChange={(e) => set("organization", e.target.value)} placeholder="E.g., Higher Education Commission" />
          </div>
          <div>
            <Label className="text-xs">Apply URL *</Label>
            <Input className="h-8 text-sm" value={form.apply_url} onChange={(e) => set("apply_url", e.target.value)} placeholder="https://example.com/apply" type="url" />
          </div>
          <div>
            <Label className="text-xs">Deadline</Label>
            <Input className="h-8 text-sm" value={form.deadline_date} onChange={(e) => set("deadline_date", e.target.value)} type="date" />
          </div>
          <div>
            <Label className="text-xs">Image URL</Label>
            <Input className="h-8 text-sm" value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://example.com/image.jpg" type="url" />
            {form.image_url && (
              <img
                src={form.image_url} alt="Preview"
                className="mt-2 w-full h-32 object-cover rounded border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Location</Label>
              <Input className="h-8 text-sm" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Sector</Label>
              <Select value={form.sector} onValueChange={(v) => set("sector", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Region</Label>
              <Select value={form.region} onValueChange={(v) => set("region", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="federal">Federal</SelectItem>
                  <SelectItem value="sindh">Sindh</SelectItem>
                  <SelectItem value="punjab">Punjab</SelectItem>
                  <SelectItem value="kpk">KPK</SelectItem>
                  <SelectItem value="balochistan">Balochistan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-9 text-sm">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-9 text-sm">
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
