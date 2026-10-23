// Daily Quality Report rules (admin, read-only). Plain JS so node tests can run it.
export const STALL_HOURS = 6;
export const MANY_429 = 20;

/** Gate is stalled when no review has been saved for 6+ hours (or never). */
export function isStalled(lastReviewIso, now = Date.now()) {
  if (!lastReviewIso) return true;
  return now - Date.parse(lastReviewIso) >= STALL_HOURS * 3600 * 1000;
}

/** One line: the single most important issue, in fixed priority order. */
export function dailyVerdict({ paidBackground = 0, lastReviewIso = null, rateLimited = 0, newFails = 0 }, now = Date.now()) {
  if (paidBackground > 0) return `Background jobs used paid AI ${paidBackground}× — check now`;
  if (isStalled(lastReviewIso, now)) return `Quality Gate stalled — no review for ${STALL_HOURS}+ hours`;
  if (rateLimited >= MANY_429) return `Free AI keys exhausted ${rateLimited}× (429) in 24h`;
  if (newFails > 0) return `${newFails} new failed question${newFails === 1 ? "" : "s"} in 24h`;
  return "All OK";
}

/** Free unless the logged provider is something other than Gemini/none. */
export function isPaidCall(meta) {
  const p = String(meta?.provider || "").toLowerCase();
  return !!p && p !== "gemini" && p !== "none";
}

/** Start of "today" in Pakistan time (UTC+5), as epoch ms. */
export function pktDayStart(now = Date.now(), daysAgo = 0) {
  const PKT = 5 * 3600 * 1000;
  const d = new Date(now + PKT);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() - PKT - daysAgo * 86400000;
}
