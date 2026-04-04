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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Sparkles, Loader2, Eye, Send, ArrowLeft, ArrowRight, X } from "lucide-react";

type Step = "input" | "review";

const initialForm = {
  type: "job" as string,
  title: "",
  description: "",
  organization: "",
  apply_url: "",
  deadline_date: "",
  image_url: "",
  document_url: "",
  location: "",
  sector: "government",
  region: "federal",
  qualification: "",
  salary: "",
  experience: "",
  positions: "",
  department: "",
  eligibility: "",
  amount: "",
  field_of_study: "",
  education_level: "",
  scholarship_scope: "",
  tender_number: "",
  tender_value: "",
  tender_category: "",
  keywords: [] as string[],
  rawText: "",
  sourceUrl: "",
};

export default function ManualOpportunityCreator({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [form, setForm] = useState(initialForm);

  const set = (key: string, val: string | string[] | number) => setForm((f) => ({ ...f, [key]: val }));

  const handleEnhance = async () => {
    if (!form.rawText.trim()) {
      toast.error("Paste some raw text first");
      return;
    }
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-content", {
        body: {
          rawText: form.rawText,
          category: form.type,
          organization: form.organization || undefined,
          sourceUrl: form.sourceUrl || undefined,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "AI enhancement failed");

      const d = data.data;
      setForm((f) => ({
        ...f,
        title: d.title || f.title,
        description: d.description || f.description,
        organization: d.organization || f.organization,
        deadline_date: d.deadline || f.deadline_date,
        location: d.location || f.location,
        sector: d.sector || f.sector,
        region: d.region || f.region,
        qualification: d.qualification || f.qualification || "",
        salary: d.salary || f.salary || "",
        experience: d.experience || f.experience || "",
        positions: d.positions ? String(d.positions) : f.positions,
        department: d.department || f.department || "",
        eligibility: d.eligibility || f.eligibility || "",
        amount: d.amount || f.amount || "",
        field_of_study: d.field_of_study || f.field_of_study || "",
        education_level: d.education_level || f.education_level || "",
        scholarship_scope: d.scholarship_scope || f.scholarship_scope || "",
        tender_number: d.tender_number || f.tender_number || "",
        tender_value: d.tender_value || f.tender_value || "",
        tender_category: d.tender_category || f.tender_category || "",
        keywords: Array.isArray(d.keywords) ? d.keywords : f.keywords,
      }));

      toast.success("✨ AI enhanced your content!");
      setStep("review");
    } catch (err: any) {
      toast.error(`Enhancement failed: ${err.message}`);
    } finally {
      setEnhancing(false);
    }
  };

  const handlePublish = async () => {
    if (!form.title || !form.apply_url) {
      toast.error("Title and Apply URL are required");
      return;
    }
    setLoading(true);
    try {
      const meta: Record<string, unknown> = {
        created_manually: true,
        ai_enhanced: true,
        keywords: form.keywords,
        source_url: form.sourceUrl || null,
        created_at: new Date().toISOString(),
      };
      const insertData: Record<string, unknown> = {
        type: form.type,
        title: form.title,
        description: form.description || null,
        organization: form.organization || null,
        apply_url: form.apply_url,
        deadline_date: form.deadline_date || null,
        image_url: form.image_url || null,
        document_url: form.document_url || null,
        location: form.location || null,
        sector: form.sector || null,
        region: form.region || null,
        status: "approved",
        source_name: "AI Content Studio",
        metadata: meta,
      };

      // Type-specific fields
      if (form.type === "job") {
        insertData.qualification = form.qualification || null;
        insertData.salary = form.salary || null;
        insertData.experience = form.experience || null;
        insertData.positions = form.positions ? parseInt(form.positions) : null;
        insertData.department = form.department || null;
      }
      if (form.type === "scholarship") {
        insertData.eligibility = form.eligibility || null;
        insertData.amount = form.amount || null;
        insertData.field_of_study = form.field_of_study || null;
        insertData.education_level = form.education_level || null;
        insertData.scholarship_scope = form.scholarship_scope || null;
      }
      if (form.type === "tender") {
        insertData.tender_number = form.tender_number || null;
        insertData.tender_value = form.tender_value || null;
        insertData.tender_category = form.tender_category || null;
        insertData.department = form.department || null;
      }

      const { error } = await supabase.from("external_opportunities").insert(insertData as any);
      if (error) throw error;

      toast.success("🚀 Published successfully!");
      setOpen(false);
      setForm(initialForm);
      setStep("input");
      onSuccess();
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeKeyword = (k: string) => set("keywords", form.keywords.filter((x) => x !== k));

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep("input"); setForm(initialForm); } }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
          <Plus className="h-3.5 w-3.5 mr-1" /> AI Content Studio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            AI Content Studio
            <Badge variant="outline" className="ml-2 text-[10px]">
              {step === "input" ? "Step 1: Input" : "Step 2: Review & Publish"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            {/* Category & Organization */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Category *</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job">💼 Job</SelectItem>
                    <SelectItem value="scholarship">🎓 Scholarship</SelectItem>
                    <SelectItem value="tender">🏛️ Tender</SelectItem>
                    <SelectItem value="board_result">📋 Board Result</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Organization</Label>
                <Input className="h-9 text-sm" value={form.organization} onChange={(e) => set("organization", e.target.value)} placeholder="e.g., FPSC, HEC, NHA" />
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Apply / Source URL *</Label>
                <Input className="h-9 text-sm" value={form.apply_url} onChange={(e) => set("apply_url", e.target.value)} placeholder="https://fpsc.gov.pk/..." type="url" />
              </div>
              <div>
                <Label className="text-xs font-medium">PDF / Document URL</Label>
                <Input className="h-9 text-sm" value={form.document_url} onChange={(e) => set("document_url", e.target.value)} placeholder="https://example.com/notice.pdf" type="url" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Image URL (ad poster/notice)</Label>
                <Input className="h-9 text-sm" value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://example.com/ad.jpg" type="url" />
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="mt-2 w-full h-24 object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>
              <div>
                <Label className="text-xs font-medium">Source Reference URL</Label>
                <Input className="h-9 text-sm" value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="Where you found this (for reference)" type="url" />
              </div>
            </div>

            {/* Raw Text */}
            <div>
              <Label className="text-xs font-medium">📋 Paste Raw Text from Ad / PDF / Website *</Label>
              <Textarea
                value={form.rawText}
                onChange={(e) => set("rawText", e.target.value)}
                placeholder="Paste the full text from the job ad, scholarship notice, tender document, or board result announcement here...

The AI will automatically extract:
• Title, description, deadline
• Salary, qualifications, experience (for jobs)
• Eligibility, amount (for scholarships)
• Tender number, value (for tenders)
• SEO keywords"
                rows={10}
                className="text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{form.rawText.length} characters</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="h-10">Cancel</Button>
              <Button
                onClick={handleEnhance}
                disabled={enhancing || !form.rawText.trim()}
                className="flex-1 h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {enhancing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enhancing with AI...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Enhance with AI Magic</>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setStep("review")} className="h-10">
                Skip AI <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("input")} className="mb-1">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Input
            </Button>

            {/* Keywords */}
            {form.keywords.length > 0 && (
              <div>
                <Label className="text-xs font-medium">SEO Keywords</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.keywords.map((k) => (
                    <Badge key={k} variant="secondary" className="text-[10px] gap-1">
                      {k}
                      <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => removeKeyword(k)} />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Core fields */}
            <div>
              <Label className="text-xs font-medium">Title *</Label>
              <Input className="h-9 text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>

            <div>
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className="text-sm" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Organization</Label>
                <Input className="h-8 text-sm" value={form.organization} onChange={(e) => set("organization", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input className="h-8 text-sm" value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Deadline</Label>
                <Input className="h-8 text-sm" value={form.deadline_date} onChange={(e) => set("deadline_date", e.target.value)} type="date" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Apply URL *</Label>
                <Input className="h-8 text-sm" value={form.apply_url} onChange={(e) => set("apply_url", e.target.value)} type="url" />
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

            {/* Type-specific fields */}
            {form.type === "job" && (
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-3">
                <p className="text-xs font-semibold text-amber-400">💼 Job Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Qualification</Label>
                    <Input className="h-8 text-sm" value={form.qualification} onChange={(e) => set("qualification", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Salary / BPS</Label>
                    <Input className="h-8 text-sm" value={form.salary} onChange={(e) => set("salary", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Experience</Label>
                    <Input className="h-8 text-sm" value={form.experience} onChange={(e) => set("experience", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Positions</Label>
                    <Input className="h-8 text-sm" value={form.positions} onChange={(e) => set("positions", e.target.value)} type="number" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Department</Label>
                    <Input className="h-8 text-sm" value={form.department} onChange={(e) => set("department", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {form.type === "scholarship" && (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                <p className="text-xs font-semibold text-emerald-400">🎓 Scholarship Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Eligibility</Label>
                    <Input className="h-8 text-sm" value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <Input className="h-8 text-sm" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Field of Study</Label>
                    <Input className="h-8 text-sm" value={form.field_of_study} onChange={(e) => set("field_of_study", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Education Level</Label>
                    <Input className="h-8 text-sm" value={form.education_level} onChange={(e) => set("education_level", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Scope</Label>
                    <Select value={form.scholarship_scope || "national"} onValueChange={(v) => set("scholarship_scope", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national">National</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {form.type === "tender" && (
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-3">
                <p className="text-xs font-semibold text-blue-400">🏛️ Tender Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tender Number</Label>
                    <Input className="h-8 text-sm" value={form.tender_number} onChange={(e) => set("tender_number", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Tender Value</Label>
                    <Input className="h-8 text-sm" value={form.tender_value} onChange={(e) => set("tender_value", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Input className="h-8 text-sm" value={form.tender_category} onChange={(e) => set("tender_category", e.target.value)} placeholder="Construction, IT, Medical..." />
                  </div>
                  <div>
                    <Label className="text-xs">Department</Label>
                    <Input className="h-8 text-sm" value={form.department} onChange={(e) => set("department", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Media previews */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Image URL</Label>
                <Input className="h-8 text-sm" value={form.image_url} onChange={(e) => set("image_url", e.target.value)} type="url" />
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="mt-1 w-full h-20 object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>
              <div>
                <Label className="text-xs">Document URL</Label>
                <Input className="h-8 text-sm" value={form.document_url} onChange={(e) => set("document_url", e.target.value)} type="url" />
              </div>
            </div>

            {/* Publish actions */}
            <div className="flex gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setOpen(false)} className="h-10">Cancel</Button>
              <Button variant="ghost" onClick={() => setStep("input")} className="h-10">
                <ArrowLeft className="h-4 w-4 mr-1" /> Edit Input
              </Button>
              <Button
                onClick={handlePublish}
                disabled={loading || !form.title || !form.apply_url}
                className="flex-1 h-10 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Publish Now</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
