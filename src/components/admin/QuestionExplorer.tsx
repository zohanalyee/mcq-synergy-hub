import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Database,
  RefreshCw, Search, Layers, Copy, Download, ShieldAlert, Trash2, EyeOff, Loader2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ExplorerRow {
  id: string;
  pool: string;
  question_text: string;
  status: string;
  subject: string | null;
  topic: string | null;
  difficulty: string | null;
  mock_test_count: number;
  mock_test_names: string[] | null;
  in_both_pools: boolean;
  duplicate_copies: number;
  usage_count: number | null;
  last_used_at: string | null;
  created_at: string;
  total_count: number;
}

const PAGE_SIZE = 50;

const SORTABLE: { key: string; label: string; className?: string }[] = [
  { key: "question_text", label: "Question" },
  { key: "status", label: "Status" },
  { key: "subject", label: "Subject" },
  { key: "topic", label: "Topic" },
  { key: "difficulty", label: "Difficulty" },
  { key: "mock_test_count", label: "Mock tests" },
  { key: "duplicate_copies", label: "Copies" },
  { key: "usage_count", label: "Used" },
  { key: "created_at", label: "Created" },
];

const QuestionExplorer = () => {
  const [rows, setRows] = useState<ExplorerRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Map<string, ExplorerRow>>(new Map());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [running, setRunning] = useState(false);

  const [pool, setPool] = useState("all");
  const [status, setStatus] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [relationship, setRelationship] = useState("all");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadStats = async () => {
    const { data, error } = await (supabase as any).rpc("get_question_explorer_stats");
    if (!error) setStats(data);
  };

  const loadRows = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_question_explorer", {
      p_pool: pool,
      p_status: status === "all" ? null : status,
      p_subject: subject.trim() || null,
      p_topic: topic.trim() || null,
      p_difficulty: difficulty === "all" ? null : difficulty,
      p_search: search.trim() || null,
      p_relationship: relationship === "all" ? null : relationship,
      p_sort: sort,
      p_dir: dir,
      p_limit: PAGE_SIZE,
      p_offset: page * PAGE_SIZE,
    });
    if (error) {
      console.error(error);
      toast.error("Could not load questions", { description: error.message });
      setRows([]);
    } else {
      setRows((data || []) as ExplorerRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, status, difficulty, relationship, subject, topic, search, sort, dir, page]);

  // reset to first page whenever filters change
  useEffect(() => {
    setPage(0);
    setSelected(new Map());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, status, difficulty, relationship, subject, topic, search]);

  const toggleSort = (key: string) => {
    if (sort === key) setDir(dir === "asc" ? "desc" : "asc");
    else { setSort(key); setDir(key === "question_text" || key === "subject" || key === "topic" ? "asc" : "desc"); }
  };

  const toggleRow = (row: ExplorerRow) => {
    setSelected(prev => {
      const next = new Map(prev);
      const key = rowKey(row);
      next.has(key) ? next.delete(key) : next.set(key, row);
      return next;
    });
  };

  const allOnPageSelected = rows.length > 0 && rows.every(r => selected.has(rowKey(r)));
  const toggleAllOnPage = () => {
    setSelected(prev => {
      const next = new Map(prev);
      if (allOnPageSelected) rows.forEach(r => next.delete(rowKey(r)));
      else rows.forEach(r => next.set(rowKey(r), r));
      return next;
    });
  };

  const selectedRows = useMemo(() => Array.from(selected.values()), [selected]);
  const libraryIds = useMemo(() => selectedRows.filter(r => r.pool !== "mock").map(r => r.id), [selectedRows]);
  const mockIds = useMemo(() => selectedRows.filter(r => r.pool === "mock").map(r => r.id), [selectedRows]);

  const holdablePreview = useMemo(() => {
    const groups = new Map<string, number>();
    selectedRows.filter(r => r.pool !== "mock").forEach(r => {
      const k = (r.question_text || "").trim().toLowerCase();
      groups.set(k, (groups.get(k) || 0) + 1);
    });
    let keep = 0, hold = 0;
    groups.forEach(count => { keep += 1; hold += Math.max(0, count - 1); });
    return { keep, hold, groups: groups.size };
  }, [selectedRows]);

  const exportCsv = () => {
    const source = selectedRows.length > 0 ? selectedRows : rows;
    if (source.length === 0) { toast.error("Nothing to export"); return; }
    const headers = [
      "pool", "id", "question_text", "status", "subject", "topic", "difficulty",
      "mock_test_count", "mock_test_names", "in_both_pools", "duplicate_copies",
      "usage_count", "last_used_at", "created_at",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    const csv = [
      headers.join(","),
      ...source.map(r => [
        r.pool, r.id, r.question_text, r.status, r.subject, r.topic, r.difficulty,
        r.mock_test_count, (r.mock_test_names || []).join(" | "), r.in_both_pools,
        r.duplicate_copies, r.usage_count, r.last_used_at, r.created_at,
      ].map(esc).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `question-explorer-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${source.length} rows`);
  };

  const runBulkAction = async () => {
    if (!pendingAction) return;
    setRunning(true);
    const { data, error } = await (supabase as any).rpc("question_explorer_bulk_action", {
      p_action: pendingAction,
      p_library_ids: pendingAction === "unapprove_mock" ? [] : libraryIds,
      p_mock_ids: pendingAction === "keep_one_hold_rest" ? [] : mockIds,
    });
    setRunning(false);
    setPendingAction(null);
    if (error) {
      toast.error("Bulk action failed", { description: error.message });
      return;
    }
    const res = data || {};
    toast.success("Bulk action recorded", {
      description: `Library: ${res.library_affected ?? 0} · Mock: ${res.mock_affected ?? 0}`,
    });
    setSelected(new Map());
    loadRows();
    loadStats();
  };

  const statCards = useMemo(() => {
    if (!stats) return [];
    const lib = stats.library || {};
    const mock = stats.mock || {};
    const combined = stats.combined || {};
    return [
      { label: "Combined questions", value: combined.total ?? 0, hint: `${combined.approved ?? 0} live` },
      { label: "Library (topics)", value: lib.total ?? 0, hint: `${lib.approved ?? 0} approved · ${lib.pending ?? 0} pending · ${lib.flagged_duplicate ?? 0} held` },
      { label: "Mock test bank", value: mock.total ?? 0, hint: `${mock.approved ?? 0} approved · ${mock.unapproved ?? 0} pending` },
      { label: "Selected", value: selected.size, hint: "for bulk cleanup" },
    ];
  }, [stats, selected.size]);

  const resetFilters = () => {
    setPool("all"); setStatus("all"); setDifficulty("all"); setRelationship("all");
    setSubject(""); setTopic(""); setSearchInput(""); setSearch("");
  };

  return (
    <div className="space-y-3">
      <Card className="border-cyan-500/15 bg-gradient-to-br from-card to-cyan-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-5 w-5 text-cyan-400" />
            Question Explorer
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Read-only view across the topic library and the mock test bank. Nothing here runs automatically.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {statCards.map(card => (
              <div key={card.label} className="rounded-lg border border-border/60 bg-background/40 p-2.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold">{Number(card.value).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">{card.hint}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[220px] flex gap-2">
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") setSearch(searchInput); }}
                placeholder="Search question text…"
                className="h-9"
              />
              <Button size="sm" variant="outline" className="h-9" onClick={() => setSearch(searchInput)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={pool} onValueChange={setPool}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Both pools</SelectItem>
                <SelectItem value="library">Library only</SelectItem>
                <SelectItem value="mock">Mock tests only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="flagged_duplicate">Held as duplicate</SelectItem>
                <SelectItem value="unapproved">Unapproved (mock)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any difficulty</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger className="h-9 w-[210px]"><SelectValue placeholder="Relationship" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All relationships</SelectItem>
                <SelectItem value="multi_mock">Used in 2+ mock tests</SelectItem>
                <SelectItem value="both_pools">Exists in both pools</SelectItem>
                <SelectItem value="duplicates_2">Has 2+ copies</SelectItem>
                <SelectItem value="duplicates_3">Has 3+ copies</SelectItem>
                <SelectItem value="duplicates_5">Has 5+ copies</SelectItem>
                <SelectItem value="never_used">Never used</SelectItem>
              </SelectContent>
            </Select>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="h-9 w-[150px]" />
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic" className="h-9 w-[150px]" />
            <Button size="sm" variant="ghost" className="h-9" onClick={resetFilters}>Clear</Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => { loadRows(); loadStats(); }} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} /> Refresh
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{loading ? "Loading…" : `${total.toLocaleString()} matching questions`}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 px-2" disabled={page === 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span>Page {page + 1} of {totalPages}</span>
              <Button size="sm" variant="outline" className="h-7 px-2" disabled={page + 1 >= totalPages || loading} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 overflow-auto max-h-[620px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAllOnPage} aria-label="Select page" />
                  </TableHead>
                  {SORTABLE.map(col => (
                    <TableHead
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="cursor-pointer select-none whitespace-nowrap text-xs"
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sort === col.key && (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={SORTABLE.length + 1} className="text-center text-sm text-muted-foreground py-8">
                      No questions match these filters.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map(row => (
                  <TableRow key={`${row.pool}-${row.id}`} className="align-top">
                    <TableCell>
                      <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleRow(row.id)} aria-label="Select question" />
                    </TableCell>
                    <TableCell className="max-w-[420px]">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className={cn("shrink-0 text-[10px]", row.pool === "mock" ? "border-violet-500/40 text-violet-400" : "border-cyan-500/40 text-cyan-400")}>
                          {row.pool === "mock" ? "Mock" : "Library"}
                        </Badge>
                        <span className="text-xs leading-snug">{row.question_text}</span>
                      </div>
                      {row.in_both_pools && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-400">
                          <Copy className="h-3 w-3" /> also in the other pool
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{row.status}</TableCell>
                    <TableCell className="text-xs">{row.subject || "—"}</TableCell>
                    <TableCell className="text-xs">{row.topic || "—"}</TableCell>
                    <TableCell className="text-xs">{row.difficulty || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {row.mock_test_count > 0 ? (
                        <button
                          className="underline decoration-dotted"
                          onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                        >
                          {row.mock_test_count}
                        </button>
                      ) : "0"}
                      {expanded === row.id && row.mock_test_names?.length ? (
                        <ul className="mt-1 space-y-0.5 text-[10px] text-muted-foreground max-w-[220px]">
                          {row.mock_test_names.map((n, i) => <li key={i}>• {n}</li>)}
                        </ul>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.duplicate_copies > 1
                        ? <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">{row.duplicate_copies}</Badge>
                        : row.duplicate_copies}
                    </TableCell>
                    <TableCell className="text-xs">{row.usage_count ?? 0}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-2.5 text-xs">
              <Database className="h-4 w-4 text-cyan-400" />
              <span>{selected.size} selected. Bulk cleanup actions arrive in the next batch.</span>
              <Button size="sm" variant="ghost" className="h-7 ml-auto" onClick={() => setSelected(new Set())}>Clear selection</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionExplorer;
