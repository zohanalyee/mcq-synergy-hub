import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Clock, CheckCircle, XCircle, AlertTriangle, Play,
  RefreshCw, Plus, Loader2, Eye, RotateCcw, ThumbsUp, ThumbsDown,
  Zap, FileText, Briefcase, GraduationCap, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getTasks, getTaskStats, createTask, approveTask, rejectTask,
  retryTask, triggerProcessing,
  type AgentTask, type AgentTaskType, type AgentTaskStatus, type TaskStats,
} from "@/lib/agentQueue";
import QuotaMonitor from "./QuotaMonitor";
import EmptyTopicAnalytics from "./EmptyTopicAnalytics";
import DuplicateReviewQueue from "./DuplicateReviewQueue";

const typeIcons: Record<AgentTaskType, React.ElementType> = {
  blog: FileText,
  mcq: Brain,
  job: Briefcase,
  scholarship: GraduationCap,
};

const typeColors: Record<AgentTaskType, string> = {
  blog: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  mcq: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  job: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  scholarship: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const statusConfig: Record<AgentTaskStatus, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Clock, label: "Pending" },
  processing: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Loader2, label: "Processing" },
  completed: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle, label: "Completed" },
  failed: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle, label: "Failed" },
  review: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Eye, label: "Review" },
};

const AgentDashboard = () => {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTask, setNewTask] = useState({ type: 'blog' as AgentTaskType, title: '', topic: '', keywords: '', priority: 0 });

  const { data: stats, isLoading: statsLoading } = useQuery<TaskStats>({
    queryKey: ["agent-task-stats"],
    queryFn: getTaskStats,
    refetchInterval: 15000,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<AgentTask[]>({
    queryKey: ["agent-tasks", statusFilter, typeFilter],
    queryFn: () => getTasks({
      ...(statusFilter !== 'all' && { status: statusFilter as AgentTaskStatus }),
      ...(typeFilter !== 'all' && { task_type: typeFilter as AgentTaskType }),
      limit: 50,
    }),
    refetchInterval: 10000,
  });

  const { data: reviewTasks = [] } = useQuery<AgentTask[]>({
    queryKey: ["agent-tasks-review"],
    queryFn: () => getTasks({ needs_review: true, limit: 20 }),
    refetchInterval: 15000,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["agent-task"] });
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const result = await triggerProcessing();
      toast.success(`Processed ${result?.processed || 0} tasks`);
      refreshAll();
    } catch (e: any) {
      toast.error("Processing failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreate = async () => {
    try {
      const inputData: Record<string, any> = { title: newTask.title, topic: newTask.topic };
      if (newTask.keywords) inputData.keywords = newTask.keywords.split(',').map(k => k.trim());
      
      await createTask(newTask.type, inputData, newTask.priority);
      toast.success("Task created successfully");
      setShowCreateDialog(false);
      setNewTask({ type: 'blog', title: '', topic: '', keywords: '', priority: 0 });
      refreshAll();
    } catch (e: any) {
      toast.error("Failed to create task: " + e.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveTask(id);
      toast.success("Task approved");
      refreshAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectTask(id, "Rejected by admin");
      toast.success("Task rejected");
      refreshAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryTask(id);
      toast.success("Task queued for retry");
      refreshAll();
    } catch (e: any) { toast.error(e.message); }
  };

  const statCards = [
    { label: "Pending", value: stats?.pending || 0, icon: Clock, color: "text-slate-400", bg: "from-slate-500/10" },
    { label: "Processing", value: stats?.processing || 0, icon: Loader2, color: "text-blue-400", bg: "from-blue-500/10" },
    { label: "Completed", value: stats?.completed || 0, icon: CheckCircle, color: "text-emerald-400", bg: "from-emerald-500/10" },
    { label: "Failed", value: stats?.failed || 0, icon: XCircle, color: "text-red-400", bg: "from-red-500/10" },
    { label: "Review", value: stats?.review || 0, icon: Eye, color: "text-amber-400", bg: "from-amber-500/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold">AI Agent Dashboard</h2>
          <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-400">
            {stats?.total || 0} total tasks
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} className="border-border/50">
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)} className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Task
          </Button>
          <Button size="sm" onClick={handleProcess} disabled={isProcessing} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0">
            {isProcessing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
            Process Queue
          </Button>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-muted/30 border border-border/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queue">Task Queue</TabsTrigger>
          <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
          <TabsTrigger value="quota">AI Usage</TabsTrigger>
          <TabsTrigger value="review">Review ({reviewTasks.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={cn("border-border/30 bg-gradient-to-br", stat.bg, "to-transparent")}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Icon className={cn("h-4 w-4", stat.color)} />
                        <span className={cn("text-2xl font-bold", stat.color)}>{stat.value}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <QuotaMonitor />

          {/* Recent Tasks */}
          <Card className="border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Create your first task!</p>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => {
                    const TypeIcon = typeIcons[task.task_type];
                    const sc = statusConfig[task.status];
                    const StatusIcon = sc.icon;
                    return (
                      <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/20">
                        <div className="flex items-center gap-2">
                          <TypeIcon className={cn("h-4 w-4", typeColors[task.task_type].split(' ')[0])} />
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {(task.input_data as any)?.title || task.task_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[10px]", sc.color)}>
                            <StatusIcon className={cn("h-3 w-3 mr-1", task.status === 'processing' && 'animate-spin')} />
                            {sc.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Queue Tab */}
        <TabsContent value="queue" className="space-y-3">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="review">Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="mcq">MCQ</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="scholarship">Scholarship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/30">
            <Table>
              <TableHeader>
                <TableRow className="border-border/20">
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No tasks found</TableCell></TableRow>
                ) : (
                  tasks.map((task) => {
                    const TypeIcon = typeIcons[task.task_type];
                    const sc = statusConfig[task.status];
                    const StatusIcon = sc.icon;
                    return (
                      <TableRow key={task.id} className="border-border/10">
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", typeColors[task.task_type])}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {task.task_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {(task.input_data as any)?.title || (task.input_data as any)?.topic || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", sc.color)}>
                            <StatusIcon className={cn("h-3 w-3 mr-1", task.status === 'processing' && 'animate-spin')} />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{task.priority}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {task.status === 'review' && (
                              <>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleApprove(task.id)}>
                                  <ThumbsUp className="h-3 w-3 text-emerald-400" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleReject(task.id)}>
                                  <ThumbsDown className="h-3 w-3 text-red-400" />
                                </Button>
                              </>
                            )}
                            {task.status === 'failed' && (
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRetry(task.id)}>
                                <RotateCcw className="h-3 w-3 text-amber-400" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Content Gaps Tab */}
        <TabsContent value="gaps">
          <EmptyTopicAnalytics />
        </TabsContent>

        {/* AI Usage Tab */}
        <TabsContent value="quota">
          <QuotaMonitor />
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-4">
          {reviewTasks.length > 0 && (
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Agent Tasks Pending Review ({reviewTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reviewTasks.map((task) => {
                  const TypeIcon = typeIcons[task.task_type];
                  return (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn("h-4 w-4", typeColors[task.task_type].split(' ')[0])} />
                        <div>
                          <span className="text-sm font-medium">{(task.input_data as any)?.title || task.task_type}</span>
                          {task.error_message && <p className="text-[10px] text-red-400">{task.error_message}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500/20 text-emerald-400" onClick={() => handleApprove(task.id)}>
                          <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/20 text-red-400" onClick={() => handleReject(task.id)}>
                          <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
          <DuplicateReviewQueue />
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-400" /> Create Agent Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Task Type</Label>
              <Select value={newTask.type} onValueChange={(v) => setNewTask(p => ({ ...p, type: v as AgentTaskType }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog Post</SelectItem>
                  <SelectItem value="mcq">MCQ Generation</SelectItem>
                  <SelectItem value="job">Job Fetch</SelectItem>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input className="h-8 text-sm" placeholder="e.g., MDCAT Biology Tips" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Topic</Label>
              <Input className="h-8 text-sm" placeholder="e.g., Biology" value={newTask.topic} onChange={e => setNewTask(p => ({ ...p, topic: e.target.value }))} />
            </div>
            {newTask.type === 'blog' && (
              <div>
                <Label className="text-xs">Keywords (comma separated)</Label>
                <Input className="h-8 text-sm" placeholder="MDCAT, biology, tips" value={newTask.keywords} onChange={e => setNewTask(p => ({ ...p, keywords: e.target.value }))} />
              </div>
            )}
            <div>
              <Label className="text-xs">Priority (0-10)</Label>
              <Input type="number" min={0} max={10} className="h-8 text-sm w-20" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={!newTask.title || !newTask.topic} className="bg-gradient-to-r from-violet-600 to-purple-600 border-0">
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentDashboard;
