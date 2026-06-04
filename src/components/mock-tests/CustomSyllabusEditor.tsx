import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RotateCcw, Save, Trash2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  CustomSyllabusSection,
  SyllabusItem,
  officialToCustomSections,
  getCustomSyllabus,
  saveCustomSyllabus,
  deleteCustomSyllabus,
} from "@/services/jobTestService";

interface CustomSyllabusEditorProps {
  jobTestId: string;
  officialSyllabus: SyllabusItem[];
  /** ISO date the official syllabus was last updated (job_tests.updated_at). */
  officialUpdatedAt?: string;
}

const sectionsEqual = (a: CustomSyllabusSection[], b: CustomSyllabusSection[]) =>
  a.length === b.length &&
  a.every((s, i) => s.subject === b[i].subject && s.percentage === b[i].percentage && s.enabled === b[i].enabled);

export const CustomSyllabusEditor = ({
  jobTestId,
  officialSyllabus,
  officialUpdatedAt,
}: CustomSyllabusEditorProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const official = useMemo(() => officialToCustomSections(officialSyllabus), [officialSyllabus]);
  const [sections, setSections] = useState<CustomSyllabusSection[]>(official);
  const [notes, setNotes] = useState("");
  const [hasSaved, setHasSaved] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Load any saved custom syllabus on mount / auth change.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      if (!user) {
        if (active) {
          setSections(official);
          setHasSaved(false);
          setSavedAt(null);
          setNotes("");
          setLoading(false);
        }
        return;
      }
      const saved = await getCustomSyllabus(jobTestId);
      if (!active) return;
      if (saved && Array.isArray(saved.sections) && saved.sections.length > 0) {
        setSections(saved.sections);
        setNotes(saved.notes || "");
        setHasSaved(true);
        setSavedAt(saved.updated_at);
      } else {
        setSections(official);
        setHasSaved(false);
        setSavedAt(null);
        setNotes("");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [jobTestId, user, official]);

  const isCustomised = !sectionsEqual(sections, official) || hasSaved;
  const totalEnabled = sections.filter((s) => s.enabled).reduce((sum, s) => sum + (s.percentage || 0), 0);

  // A subject is "altered" when its text differs from the official version (by index).
  const isAltered = (idx: number) =>
    !!official[idx] && (sections[idx]?.subject || "").trim() !== official[idx].subject.trim();
  const alteredCount = sections.reduce((n, _s, i) => (isAltered(i) ? n + 1 : n), 0);
  const ALTER_LIMIT = 2;

  // Official syllabus changed AFTER the user saved their custom version.
  const officialChanged =
    hasSaved && savedAt && officialUpdatedAt
      ? new Date(officialUpdatedAt).getTime() > new Date(savedAt).getTime()
      : false;

  const updateSubject = (idx: number, value: string) => {
    // Block altering a NEW (currently-unaltered) subject once the limit is reached.
    if (!isAltered(idx) && alteredCount >= ALTER_LIMIT) {
      toast.error("Limit reached: You can only alter up to 2 subjects.");
      return;
    }
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, subject: value } : s)));
  };

  const updatePct = (idx: number, value: number) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, percentage: Math.max(0, Math.min(100, value)) } : s)));
  };
  const toggleSection = (idx: number) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, enabled: !s.enabled } : s)));
  };

  const requireLogin = () => {
    toast.info("Sign in to save your custom syllabus", {
      description: "Your customisation works for this session, but saving needs a free account.",
    });
    navigate("/sign-in");
  };

  const handleSave = async () => {
    if (!user) return requireLogin();
    if (totalEnabled === 0) {
      toast.error("Enable at least one subject before saving.");
      return;
    }
    setBusy(true);
    const result = await saveCustomSyllabus(jobTestId, sections, notes);
    setBusy(false);
    if (result) {
      setHasSaved(true);
      setSavedAt(result.updated_at);
      toast.success("Custom syllabus saved for this test.");
    } else {
      toast.error("Could not save. Please try again.");
    }
  };

  const handleReset = async () => {
    setBusy(true);
    if (user && hasSaved) {
      const ok = await deleteCustomSyllabus(jobTestId);
      if (!ok) {
        setBusy(false);
        toast.error("Could not reset. Please try again.");
        return;
      }
    }
    setSections(official);
    setNotes("");
    setHasSaved(false);
    setSavedAt(null);
    setBusy(false);
    toast.success("Restored the official MCQSAI syllabus.");
  };

  const handleUpdateFromOfficial = () => {
    setSections(official);
    toast.info("Loaded the latest official syllabus. Save to keep it.");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading syllabus…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/60 p-4 space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">Syllabus</h3>
          {isCustomised ? (
            <Badge variant="secondary">Customised</Badge>
          ) : (
            <Badge className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Official
            </Badge>
          )}
        </div>
        <span className={`text-xs font-medium ${totalEnabled === 100 ? "text-muted-foreground" : "text-amber-600"}`}>
          Total weightage: {totalEnabled}%
        </span>
      </div>

      {officialChanged && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Official syllabus has changed
          </div>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
            Keep your custom version or update from the latest official syllabus.
          </p>
          <Button size="sm" variant="outline" className="mt-2" onClick={handleUpdateFromOfficial}>
            Update from latest official
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Adjust subject weightage or disable subjects you want to skip. AI-generated questions will follow your saved
        syllabus; otherwise they follow the official MCQSAI syllabus. Subjects outside the official syllabus are not added.
      </p>

      <div className="space-y-2">
        {sections.map((s, idx) => (
          <div
            key={s.subject + idx}
            className={`flex items-center gap-3 rounded-xl border border-border px-3 py-2 ${
              s.enabled ? "bg-background" : "bg-muted/40 opacity-70"
            }`}
          >
            <Switch checked={s.enabled} onCheckedChange={() => toggleSection(idx)} aria-label={`Toggle ${s.subject}`} />
            <span className="flex-1 text-sm text-foreground line-clamp-1">{s.subject}</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                value={s.percentage}
                disabled={!s.enabled}
                onChange={(e) => updatePct(idx, parseInt(e.target.value || "0", 10))}
                className="w-16 h-8 text-sm text-right"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <Label htmlFor="syllabus-notes" className="text-xs text-muted-foreground">
          Notes (optional)
        </Label>
        <Textarea
          id="syllabus-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Focus more on Current Affairs this week"
          className="text-sm min-h-[60px]"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={handleSave} disabled={busy} size="sm">
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          {user ? "Save my syllabus" : "Sign in to save"}
        </Button>
        <Button onClick={handleReset} disabled={busy || (!isCustomised && !hasSaved)} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-1" /> Reset to official
        </Button>
        {hasSaved && (
          <Button onClick={handleReset} disabled={busy} variant="ghost" size="sm" className="text-destructive">
            <Trash2 className="h-4 w-4 mr-1" /> Delete custom
          </Button>
        )}
      </div>
      {!user && (
        <p className="text-[11px] text-muted-foreground">
          Guests can customise temporarily. Log in to save, edit, and reuse your syllabus across sessions.
        </p>
      )}
    </motion.div>
  );
};

export default CustomSyllabusEditor;
