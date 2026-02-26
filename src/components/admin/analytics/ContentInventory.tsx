import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  AlertTriangle, 
  Archive, 
  BookOpen, 
  CheckCircle2, 
  FolderTree,
  RefreshCw,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TopicInventory {
  canonical_name: string;
  display_name: string;
  subject_name: string;
  board_count: number;
  board_names: string[];
  total_questions: number;
  status: 'good' | 'low' | 'empty';
}

interface LMSItem {
  id: string;
  name: string;
}

const ContentInventory = () => {
  const [inventory, setInventory] = useState<TopicInventory[]>([]);
  const [loading, setLoading] = useState(true);

  const [systems, setSystems] = useState<LMSItem[]>([]);
  const [levels, setLevels] = useState<(LMSItem & { system_id: string })[]>([]);
  const [subjects, setSubjects] = useState<(LMSItem & { level_id: string })[]>([]);

  const [selectedBoard, setSelectedBoard] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Load hierarchy data
  useEffect(() => {
    const loadHierarchy = async () => {
      const [sysRes, lvlRes, subRes] = await Promise.all([
        supabase.from('educational_systems').select('id, name').eq('is_active', true).order('name'),
        supabase.from('levels').select('id, name, system_id').order('name'),
        supabase.from('subjects').select('id, name, level_id').order('name'),
      ]);
      if (sysRes.data) setSystems(sysRes.data);
      if (lvlRes.data) setLevels(lvlRes.data as any);
      if (subRes.data) setSubjects(subRes.data as any);
    };
    loadHierarchy();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_topic_inventory', {
        board_filter: selectedBoard,
        class_filter: selectedClass,
        subject_filter: selectedSubject,
      });
      if (error) throw error;
      setInventory((data || []) as TopicInventory[]);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      toast.error("Failed to load content inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedBoard, selectedClass, selectedSubject]);

  const filteredLevels = selectedBoard !== "all" ? levels.filter(l => l.system_id === selectedBoard) : [];
  const filteredSubjects = selectedClass !== "all" ? subjects.filter(s => s.level_id === selectedClass) : [];

  const filteredInventory = useMemo(() => {
    if (selectedStatus === "all") return inventory;
    return inventory.filter(item => item.status === selectedStatus);
  }, [inventory, selectedStatus]);

  // Summary stats
  const totalQuestions = useMemo(() => inventory.reduce((sum, i) => sum + Number(i.total_questions), 0), [inventory]);
  const lowCount = useMemo(() => inventory.filter(i => i.status === 'low').length, [inventory]);
  const emptyCount = useMemo(() => inventory.filter(i => i.status === 'empty').length, [inventory]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Inventory
          </h2>
          <p className="text-sm text-muted-foreground">
            Read-only overview of question counts per topic across all boards
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadInventory} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5" /> Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{totalQuestions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" /> Total Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{inventory.length}</p>
          </CardContent>
        </Card>
        <Card className={lowCount > 0 ? "border-amber-500/50 bg-amber-500/5" : ""}>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Low Content
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className={`text-2xl font-bold ${lowCount > 0 ? "text-amber-600" : ""}`}>{lowCount}</p>
            <p className="text-[10px] text-muted-foreground">50-99 questions</p>
          </CardContent>
        </Card>
        <Card className={emptyCount > 0 ? "border-destructive/50 bg-destructive/5" : "border-green-500/50 bg-green-500/5"}>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              {emptyCount > 0 ? <XCircle className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
              Empty Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className={`text-2xl font-bold ${emptyCount > 0 ? "text-destructive" : "text-green-600"}`}>{emptyCount}</p>
            <p className="text-[10px] text-muted-foreground">&lt;50 questions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={selectedBoard} onValueChange={(v) => { setSelectedBoard(v); setSelectedClass("all"); setSelectedSubject("all"); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Boards" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Boards</SelectItem>
            {systems.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSubject("all"); }} disabled={selectedBoard === "all"}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {filteredLevels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={selectedClass === "all"}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="good">✅ Good</SelectItem>
            <SelectItem value="low">⚠️ Low</SelectItem>
            <SelectItem value="empty">❌ Empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      {filteredInventory.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No topics found matching filters
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Boards</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.canonical_name}>
                    <TableCell className="font-medium">{item.display_name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.subject_name}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="text-xs">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {item.board_count} {item.board_count === 1 ? 'board' : 'boards'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{item.board_names.join(', ')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right font-mono">{Number(item.total_questions).toLocaleString()}</TableCell>
                    <TableCell>
                      {item.status === 'good' && <Badge className="bg-green-600 text-white">✅ Good</Badge>}
                      {item.status === 'low' && <Badge className="bg-amber-500 text-white">⚠️ Low</Badge>}
                      {item.status === 'empty' && <Badge variant="destructive">❌ Empty</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default ContentInventory;
