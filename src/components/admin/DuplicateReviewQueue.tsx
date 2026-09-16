import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  Trash2,
  RefreshCw,
  Loader2,
  Eye,
  Scale,
  Layers,
  ScanSearch,
  CheckCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cleanQuestionText } from "@/lib/questionUtils";

interface ClusterMember {
  id: string;
  title: string;
  options: unknown[] | null;
  correct_option: string | null;
  explanation: string | null;
  status: string;
  subject: string | null;
  difficulty: string | null;
  created_at: string;
  show_in_subjects: boolean | null;
  show_in_mock_tests: boolean | null;
}

interface DuplicateCluster {
  cluster_key: string;
  copies: number;
  sample_title: string;
  subject: string | null;
  difficulty: string | null;
  approved_count: number;
  flagged_count: number;
  members: ClusterMember[];
}

interface ClusterStats {
  total_groups: number;
  total_rows: number;
  extra_copies: number;
  approved_dup_groups: number;
}

interface DismissedEntry {
  hash: string;
  resolved_at: string | null;
}

interface ScanRun {
  scanned_at: string;
  total_approved: number;
  total_mcqs: number;
  groups: number;
  extra_copies: number;
  approved_dup_groups: number;
  new_groups: number;
  new_copies: number;
  trigger_source: string;
}

const DISMISSED_KEY = "duplicate_review_dismissed";

// Stable short hash so we never store very long question text in settings
const hashKey = (input: string) => {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return `${(h >>> 0).toString(36)}-${input.length}`;
};

const normalizeTitle = (title: string) =>
  (title || "").replace(/\[FORCE-SAVE-[^\]]*\]/g, "").trim().toLowerCase();

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  flagged_duplicate: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
};

const DuplicateReviewQueue = () => {
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [dismissed, setDismissed] = useState<DismissedEntry[]>([]);
  const [scanRun, setScanRun] = useState<ScanRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDismissed = useCallback(async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", DISMISSED_KEY)
      .maybeSingle();
    const value = data?.value as { keys?: (string | DismissedEntry)[] } | null;
    const raw = Array.isArray(value?.keys) ? value!.keys! : [];
    // Legacy entries were bare hashes with no timestamp — treat them as resolved long ago
    // so a group that has received new copies since then comes back for review.
    setDismissed(
      raw.map((entry) =>
        typeof entry === "string" ? { hash: entry, resolved_at: null } : entry
      )
    );
    return raw.length;
  }, []);

  const loadClusters = useCallback(async () => {
    const [{ data: clusterData, error }, { data: statsData }] = await Promise.all([
      supabase.rpc("get_duplicate_clusters", { _limit: 300, _offset: 0 }),
      supabase.rpc("get_duplicate_cluster_stats"),
    ]);

    if (error) throw error;

    setClusters(
      ((clusterData || []) as unknown as DuplicateCluster[]).map((c) => ({
        ...c,
        members: Array.isArray(c.members) ? c.members : [],
      }))
    );
    setStats((statsData as unknown as ClusterStats[])?.[0] ?? null);
  }, []);

  const loadScanRun = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("duplicate_scan_runs")
      .select(
        "scanned_at, total_approved, total_mcqs, groups, extra_copies, approved_dup_groups, new_groups, new_copies, trigger_source"
      )
      .order("scanned_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setScanRun((data as ScanRun) ?? null);
  }, []);

  const refresh = useCallback(
    async (isScan = false) => {
      isScan ? setScanning(true) : setLoading(true);
      try {
        if (isScan) {
          // Records a scan snapshot (read-only on questions) so "new since last scan" stays accurate.
          const { error: scanErr } = await (supabase as any).rpc("run_duplicate_scan", {
            _trigger_source: "admin",
          });
          if (scanErr) console.error("Scan snapshot failed:", scanErr);
        }
        await Promise.all([loadClusters(), loadDismissed(), loadScanRun()]);
        if (isScan) toast.success("Library scan complete");
      } catch (err) {
        console.error("Error loading duplicate clusters:", err);
        toast.error("Failed to scan for duplicates");
      } finally {
        isScan ? setScanning(false) : setLoading(false);
      }
    },
    [loadClusters, loadDismissed, loadScanRun]
  );

  // Fresh scan every time the tab is opened (component mounts).
  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistDismissed = async (entries: DismissedEntry[]) => {
    setDismissed(entries);
    const { data: existing, error: readErr } = await supabase
      .from("system_settings")
      .select("id")
      .eq("key", DISMISSED_KEY)
      .maybeSingle();

    if (readErr) throw readErr;

    const payload = { keys: entries } as unknown as never;

    if (existing?.id) {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: payload })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("system_settings").insert([
        {
          key: DISMISSED_KEY,
          value: payload,
          description: "Duplicate groups already reviewed by an admin",
        },
      ] as never);
      if (error) throw error;
    }
  };

  const markReviewed = async (clusterKey: string) => {
    const hash = hashKey(clusterKey);
    const next = [
      ...dismissed.filter((d) => d.hash !== hash),
      { hash, resolved_at: new Date().toISOString() },
    ];
    await persistDismissed(next);
  };

  // A resolved group only stays hidden while no copy is newer than the decision.
  const isResolved = (cluster: DuplicateCluster) => {
    const entry = dismissed.find((d) => d.hash === hashKey(cluster.cluster_key));
    if (!entry) return false;
    if (!entry.resolved_at) return true; // legacy marker, no timestamp to compare
    const newest = cluster.members.reduce(
      (max, m) => (m.created_at > max ? m.created_at : max),
      ""
    );
    return !newest || new Date(newest) <= new Date(entry.resolved_at);
  };

  const visibleClusters = clusters.filter((c) => !isResolved(c));
  const selected = visibleClusters.find((c) => c.cluster_key === selectedKey) || null;

  // Re-read the group's live copies so anything generated after the last scan is included.
  const fetchLiveMembers = async (cluster: DuplicateCluster): Promise<string[]> => {
    const { data, error } = await supabase
      .from("content_items")
      .select("id, title")
      .eq("category", "mcq")
      .ilike("title", `%${cluster.sample_title.slice(0, 60).replace(/[%_]/g, " ")}%`)
      .limit(200);

    if (error) {
      // Fall back to the snapshot rather than blocking the admin action
      console.error("Live member lookup failed:", error);
      return cluster.members.map((m) => m.id);
    }

    const live = (data || [])
      .filter((row) => normalizeTitle(row.title) === cluster.cluster_key)
      .map((row) => row.id);

    return Array.from(new Set([...cluster.members.map((m) => m.id), ...live]));
  };

  const finishCluster = async (cluster: DuplicateCluster) => {
    await markReviewed(cluster.cluster_key);
    setClusters((prev) => prev.filter((c) => c.cluster_key !== cluster.cluster_key));
    if (selectedKey === cluster.cluster_key) setSelectedKey(null);
  };

  // Keep the chosen copy, discard the rest of the group
  const handleKeepOne = async (cluster: DuplicateCluster, keepId: string) => {
    setActionLoading(cluster.cluster_key);
    try {
      const allIds = await fetchLiveMembers(cluster);

      const { error: upErr } = await supabase
        .from("content_items")
        .update({ status: "approved", show_in_subjects: true, show_in_mock_tests: true })
        .eq("id", keepId);
      if (upErr) throw upErr;

      const others = allIds.filter((id) => id !== keepId);
      if (others.length > 0) {
        const { error: delErr } = await supabase
          .from("content_items")
          .delete()
          .in("id", others);
        if (delErr) throw delErr;
      }

      await finishCluster(cluster);
      toast.success(`Kept 1 question, removed ${others.length} duplicate copies`);
    } catch (err) {
      console.error("Error keeping one:", err);
      toast.error("Failed to resolve this group — nothing was marked reviewed");
    } finally {
      setActionLoading(null);
    }
  };

  // Not actually duplicates — approve every copy in the group
  const handleKeepAll = async (cluster: DuplicateCluster) => {
    setActionLoading(cluster.cluster_key);
    try {
      const allIds = await fetchLiveMembers(cluster);
      const { error } = await supabase
        .from("content_items")
        .update({ status: "approved", show_in_subjects: true, show_in_mock_tests: true })
        .in("id", allIds);
      if (error) throw error;

      await finishCluster(cluster);
      toast.success(`Approved all ${allIds.length} questions in this group`);
    } catch (err) {
      console.error("Error keeping all:", err);
      toast.error("Failed to approve this group — nothing was marked reviewed");
    } finally {
      setActionLoading(null);
    }
  };

  // Discard newer copies, keep the oldest approved (or oldest) one untouched
  const handleDiscardGroup = async (cluster: DuplicateCluster) => {
    setActionLoading(cluster.cluster_key);
    try {
      const keeper =
        cluster.members.find((m) => m.status === "approved") || cluster.members[0];
      const allIds = await fetchLiveMembers(cluster);
      const removeIds = allIds.filter((id) => id !== keeper.id);

      if (removeIds.length > 0) {
        const { error } = await supabase.from("content_items").delete().in("id", removeIds);
        if (error) throw error;
      }

      await finishCluster(cluster);
      toast.success(`Removed ${removeIds.length} extra copies`);
    } catch (err) {
      console.error("Error discarding group:", err);
      toast.error("Failed to discard this group — nothing was marked reviewed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReviewed = async (cluster: DuplicateCluster) => {
    setActionLoading(cluster.cluster_key);
    try {
      await finishCluster(cluster);
      toast.success("Marked as reviewed — it only returns if new copies appear");
    } catch (err) {
      console.error("Error marking reviewed:", err);
      toast.error("Couldn't save the reviewed mark — please try again");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const reviewedCount = stats ? Math.max(stats.total_groups - visibleClusters.length, 0) : 0;

  return (
    <div className="space-y-4">
      {/* Stats + scan */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={() => refresh(true)}
            disabled={scanning}
            className="min-h-[44px] sm:min-h-0"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <ScanSearch className="h-4 w-4 mr-1.5" />
            )}
            Scan Library
          </Button>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Groups: {stats?.total_groups ?? 0}</Badge>
            <Badge variant="outline">Extra copies: {stats?.extra_copies ?? 0}</Badge>
            <Badge variant="outline">Already approved dupes: {stats?.approved_dup_groups ?? 0}</Badge>
            <Badge variant="secondary">Reviewed: {reviewedCount}</Badge>
            <Badge className="bg-primary/15 text-primary border-primary/30">
              Pending: {visibleClusters.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: cluster list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Duplicate Groups
                  <Badge variant="secondary">{visibleClusters.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Same question saved more than once — review the whole group at once
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => refresh()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {visibleClusters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">All clear!</p>
                <p className="text-sm">No duplicate groups left to review</p>
              </div>
            ) : (
              <ScrollArea className="h-[440px] pr-4">
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {visibleClusters.map((c) => (
                      <motion.div
                        key={c.cluster_key}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedKey === c.cluster_key
                            ? "bg-primary/10 border-primary"
                            : "border-border/60 bg-card/70 hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedKey(c.cluster_key)}
                      >
                        <p className="text-sm font-medium line-clamp-2">
                          {cleanQuestionText(c.sample_title)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                            <Layers className="h-3 w-3 mr-1" />
                            {c.copies} copies
                          </Badge>
                          {c.approved_count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {c.approved_count} approved
                            </Badge>
                          )}
                          {c.subject && (
                            <Badge variant="outline" className="text-xs">{c.subject}</Badge>
                          )}
                          {c.difficulty && (
                            <Badge variant="secondary" className="text-xs">{c.difficulty}</Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Right: group comparison */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 text-primary" />
              Group Comparison
              {selected && (
                <Badge variant="secondary">{selected.members.length} copies</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selected
                ? "Scroll through every copy below, then decide once"
                : "Compare every copy in the group and decide once"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a group to compare</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Fixed height (not max-height) so the scroll viewport can actually scroll */}
                <ScrollArea className="h-[420px] pr-3">
                  <div className="space-y-3">
                    {selected.members.map((m, idx) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-lg border border-border/60 bg-card/70 backdrop-blur-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Copy {idx + 1} of {selected.members.length}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${STATUS_STYLES[m.status] || ""}`}
                          >
                            {m.status}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-2">{cleanQuestionText(m.title)}</p>
                        {Array.isArray(m.options) && (
                          <div className="space-y-1 text-xs">
                            {m.options.map((opt, i) => (
                              <div
                                key={i}
                                className={`p-1.5 rounded ${
                                  String(opt) === String(m.correct_option)
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                    : "bg-muted"
                                }`}
                              >
                                {String.fromCharCode(65 + i)}) {String(opt)}
                              </div>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full min-h-[44px] sm:min-h-0"
                          onClick={() => handleKeepOne(selected, m.id)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === selected.cluster_key ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Keep this one only
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    className="min-h-[44px] sm:min-h-0 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleKeepAll(selected)}
                    disabled={!!actionLoading}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Keep All
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="min-h-[44px] sm:min-h-0"
                    onClick={() => handleDiscardGroup(selected)}
                    disabled={!!actionLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Discard Extras
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] sm:min-h-0"
                    onClick={() => handleMarkReviewed(selected)}
                    disabled={!!actionLoading}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Mark Reviewed
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DuplicateReviewQueue;
