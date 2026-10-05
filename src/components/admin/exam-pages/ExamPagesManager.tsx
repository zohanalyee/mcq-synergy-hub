import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { examPassesGate } from "@/lib/examQualityGate.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Copy, History, Plus, Save, Trash2, X } from "lucide-react";

type Facts = Record<string, unknown>;
interface Row {
  slug: string;
  kind: string;
  facts: Facts;
  test_date: string | null;
  verified_on: string | null;
  status: string;
  include_in_sitemap: boolean;
  updated_at?: string;
}

const db = supabase as any;
const NYA = "Not yet announced";
const SIX_MONTHS = 182 * 24 * 3600 * 1000;

const LABELS: Record<string, string> = {
  name: "Name", fullName: "Full name", metaTitle: "Meta title", metaDescription: "Meta description",
  examBody: "Exam body", duration: "Duration", totalMarks: "Total marks", frequency: "Frequency",
  testDate: "Test date (display text)", officialUrl: "Official source link", verifiedOn: "Verified on (display text)",
  patternNote: "Pattern note", subjects: "Subjects", eligibility: "Eligibility", keyDates: "Key dates",
  pattern: "Pattern table", tips: "Tips", officialSources: "Official sources", relatedLinks: "Related links",
};
const label = (k: string) => LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const warnings = (r: Row) => {
  const w: string[] = [];
  if (r.verified_on && Date.now() - new Date(r.verified_on).getTime() > SIX_MONTHS) w.push("Verified >6 months ago");
  if (r.test_date && new Date(`${r.test_date}T23:59:59+05:00`).getTime() < Date.now()) w.push("Test date passed");
  return w;
};

const bumpYear = (v: unknown): unknown => {
  if (typeof v === "string") return v.replace(/\b(20\d\d)\b/g, (y) => String(Number(y) + 1));
  if (Array.isArray(v)) return v.map(bumpYear);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, bumpYear(x)]));
  return v;
};

export default function ExamPagesManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-exam-pages"],
    queryFn: async () => {
      const { data, error } = await db.from("exam_pages").select("*").order("kind").order("slug");
      if (error) throw error;
      return data as Row[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-exam-pages"] });
    qc.invalidateQueries({ queryKey: ["exam-page"] });
  };

  const duplicate = async (r: Row) => {
    const slug = window.prompt("New page address (slug) for next year's copy:", `${r.slug}-${new Date().getFullYear() + 1}`);
    if (!slug) return;
    const facts = bumpYear(r.facts) as Facts;
    for (const k of ["testDate", "verifiedOn"]) if (k in facts) facts[k] = NYA;
    if (Array.isArray(facts.keyDates)) facts.keyDates = (facts.keyDates as any[]).map((d) => ({ ...d, value: NYA }));
    const { error } = await db.from("exam_pages").insert({
      slug: slug.trim().toLowerCase(), kind: r.kind, facts, test_date: null, verified_on: null,
      status: "draft", include_in_sitemap: false,
    });
    if (error) return toast.error("Could not duplicate", { description: error.message });
    toast.success("Draft copy created", { description: "Dates cleared and set to 'Not yet announced'." });
    refresh();
  };

  if (editing) return <ExamPageEditor row={editing} onClose={() => setEditing(null)} onSaved={refresh} />;

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="text-base">Exam Pages</CardTitle>
        <p className="text-xs text-muted-foreground">
          Edits show to visitors immediately. Search engines see them after the next Publish.
        </p>
      </CardHeader>
      <CardContent className="p-3 pt-0 overflow-x-auto">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <table className="w-full text-xs">
            <thead className="text-muted-foreground text-left">
              <tr><th className="p-2">Page</th><th className="p-2">Type</th><th className="p-2">Test date</th><th className="p-2">Verified on</th><th className="p-2">Status</th><th className="p-2">Sitemap</th><th className="p-2">Needs update</th><th className="p-2" /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug} className="border-t border-border hover:bg-muted/40">
                  <td className="p-2 font-medium">
                    <button className="hover:underline text-primary" onClick={() => setEditing(r)}>/exams/{r.slug}</button>
                  </td>
                  <td className="p-2">{r.kind}</td>
                  <td className="p-2">{r.test_date ?? "—"}</td>
                  <td className="p-2">{r.verified_on ?? "—"}</td>
                  <td className="p-2"><Badge variant={r.status === "published" ? "default" : "secondary"}>{r.status}</Badge></td>
                  <td className="p-2">{examPassesGate(r) ? <Badge variant="outline">In sitemap</Badge> : <span className="text-muted-foreground">No</span>}</td>
                  <td className="p-2">{warnings(r).map((w) => <Badge key={w} variant="destructive" className="mr-1">{w}</Badge>)}</td>
                  <td className="p-2 whitespace-nowrap">
                    <Button size="sm" variant="outline" className="h-7 mr-1" onClick={() => setEditing(r)}>Edit</Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => duplicate(r)} title="Duplicate for next year"><Copy className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function ExamPageEditor({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Row>(() => JSON.parse(JSON.stringify(row)));
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const setFact = (k: string, v: unknown) => setDraft((d) => ({ ...d, facts: { ...d.facts, [k]: v } }));

  const { data: history = [] } = useQuery({
    queryKey: ["exam-page-history", row.slug],
    enabled: showHistory,
    queryFn: async () => {
      const { data, error } = await db.from("exam_pages_history").select("*").eq("slug", row.slug).order("changed_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as { id: string; old_row: Row; changed_at: string }[];
    },
  });

  const checks = useMemo(() => {
    const f = draft.facts;
    const sources = Array.isArray(f.officialSources) ? (f.officialSources as any[]).filter((s) => s?.url) : [];
    const factCount = Object.values(f).filter((v) => (Array.isArray(v) ? v.length : typeof v === "string" ? v.trim() && v !== NYA : v != null)).length;
    return [
      { ok: draft.status === "published", text: "Status is published" },
      { ok: draft.include_in_sitemap, text: "Include-in-sitemap switch is on" },
      { ok: draft.kind !== "admission" || (typeof f.officialUrl === "string" && f.officialUrl.trim().length > 0), text: "Official source link present" },
      { ok: draft.kind !== "admission" || sources.length > 0, text: `Official sources listed (${sources.length})` },
      { ok: factCount >= 8, text: `Filled facts: ${factCount}` },
    ];
  }, [draft]);
  const passes = examPassesGate(draft);

  const save = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await db.from("exam_pages").update({
      facts: draft.facts, test_date: draft.test_date || null, verified_on: draft.verified_on || null,
      status: draft.status, include_in_sitemap: draft.include_in_sitemap, updated_by: u.user?.id ?? null,
    }).eq("slug", row.slug);
    setSaving(false);
    if (error) return toast.error("Save failed", { description: error.message });
    toast.success("Saved", { description: "Live for visitors now; search engines after next Publish." });
    onSaved();
  };

  const restore = (old: Row) => {
    setDraft({ ...draft, facts: old.facts, test_date: old.test_date, verified_on: old.verified_on, status: old.status, include_in_sitemap: old.include_in_sitemap });
    toast.info("Old version loaded into the form — press Save to apply it.");
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <Card>
        <CardHeader className="p-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Edit /exams/{row.slug}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={onClose}><X className="h-4 w-4 mr-1" />Back</Button>
            <Button size="sm" className="h-8" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Saving…" : "Save"}</Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Real test date (for countdowns)">
              <Input type="date" value={draft.test_date ?? ""} onChange={(e) => setDraft({ ...draft, test_date: e.target.value || null })} />
            </Field>
            <Field label="Verified on (sitemap date)">
              <Input type="date" value={draft.verified_on ?? ""} onChange={(e) => setDraft({ ...draft, verified_on: e.target.value || null })} />
            </Field>
            <Field label="Status">
              <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                <option value="published">published</option><option value="draft">draft</option>
              </select>
            </Field>
            <Field label="Include in sitemap">
              <label className="flex items-center gap-2 h-9 text-sm">
                <input type="checkbox" checked={draft.include_in_sitemap} onChange={(e) => setDraft({ ...draft, include_in_sitemap: e.target.checked })} /> On
              </label>
            </Field>
          </div>
          {Object.entries(draft.facts).map(([k, v]) => (
            <FactField key={k} name={k} value={v} onChange={(nv) => setFact(k, nv)} />
          ))}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Card>
          <CardHeader className="p-3"><CardTitle className="text-sm">Quality check</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 space-y-1 text-xs">
            {checks.map((c) => <div key={c.text} className={c.ok ? "text-foreground" : "text-destructive"}>{c.ok ? "✓" : "✗"} {c.text}</div>)}
            <div className="pt-2 font-medium">{passes ? <Badge>Will be in sitemap</Badge> : <Badge variant="destructive">Not in sitemap</Badge>}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Change history</CardTitle>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => setShowHistory((s) => !s)}><History className="h-3.5 w-3.5 mr-1" />{showHistory ? "Hide" : "Show"}</Button>
          </CardHeader>
          {showHistory && (
            <CardContent className="p-3 pt-0 space-y-1 text-xs max-h-80 overflow-y-auto">
              {history.length === 0 && <p className="text-muted-foreground">No earlier versions yet.</p>}
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between border-t border-border pt-1">
                  <span>{new Date(h.changed_at).toLocaleString()}</span>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => restore(h.old_row)}>Restore</Button>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label: l, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-medium text-muted-foreground">{l}</span>{children}</label>;
}

function FactField({ name, value, onChange }: { name: string; value: unknown; onChange: (v: unknown) => void }) {
  const nya = value === NYA;
  const toggle = (
    <button type="button" className="text-[11px] text-primary hover:underline" onClick={() => onChange(nya ? "" : NYA)}>
      {nya ? "Clear 'Not yet announced'" : "Mark not yet announced"}
    </button>
  );

  if (typeof value === "string" || value == null) {
    const str = (value as string | null) ?? ""; const long = str.length > 90;
    return (
      <div className="space-y-1">
        <div className="flex justify-between"><span className="text-xs font-medium text-muted-foreground">{label(name)}</span>{toggle}</div>
        {long ? <Textarea rows={3} value={str} onChange={(e) => onChange(e.target.value)} />
              : <Input value={str} onChange={(e) => onChange(e.target.value)} />}
      </div>
    );
  }

  if (Array.isArray(value)) {
    const isObj = value.some((x) => x && typeof x === "object");
    const keys = isObj ? Array.from(new Set(value.flatMap((x) => Object.keys(x ?? {})))) : [];
    const move = (i: number, d: number) => {
      const a = [...value]; const j = i + d; if (j < 0 || j >= a.length) return;
      [a[i], a[j]] = [a[j], a[i]]; onChange(a);
    };
    const set = (i: number, v: unknown) => { const a = [...value]; a[i] = v; onChange(a); };
    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">{label(name)}</span>
        <div className="space-y-1.5 rounded-md border border-border p-2">
          {value.map((item, i) => (
            <div key={i} className="flex gap-1 items-start">
              <div className={isObj ? "grid gap-1 flex-1" : "flex-1"} style={isObj ? { gridTemplateColumns: `repeat(${keys.length}, minmax(0,1fr))` } : undefined}>
                {isObj ? keys.map((k) => (
                  <Input key={k} placeholder={k} className="h-8 text-xs" value={String((item as any)?.[k] ?? "")}
                    onChange={(e) => set(i, { ...(item as object), [k]: e.target.value })} />
                )) : <Input className="h-8 text-xs" value={String(item ?? "")} onChange={(e) => set(i, e.target.value)} />}
              </div>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-7" onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-7" onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button type="button" size="icon" variant="ghost" className="h-8 w-7" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs"
            onClick={() => onChange([...value, isObj ? Object.fromEntries(keys.map((k) => [k, ""])) : ""])}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add row
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label(name)} (advanced)</span>
      <Textarea rows={4} className="font-mono text-xs" defaultValue={JSON.stringify(value, null, 2)}
        onBlur={(e) => { try { onChange(JSON.parse(e.target.value)); } catch { toast.error(`${label(name)}: invalid format`); } }} />
    </div>
  );
}
