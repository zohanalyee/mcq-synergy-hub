// Guest per-IP rate limiter for AI edge functions.
// Uses public.check_guest_rate_limit RPC (service-role only) to atomically
// bump hour/day counters and return whether the call is allowed.

export interface GuestRateLimitConfig {
  endpoint: string;      // e.g. "generate-test"
  maxPerHour: number;    // hard cap per IP per hour
  maxPerDay: number;     // hard cap per IP per day
}

export function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  used_hour?: number;
  used_day?: number;
  limit_hour?: number;
  limit_day?: number;
  ip?: string | null;
}

// Returns { allowed: true } and records the hit, or { allowed: false }
// with reason 'hour_limit' | 'day_limit'. On any DB error, fails OPEN
// (returns allowed=true) — the limiter should never break service.
export async function enforceGuestRateLimit(
  supabaseServiceClient: any,
  req: Request,
  cfg: GuestRateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  if (!ip) {
    console.log(`[GuestRateLimit] No IP resolved for ${cfg.endpoint} — allow`);
    return { allowed: true, reason: "no_ip", ip: null };
  }

  try {
    const { data, error } = await supabaseServiceClient.rpc(
      "check_guest_rate_limit",
      {
        p_ip: ip,
        p_endpoint: cfg.endpoint,
        p_max_per_hour: cfg.maxPerHour,
        p_max_per_day: cfg.maxPerDay,
      }
    );
    if (error) {
      console.warn(`[GuestRateLimit] RPC error, failing open:`, error.message);
      return { allowed: true, reason: "rpc_error", ip };
    }
    const row = data || {};
    if (row.allowed === false) {
      console.log(
        `[GuestRateLimit] ⛔ ${cfg.endpoint} blocked for ${ip} — ${row.reason} (hour=${row.used_hour}/${row.limit_hour} day=${row.used_day}/${row.limit_day})`
      );
    }
    return { ...row, ip };
  } catch (err: any) {
    console.warn(`[GuestRateLimit] exception, failing open:`, err?.message);
    return { allowed: true, reason: "exception", ip };
  }
}

export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  const isDay = result.reason === "day_limit";
  const msg = isDay
    ? "Aap ne aaj ki guest limit poori kar li hai. Kal dobara try karein, ya free account bana kar unlimited practice karein."
    : "Aap ne is ghantay ki guest limit poori kar li hai. Thodi der mein try karein, ya free account bana lein.";
  return new Response(
    JSON.stringify({
      success: false,
      error: msg,
      error_type: "guest_rate_limited",
      reason: result.reason,
      used_hour: result.used_hour,
      used_day: result.used_day,
      limit_hour: result.limit_hour,
      limit_day: result.limit_day,
      retry_after_seconds: isDay ? 3600 * 6 : 60 * 20,
    }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
