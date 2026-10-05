#!/usr/bin/env node
// Build-time bake-in: refreshes src/data/examFactsSnapshot.json from the
// exam_pages table so prerendered HTML and the sitemap reflect admin edits at
// publish time. On any failure the committed snapshot is kept unchanged.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/data/examFactsSnapshot.json");

function loadEnv() {
  const p = resolve(root, ".env");
  const e = {};
  if (!existsSync(p)) return e;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) e[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return e;
}
const env = { ...loadEnv(), ...process.env };
const url = env.VITE_SUPABASE_URL || "https://pzhvipkcssxrsxxljbbz.supabase.co";
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;

try {
  if (!key) throw new Error("no anon key");
  const sb = createClient(url, key);
  const { data, error } = await Promise.race([
    sb.from("exam_pages").select("slug,kind,facts,test_date,verified_on,include_in_sitemap").eq("status", "published"),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
  ]);
  if (error) throw error;
  if (!data?.length) throw new Error("no rows");
  // Keep the committed order stable (minimal diffs); new slugs go last.
  const prev = JSON.parse(readFileSync(out, "utf8")).map((r) => r.slug);
  const rank = (s) => (prev.indexOf(s) === -1 ? 1e6 : prev.indexOf(s));
  data.sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));
  writeFileSync(out, JSON.stringify(data, null, 1) + "\n");
  console.log(`[exam-facts] snapshot refreshed: ${data.length} pages`);
} catch (e) {
  console.warn(`[exam-facts] kept committed snapshot (${e.message})`);
}
