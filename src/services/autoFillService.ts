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
}> {
  const [usage, config, queue] = await Promise.all([
    getAIUsageToday(),
    getAutoFillConfig(),
    getAutoFillQueue(5)
  ]);
  
  // Get total queue count separately
  const fullQueue = await getAutoFillQueue(1000);
  
  return {
    usage,
    config,
    queueCount: fullQueue.length,
    topPriorityTopics: queue
  };
}

// Generate questions for a specific topic with FK link
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
  try {
    const { data, error } = await supabase.functions.invoke('generate-test', {
      body: {
        topic: `${params.topic_name} (${params.subject_name})`,
        topic_id: params.topic_id,
        difficulty: params.difficulty || 'medium',
        question_count: params.count,
        mode: 'bank_only',
        source: 'auto_fill',
        forceNew: true
      }
    });

    // Handle Supabase invoke errors (network, auth, etc.)
    if (error) {
      console.error('[generateForTopic] Supabase invoke error:', error);
      
      // Determine error type for better UI feedback
      const errorMessage = error.message || String(error);
      let errorType: 'auth' | 'quota' | 'timeout' | 'gateway' | 'unknown' = 'unknown';
      
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        errorType = 'auth';
      } else if (errorMessage.includes('402') || errorMessage.toLowerCase().includes('payment') || errorMessage.toLowerCase().includes('credit')) {
        errorType = 'quota';
      } else if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('limit')) {
        errorType = 'quota';
      } else if (errorMessage.includes('504') || errorMessage.includes('408') || errorMessage.toLowerCase().includes('timeout')) {
        errorType = 'timeout';
      } else if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.toLowerCase().includes('gateway')) {
        errorType = 'gateway';
      }

      return { 
        success: false, 
        generated: 0, 
        saved: 0, 
        duplicates: 0, 
        error: `Edge Function Error: ${errorMessage}`,
        errorType
      };
    }

    // Check for error in response body (edge function returned 200 but with error payload)
    if (data?.error) {
      console.error('[generateForTopic] Edge function returned error in body:', data.error);
      
      const errorMessage = data.error;
      const details = data.details || '';
      let errorType: 'auth' | 'quota' | 'timeout' | 'gateway' | 'unknown' = 'unknown';
      
      if (errorMessage.toLowerCase().includes('credit') || errorMessage.toLowerCase().includes('payment') || details.toLowerCase().includes('402')) {
        errorType = 'quota';
      } else if (errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('limit')) {
        errorType = 'quota';
      } else if (errorMessage.toLowerCase().includes('timeout')) {
        errorType = 'timeout';
      } else if (errorMessage.toLowerCase().includes('gateway') || errorMessage.toLowerCase().includes('api key')) {
        errorType = 'gateway';
      }

      return {
        success: false,
        generated: 0,
        saved: 0,
        duplicates: 0,
        error: `${errorMessage}${details ? ` (${details})` : ''}`,
        errorType
      };
    }

    // Check for ai_unavailable flag (graceful degradation)
    if (data?.ai_unavailable) {
      console.warn('[generateForTopic] AI unavailable, using cached data:', data.error_notice);
      return {
        success: false,
        generated: 0,
        saved: 0,
        duplicates: 0,
        error: data.error_notice || 'AI temporarily unavailable',
        errorType: 'quota'
      };
    }

    return {
      success: true,
      generated: data?.questions_generated || 0,
      saved: data?.questions_saved || 0,
      duplicates: data?.duplicates_flagged || 0
    };
  } catch (unexpectedError: any) {
    console.error('[generateForTopic] Unexpected error:', unexpectedError);
    return {
      success: false,
      generated: 0,
      saved: 0,
      duplicates: 0,
      error: `Unexpected Error: ${unexpectedError?.message || String(unexpectedError)}`,
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
