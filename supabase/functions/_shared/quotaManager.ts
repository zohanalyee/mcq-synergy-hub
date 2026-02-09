import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============= QUOTA CONFIGURATION =============
// Free tier: 1500 requests/day. Safety margin: 100 buffer.
export const DAILY_QUOTA_LIMIT = 1400;

// ============= QUOTA CHECK =============
// Queries ai_usage_logs for today's request count.
// Throws a user-friendly error if quota is exhausted.
export async function checkQuota(supabaseClient: any): Promise<{ remaining: number; used: number }> {
  const today = new Date().toISOString().split('T')[0];

  const { count, error } = await supabaseClient
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00Z`);

  if (error) {
    console.warn('[QuotaManager] ⚠️ Could not check quota:', error.message);
    // Don't block on quota check failure - proceed with caution
    return { remaining: DAILY_QUOTA_LIMIT, used: 0 };
  }

  const used = count || 0;
  const remaining = DAILY_QUOTA_LIMIT - used;

  if (remaining <= 0) {
    const hoursLeft = getHoursUntilReset();
    const errorMessage = `Daily AI quota exhausted (${used}/${DAILY_QUOTA_LIMIT}). Service will resume at midnight UTC (${hoursLeft} hours).`;
    console.error(`[QuotaManager] ❌ ${errorMessage}`);
    throw new QuotaExhaustedError(errorMessage, used, hoursLeft);
  }

  if (remaining < 50) {
    console.warn(`[QuotaManager] ⚠️ Low quota: ${remaining} requests remaining`);
  } else {
    console.log(`[QuotaManager] ✅ Quota OK: ${remaining}/${DAILY_QUOTA_LIMIT} remaining`);
  }

  return { remaining, used };
}

// ============= QUOTA EXHAUSTED ERROR =============
export class QuotaExhaustedError extends Error {
  public used: number;
  public hoursUntilReset: number;
  public isQuotaError = true;

  constructor(message: string, used: number, hoursUntilReset: number) {
    super(message);
    this.name = 'QuotaExhaustedError';
    this.used = used;
    this.hoursUntilReset = hoursUntilReset;
  }
}

// ============= HOURS UNTIL RESET =============
export function getHoursUntilReset(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
}

// ============= RETRY WITH BACKOFF =============
// Wraps async functions with exponential backoff for 429/quota errors.
// Non-quota errors are thrown immediately.
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  operation = 'API call'
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const is429 =
        error.status === 429 ||
        error.message?.includes('429') ||
        error.message?.includes('quota') ||
        error.message?.includes('rate limit') ||
        error.message?.includes('RESOURCE_EXHAUSTED');

      if (is429 && i < maxRetries - 1) {
        const delay = Math.pow(3, i) * 5000; // 5s, 15s, 45s
        console.log(`[QuotaManager] ⏳ Rate limited on ${operation}. Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`[QuotaManager] Max retries exceeded for ${operation}`);
}

// ============= LOG QUOTA USAGE =============
// Convenience function to log AI usage after a successful API call.
export async function logQuotaUsage(
  supabaseClient: any,
  params: {
    source_type: string;
    subject?: string;
    topic?: string;
    difficulty?: string;
    questions_requested: number;
    questions_fetched: number;
    questions_saved: number;
    triggered_by_user_id?: string | null;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('ai_usage_logs')
      .insert({
        source_type: params.source_type,
        subject: params.subject || null,
        topic: params.topic || null,
        difficulty: params.difficulty || null,
        questions_requested: params.questions_requested,
        questions_fetched: params.questions_fetched,
        questions_saved: params.questions_saved,
        triggered_by_user_id: params.triggered_by_user_id || null,
        metadata: params.metadata || {},
      });

    if (error) {
      console.error('[QuotaManager] Failed to log usage:', error.message);
    } else {
      console.log(`[QuotaManager] 📊 Usage logged: ${params.source_type} - Req: ${params.questions_requested}, Saved: ${params.questions_saved}`);
    }
  } catch (err) {
    console.error('[QuotaManager] Error logging usage:', err);
  }
}

// ============= QUOTA ERROR RESPONSE HELPER =============
// Returns a standardized JSON response for quota exhaustion.
export function quotaExhaustedResponse(corsHeaders: Record<string, string>): Response {
  const hoursLeft = getHoursUntilReset();
  return new Response(
    JSON.stringify({
      success: false,
      error: `Daily AI quota exhausted. Service will resume at midnight UTC (${hoursLeft} hours).`,
      error_type: 'quota_exhausted',
      hours_until_reset: hoursLeft,
    }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
