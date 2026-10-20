// Free Gemini quota budget per job group (system_settings.ai_free_budget).
// Pure decision helpers are exported for tests; the async helpers read the DB.
// User-facing calls are never blocked by this budget — background groups are
// refused before they can eat into the user reserve.

export type AIGroup = 'user' | 'quality_gate' | 'auto_fill' | 'admin_bulk';
export const BACKGROUND_GROUPS: AIGroup[] = ['quality_gate', 'auto_fill', 'admin_bulk'];

export interface FreeBudgetConfig {
  enabled: boolean;
  groups: Partial<Record<AIGroup, { reserve?: number; max?: number }>>;
  total_max: number;
}

export function isBackgroundGroup(g?: string | null): boolean {
  return !!g && (BACKGROUND_GROUPS as string[]).includes(g);
}

// Start of the current Google free-tier day (~08:00 UTC = midnight US-Pacific).
export function googleDayStart(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(8, 0, 0, 0);
  if (d.getTime() > now.getTime()) d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

export function decideBudget(
  cfg: FreeBudgetConfig | null,
  group: AIGroup,
  used: { group: number; user: number; total: number },
): { allowed: boolean; reason?: string } {
  if (!cfg || !cfg.enabled || group === 'user') return { allowed: true };
  const max = Number(cfg.groups?.[group]?.max ?? 0);
  if (used.group >= max) return { allowed: false, reason: `${group} budget used (${used.group}/${max})` };
  const reserve = Number(cfg.groups?.user?.reserve ?? 0);
  const userLeft = Math.max(0, reserve - used.user);
  if (used.total + userLeft >= Number(cfg.total_max ?? 0)) {
    return { allowed: false, reason: `total budget reached (${used.total}/${cfg.total_max}, ${userLeft} kept for learners)` };
  }
  return { allowed: true };
}

export type KeyHealth = Record<string, { ok: boolean; cooldown_until?: number }>;

export function isKeyCooling(health: KeyHealth, index: number, now = Date.now()): boolean {
  const h = health[String(index)];
  return !!h && !h.ok && !!h.cooldown_until && h.cooldown_until > now;
}

// ---- DB helpers (service-role client) ----
export async function readFreeBudget(client: any): Promise<FreeBudgetConfig | null> {
  try {
    const { data } = await client.from('system_settings').select('value').eq('key', 'ai_free_budget').maybeSingle();
    return (data?.value ?? null) as FreeBudgetConfig | null;
  } catch (_e) {
    return null;
  }
}

async function countAttempts(client: any, since: string, group?: string): Promise<number> {
  let q = client
    .from('ai_usage_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('metadata->>ai_attempt', 'true')
    .eq('metadata->>provider', 'gemini');
  if (group) q = q.eq('metadata->>group', group);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}

export async function checkFreeBudget(client: any, group: AIGroup): Promise<{ allowed: boolean; reason?: string }> {
  if (!client || group === 'user') return { allowed: true };
  const cfg = await readFreeBudget(client);
  if (!cfg || !cfg.enabled) return { allowed: true };
  try {
    const since = googleDayStart().toISOString();
    const [g, u, t] = await Promise.all([
      countAttempts(client, since, group),
      countAttempts(client, since, 'user'),
      countAttempts(client, since),
    ]);
    return decideBudget(cfg, group, { group: g, user: u, total: t });
  } catch (e) {
    // Counting failed: refuse background work rather than risk starving learners.
    return { allowed: false, reason: `budget check failed: ${String(e).slice(0, 80)}` };
  }
}
