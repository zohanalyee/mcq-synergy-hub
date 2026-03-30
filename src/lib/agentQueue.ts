import { supabase } from "@/integrations/supabase/client";

export type AgentTaskType = 'blog' | 'mcq' | 'scholarship' | 'job';
export type AgentTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'review';

export interface AgentTask {
  id: string;
  task_type: AgentTaskType;
  status: AgentTaskStatus;
  priority: number;
  input_data: Record<string, any>;
  output_data: Record<string, any> | null;
  quality_score: Record<string, any> | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  needs_review: boolean;
  created_by: string | null;
}

export interface TaskFilters {
  status?: AgentTaskStatus;
  task_type?: AgentTaskType;
  needs_review?: boolean;
  limit?: number;
}

export interface TaskStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  review: number;
  total: number;
}

export async function createTask(
  taskType: AgentTaskType,
  inputData: Record<string, any>,
  priority: number = 0
): Promise<AgentTask | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .insert({
      task_type: taskType,
      input_data: inputData,
      priority,
      created_by: user?.id || null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[agentQueue] createTask error:', error.message);
    throw new Error(error.message);
  }

  return data as unknown as AgentTask;
}

export async function getTasks(filters: TaskFilters = {}): Promise<AgentTask[]> {
  let query = supabase
    .from('agent_tasks' as any)
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(filters.limit || 50);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.task_type) {
    query = query.eq('task_type', filters.task_type);
  }
  if (filters.needs_review !== undefined) {
    query = query.eq('needs_review', filters.needs_review);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[agentQueue] getTasks error:', error.message);
    throw new Error(error.message);
  }

  return (data || []) as unknown as AgentTask[];
}

export async function getTaskStats(): Promise<TaskStats> {
  const { data, error } = await supabase
    .from('agent_tasks' as any)
    .select('status');

  if (error) {
    console.error('[agentQueue] getTaskStats error:', error.message);
    return { pending: 0, processing: 0, completed: 0, failed: 0, review: 0, total: 0 };
  }

  const tasks = (data || []) as unknown as { status: AgentTaskStatus }[];
  const stats: TaskStats = { pending: 0, processing: 0, completed: 0, failed: 0, review: 0, total: tasks.length };

  for (const task of tasks) {
    if (task.status in stats) {
      stats[task.status as keyof Omit<TaskStats, 'total'>]++;
    }
  }

  return stats;
}

export async function approveTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('agent_tasks' as any)
    .update({ status: 'completed', needs_review: false, completed_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

export async function rejectTask(taskId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('agent_tasks' as any)
    .update({ status: 'failed', error_message: reason, needs_review: false, completed_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

export async function retryTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('agent_tasks' as any)
    .update({ status: 'pending', error_message: null, started_at: null, retry_count: 0 })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

export async function triggerProcessing(): Promise<any> {
  const { data, error } = await supabase.functions.invoke('process-agent-tasks');

  if (error) {
    console.error('[agentQueue] triggerProcessing error:', error.message);
    throw new Error(error.message);
  }

  return data;
}
