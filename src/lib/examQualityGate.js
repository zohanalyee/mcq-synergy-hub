// Single source of truth for whether an exam page row is listed in the sitemap.
// Plain JS so build scripts (node) and the app share it. The generate-sitemap
// edge function keeps a copy that must match.
/** @param {{status?: string, include_in_sitemap?: boolean, facts?: Record<string, unknown>}} row */
export function examPassesGate(row) {
  if (!row) return false;
  if ((row.status ?? "published") !== "published") return false;
  if (row.include_in_sitemap === false) return false;
  const url = row.facts && row.facts.officialUrl;
  return typeof url === "string" && url.trim().length > 0;
}
