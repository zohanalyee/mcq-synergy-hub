import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Counts = { sentToday: number; sent7d: number; failed7d: number; unsubscribed: number };

const EmailRemindersPanel = () => {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [busy, setBusy] = useState<"dry" | "send" | null>(null);
  const [preview, setPreview] = useState<any | null>(null);

  const load = async () => {
    const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
    const sinceToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    const [today, week, failed, unsub] = await Promise.all([
      supabase.from("email_send_log").select("id", { count: "exact", head: true })
        .eq("status", "sent").gte("created_at", sinceToday),
      supabase.from("email_send_log").select("id", { count: "exact", head: true })
        .eq("status", "sent").gte("created_at", since7),
      supabase.from("email_send_log").select("id", { count: "exact", head: true })
        .eq("status", "failed").gte("created_at", since7),
      supabase.from("email_send_log").select("id", { count: "exact", head: true })
        .eq("status", "unsubscribed"),
    ]);

    setCounts({
      sentToday: today.count || 0,
      sent7d: week.count || 0,
      failed7d: failed.count || 0,
      unsubscribed: unsub.count || 0,
    });
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (dryRun: boolean) => {
    setBusy(dryRun ? "dry" : "send");
    setPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-streak-reminders", {
        body: { dryRun },
      });
      if (error) throw error;
      if (dryRun) {
        setPreview(data);
        toast.success(`${data?.candidates ?? 0} recipients matched (nothing sent)`);
      } else {
        toast.success(`Sent ${data?.sent ?? 0} reminder emails`, {
          description: data?.failed ? `${data.failed} failed — check logs` : undefined,
        });
        void load();
      }
    } catch (e: any) {
      toast.error("Reminder run failed", { description: e?.message || String(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-cyan-400" />
          Streak reminder emails
        </CardTitle>
        <CardDescription className="text-xs">
          Runs daily at 13:00 PKT for users inactive 2-4 days. Max 1 email per user per 5 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">Sent today: {counts?.sentToday ?? "—"}</Badge>
          <Badge variant="outline">Sent 7d: {counts?.sent7d ?? "—"}</Badge>
          <Badge variant="outline" className="border-amber-500/30 text-amber-400">
            Failed 7d: {counts?.failed7d ?? "—"}
          </Badge>
          <Badge variant="outline">Unsubscribed: {counts?.unsubscribed ?? "—"}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="min-h-11" disabled={!!busy} onClick={() => run(true)}>
            {busy === "dry" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
            Dry run (preview only)
          </Button>
          <Button size="sm" className="min-h-11" disabled={!!busy} onClick={() => run(false)}>
            {busy === "send" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
            Send now
          </Button>
        </div>

        {preview && (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
            <p className="mb-2 font-medium">{preview.candidates} recipients matched</p>
            {preview.sampleEmail?.subject && (
              <p className="mb-2 text-muted-foreground">
                Subject: <span className="text-foreground">{preview.sampleEmail.subject}</span>
              </p>
            )}
            <ul className="space-y-1 text-muted-foreground">
              {(preview.preview || []).map((p: any, i: number) => (
                <li key={i}>
                  {p.email} — {p.testName || "no attempt yet"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailRemindersPanel;
