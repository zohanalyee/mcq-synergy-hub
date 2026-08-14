import { supabase } from "@/integrations/supabase/client";

// Types for Auto-Fill feature
export interface AIUsageToday {
  total_requests: number;
  total_questions_requested: number;
  total_questions_saved: number;
  daily_limit: number;
  remaining_requests: number;
}

export interface AutoFillQueueItem {
  topic_id: string;
  topic_name: string;
  subject_id: string;
  subject_name: string;
  level_name: string;
  system_name: string;
  current_count: number;
  questions_needed: number;
}

export interface LMSInventoryItem {
  system_name: string;
  level_name: string;
  subject_name: string;
  topic_id: string;
  topic_name: string;
  question_count: number;
  is_low_content: boolean;
}

export interface DifficultyWeights {
  easy: number;
  medium: number;
  hard: number;
}

export interface AutoFillConfig {
  enabled: boolean;
  min_threshold: number;
  batch_size: number;
  priority: 'lowest_first' | 'random';
  difficulty_weights?: DifficultyWeights;
  run_target?: number;
}

export interface AILimitConfig {
  max_requests: number;
  max_questions: number;
}

export interface LowContentThreshold {
  warning: number;
  critical: number;
}

// Fetch today's AI usage stats
export async function getAIUsageToday(): Promise<AIUsageToday | null> {
  const { data, error } = await supabase.rpc('get_ai_usage_today');
  
  if (error) {
    console.error('Error fetching AI usage:', error);
    return null;
  }
  
  return data?.[0] || null;
}

// Get priority queue for auto-fill (topics needing content)
export async function getAutoFillQueue(limit: number = 20): Promise<AutoFillQueueItem[]> {
  const { data, error } = await supabase.rpc('get_autofill_queue', { 
    limit_count: limit 
  });
  
  if (error) {
    console.error('Error fetching auto-fill queue:', error);
    return [];
  }
  
  return data || [];
}

// Get full LMS content inventory
export async function getLMSContentInventory(): Promise<LMSInventoryItem[]> {
  const { data, error } = await supabase.rpc('get_lms_content_inventory');
  
  if (error) {
    console.error('Error fetching LMS inventory:', error);
    return [];
  }
  
  return data || [];
}

// Get a specific system setting
export async function getSystemSetting<T>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error) {
    console.error(`Error fetching setting '${key}':`, error);
    return null;
  }
  
  return data?.value as T;
}

// Update a system setting
export async function updateSystemSetting<T>(key: string, value: T): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('system_settings')
    .update({ 
      value: value as any, 
      updated_at: new Date().toISOString(),
      updated_by: userData?.user?.id || null
    })
    .eq('key', key);
  
  if (error) {
    console.error(`Error updating setting '${key}':`, error);
    return false;
  }
  
  return true;
}

// Get auto-fill configuration
export async function getAutoFillConfig(): Promise<AutoFillConfig | null> {
  return getSystemSetting<AutoFillConfig>('auto_fill_config');
}

// Update auto-fill configuration
export async function updateAutoFillConfig(config: Partial<AutoFillConfig>): Promise<boolean> {
  const currentConfig = await getAutoFillConfig();
  if (!currentConfig) return false;
  
  const newConfig = { ...currentConfig, ...config };
  return updateSystemSetting('auto_fill_config', newConfig);
}

// Get AI daily limit configuration
export async function getAILimitConfig(): Promise<AILimitConfig | null> {
  return getSystemSetting<AILimitConfig>('ai_daily_limit');
}

// Update AI daily limit configuration
export async function updateAILimitConfig(config: Partial<AILimitConfig>): Promise<boolean> {
  const currentConfig = await getAILimitConfig();
  if (!currentConfig) return false;
  
  const newConfig = { ...currentConfig, ...config };
  return updateSystemSetting('ai_daily_limit', newConfig);
}

// Get low content threshold configuration
export async function getLowContentThreshold(): Promise<LowContentThreshold | null> {
  return getSystemSetting<LowContentThreshold>('low_content_threshold');
}

// Update low content threshold
export async function updateLowContentThreshold(config: Partial<LowContentThreshold>): Promise<boolean> {
  const currentConfig = await getLowContentThreshold();
  if (!currentConfig) return false;
  
  const newConfig = { ...currentConfig, ...config };
  return updateSystemSetting('low_content_threshold', newConfig);
}

// Check if auto-fill can proceed (has remaining quota)
export async function canAutoFill(): Promise<{ canProceed: boolean; reason?: string }> {
  const config = await getAutoFillConfig();
  
  if (!config?.enabled) {
    return { canProceed: false, reason: 'Auto-fill is disabled' };
  }
  
  const usage = await getAIUsageToday();
  
  if (!usage) {
    return { canProceed: false, reason: 'Unable to fetch usage data' };
  }
  
  if (usage.remaining_requests <= 0) {
    return { canProceed: false, reason: 'Daily limit reached' };
  }
  
  return { canProceed: true };
}

// Get summary stats for the auto-fill dashboard
export async function getAutoFillStats(): Promise<{
  usage: AIUsageToday | null;
  config: AutoFillConfig | null;
  queueCount: number;
  topPriorityTopics: AutoFillQueueItem[];
  lastRunInfo: { timestamp: string; questionsSaved: number } | null;
}> {
  // Single parallel fetch - no duplicate queue calls
  const [usage, config, queue, lastRun] = await Promise.all([
    getAIUsageToday(),
    getAutoFillConfig(),
    getAutoFillQueue(100),
    getLastAutoFillRun()
  ]);
  
  return {
    usage,
    config,
    queueCount: queue.length,
    topPriorityTopics: queue.slice(0, 5),
    lastRunInfo: lastRun
  };
}

// Get last auto-fill run info from logs
export async function getLastAutoFillRun(): Promise<{ timestamp: string; questionsSaved: number } | null> {
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('created_at, questions_saved')
    .eq('source_type', 'auto_fill')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error || !data) return null;
  
  return {
    timestamp: data.created_at,
    questionsSaved: data.questions_saved
  };
}

// Generate questions for a specific topic with FK link
// Phase 2: raised from 5 to 20 per call — the real ceiling is the daily quota guard.
const MAX_QUESTIONS_PER_CALL = 20; // Hard safety limit

export async function generateForTopic(params: {
  topic_id: string;
  topic_name: string;
  subject_name: string;
  difficulty?: string;
  count: number;
}): Promise<{
  success: boolean;
  generated: number;
  saved: number;
  duplicates: number;
  error?: string;
  errorType?: 'auth' | 'quota' | 'timeout' | 'gateway' | 'unknown';
}> {
  // Enforce hard limit
  const safeCount = Math.min(params.count, MAX_QUESTIONS_PER_CALL);

  // Check daily quota before proceeding
  const usage = await getAIUsageToday();
  if (!usage || usage.remaining_requests <= 0) {
    return {
      success: false,
      generated: 0,
      saved: 0,
      duplicates: 0,
      error: 'Daily AI quota reached. Try again tomorrow.',
      errorType: 'quota'
    };
  }

  try {
    // Check if topic has RAG documents - use generate-from-rag if available
    const { data: documents } = await supabase
      .from('documents')
      .select('id')
      .eq('topic_id', params.topic_id)
      .eq('status', 'completed')
      .limit(1);

    const hasRAGDocuments = documents && documents.length > 0;
    const endpoint = hasRAGDocuments ? 'generate-from-rag' : 'generate-test';

       // Build request body based on endpoint
       const requestBody = hasRAGDocuments
         ? {
             // generate-from-rag now only needs topic_id
             topic_id: params.topic_id,
             count: safeCount,
             difficulty_distribution: {
               easy: Math.ceil(safeCount * 0.4),
               medium: Math.ceil(safeCount * 0.4),
               hard: Math.ceil(safeCount * 0.2)
             }
           }
         : {
             // generate-test needs more params
             topic_id: params.topic_id,
             topic: `${params.topic_name} (${params.subject_name})`,
             topic_name: params.topic_name,
             subject_name: params.subject_name,
             difficulty: params.difficulty || 'medium',
             question_count: safeCount,
             count: safeCount,
             mode: 'bank_only',
             source: 'auto_fill',
             forceNew: true
           };
 
       const response = await supabase.functions.invoke(endpoint, { body: requestBody });

    if (response.error) {
      const errorMsg = response.error.message || 'Unknown error';
      let errorType: 'auth' | 'quota' | 'timeout' | 'gateway' | 'unknown' = 'unknown';
      
      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('limit')) {
        errorType = 'quota';
      } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
        errorType = 'auth';
      } else if (errorMsg.includes('timeout')) {
        errorType = 'timeout';
      } else if (errorMsg.includes('502') || errorMsg.includes('504')) {
        errorType = 'gateway';
      }

      return {
        success: false,
        generated: 0,
        saved: 0,
        duplicates: 0,
        error: errorMsg,
        errorType
      };
    }

    const result = response.data;
    return {
      success: true,
      generated: result?.generated || result?.questions_generated || 0,
      saved: result?.saved || result?.questions_saved || 0,
      duplicates: result?.duplicates || 0
    };

  } catch (error) {
    console.error('generateForTopic error:', error);
    return {
      success: false,
      generated: 0,
      saved: 0,
      duplicates: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'unknown'
    };
  }
}

// Backfill topic_id for existing content_items
export async function backfillTopicIds(): Promise<{
  success: boolean;
  updated_count: number;
  matched_topics: string[];
  error?: string;
}> {
  const { data, error } = await supabase.rpc('backfill_topic_ids');
  
  if (error) {
    console.error('Backfill error:', error);
    return { success: false, updated_count: 0, matched_topics: [], error: error.message };
  }
  
  const result = data?.[0] || { updated_count: 0, matched_topics: [] };
  return {
    success: true,
    updated_count: result.updated_count,
    matched_topics: result.matched_topics || []
  };
}

// ============= Phase 3: Content Fill Sprint =============
export interface SprintConfig {
  enabled: boolean;
  scope_keywords: string[];
  target_per_topic: number;
  daily_budget: number;
}

export async function getSprintConfig(): Promise<SprintConfig | null> {
  return getSystemSetting<SprintConfig>('content_fill_sprint');
}

export async function updateSprintConfig(config: Partial<SprintConfig>): Promise<boolean> {
  const current = await getSprintConfig();
  const merged: SprintConfig = {
    enabled: false,
    scope_keywords: [],
    target_per_topic: 15,
    daily_budget: 600,
    ...(current || {}),
    ...config,
  };
  return updateSystemSetting('content_fill_sprint', merged);
}

// Sprint scope preview — mirrors the edge function's matching rules
// (direct keyword hit + subject-level inheritance) so admins can see exactly
// which topics a preset would target before saving it.
export interface SprintScopePreview {
  total: number;
  sample: AutoFillQueueItem[];
}

export async function previewSprintScope(keywords: string[]): Promise<SprintScopePreview> {
  const cleaned = keywords.map((k) => k.trim().toLowerCase()).filter((k) => k.length > 1);
  const queue = await getAutoFillQueue(400);
  if (cleaned.length === 0) return { total: queue.length, sample: queue.slice(0, 10) };

  const matches = (item: AutoFillQueueItem) => {
    const haystack = [item.system_name, item.level_name, item.subject_name, item.topic_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return cleaned.some((k) => haystack.includes(k));
  };

  const scopedSubjects = new Set<string>();
  queue.forEach((item) => {
    if (matches(item) && item.subject_id) scopedSubjects.add(item.subject_id);
  });

  const scoped = queue.filter((item) => matches(item) || scopedSubjects.has(item.subject_id));
  return { total: scoped.length, sample: scoped.slice(0, 10) };
}


export interface RunSummary {
  id: string;
  created_at: string;
  questions_saved: number;
  metadata: Record<string, any> | null;
}

// Recent auto-fill run summaries (live progress feed for the sprint panel)
export async function getRecentAutoFillRuns(limit = 10): Promise<RunSummary[]> {
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('id, created_at, questions_saved, metadata')
    .eq('source_type', 'auto_fill_run_summary')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching run summaries:', error);
    return [];
  }
  return (data || []) as RunSummary[];
}

// ============= Phase 4: Quality Gate =============
export interface QualityGateResult {
  success: boolean;
  reviewed: number;
  flagged: number;
  batches_run: number;
  stop_reason?: string;
  error?: string;
}

export async function runQualityGate(batches = 3): Promise<QualityGateResult> {
  const { data, error } = await supabase.functions.invoke('verify-questions', {
    body: { batches },
    headers: { 'x-admin-trigger': 'true' },
  });

  if (error) {
    return { success: false, reviewed: 0, flagged: 0, batches_run: 0, error: error.message };
  }
  return data as QualityGateResult;
}

export async function getQualityGateStats(): Promise<{ unverified: number; flagged: number; lastRun: RunSummary | null }> {
  const [unverifiedRes, flaggedRes, lastRunRes] = await Promise.all([
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'mcq')
      .eq('status', 'approved')
      .is('quality_verified_at', null),
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'mcq')
      .eq('status', 'pending')
      .eq('quality_grade', 'D'),
    supabase
      .from('ai_usage_logs')
      .select('id, created_at, questions_saved, metadata')
      .eq('source_type', 'quality_gate_run_summary')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    unverified: unverifiedRes.count || 0,
    flagged: flaggedRes.count || 0,
    lastRun: (lastRunRes.data as RunSummary | null) || null,
  };
}
