#!/usr/bin/env node
// Writes src/generated/topicOrder.json: { "<subject hub path>": ["<topic path>", ...] }
// covering INDEXABLE topics only (src/generated/indexableTopics.json, written by
// generate-sitemaps.mjs), in curriculum order. The topics table has no chapter
// column, so curriculum order = topic insertion order (created_at, then id) —
// topics are seeded chapter by chapter. Unmatched paths fall back to A–Z at the end.
//
// Consumed by src/lib/topicLinkGraph.js in BOTH the client page and
// scripts/inject-meta.mjs, so static HTML and the rendered page emit identical links.
// Never fails the build: on any error it keeps the existing file (or writes A–Z).
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "src", "generated", "topicOrder.json");
const IDX = resolve(ROOT, "src", "generated", "indexableTopics.json");

const env = {};
try {
  for (const line of readFileSync(resolve(ROOT, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
} catch { /* CI env only */ }
const URL_ = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || "https://pzhvipkcssxrsxxljbbz.supabase.co";
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

// Must match the SQL slug used by get_indexable_board_topic_paths.
const toSlug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const hubOf = (p) => p.split("/").slice(0, 5).join("/");

async function fetchAll(sb, table, cols) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(cols).order("id").range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function main() {
  const paths = JSON.parse(readFileSync(IDX, "utf8"));
  const rank = new Map(); // topic path -> [created_at, id]
  try {
    if (!KEY) throw new Error("no supabase key");
    const sb = createClient(URL_, KEY, { auth: { persistSession: false } });
    const [systems, levels, subjects, topics] = await Promise.all([
      fetchAll(sb, "educational_systems", "id,name"),
      fetchAll(sb, "levels", "id,name,system_id"),
      fetchAll(sb, "subjects", "id,name,level_id"),
      fetchAll(sb, "topics", "id,name,subject_id,created_at"),
    ]);
    const sys = new Map(systems.map((s) => [s.id, s.name]));
    const lvl = new Map(levels.map((l) => [l.id, l]));
    const sub = new Map(subjects.map((s) => [s.id, s]));
    for (const t of topics) {
      const s = sub.get(t.subject_id); if (!s) continue;
      const l = lvl.get(s.level_id); if (!l) continue;
      const b = sys.get(l.system_id); if (!b) continue;
      const n = (String(l.name).match(/\d+/) || [""])[0]; if (!n) continue;
      const p = `/boards/${toSlug(b)}/class-${n}/${toSlug(s.name)}/${toSlug(t.name)}`;
      if (!rank.has(p)) rank.set(p, [String(t.created_at || ""), String(t.id)]);
    }
  } catch (e) {
    console.warn(`[topic-order] DB order unavailable (${e?.message || e}); ${existsSync(OUT) ? "keeping existing file" : "writing A–Z order"}`);
    if (existsSync(OUT)) return;
  }

  const hubs = {};
  for (const p of paths) (hubs[hubOf(p)] ||= []).push(p);
  for (const list of Object.values(hubs)) {
    list.sort((a, b) => {
      const ra = rank.get(a), rb = rank.get(b);
      if (ra && rb) return ra[0] === rb[0] ? (ra[1] < rb[1] ? -1 : 1) : (ra[0] < rb[0] ? -1 : 1);
      if (ra) return -1;
      if (rb) return 1;
      return a < b ? -1 : 1;
    });
  }
  writeFileSync(OUT, JSON.stringify(hubs));
  console.log(`[topic-order] ${Object.keys(hubs).length} hubs, ${paths.length} topics (${rank.size ? "curriculum order" : "A–Z"})`);
}

main().catch((e) => console.warn(`[topic-order] skipped: ${e?.message || e}`));
