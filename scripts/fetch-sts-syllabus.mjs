#!/usr/bin/env node
// Build-time bake-in: snapshots job_tests.syllabus keyed by public mock-test slug
// into src/generated/stsSyllabus.json so /exams/sts prerenders the per-cadre
// syllabus in static HTML. On failure the committed snapshot is kept.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/generated/stsSyllabus.json");

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
// Mirrors src/lib/slugUtils toSlug + src/lib/jobTestSlug collision rule.
const toSlug = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
const orgSuffix = (o) => {
  if (!o) return "";
  const p = o.match(/\(([^)]+)\)/);
  if (p && p[1]) return toSlug(p[1]);
  const a = (o.match(/[A-Z]/g) || []).join("");
  if (a.length >= 2) return a.toLowerCase();
  return toSlug(o).split("-").slice(0, 2).join("-");
};
const slugFor = (t, all) => {
  const base = toSlug(t.title);
  const col = all.filter((x) => toSlug(x.title) === base);
  if (col.length <= 1) return base;
  const s = orgSuffix(t.organization);
  const w = s ? `${base}-${s}` : base;
  const oc = col.filter((x) => `${base}-${orgSuffix(x.organization)}` === w);
  if (oc.length <= 1) return w;
  const i = oc.findIndex((x) => x.id === t.id);
  return i <= 0 ? w : `${w}-${i + 1}`;
};

const env = { ...loadEnv(), ...process.env };
const url = env.VITE_SUPABASE_URL || "https://pzhvipkcssxrsxxljbbz.supabase.co";
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;

try {
  if (!key) throw new Error("no anon key");
  const sb = createClient(url, key);
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("job_tests").select("id,title,organization,syllabus").order("id").range(from, from + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  if (!rows.length) throw new Error("no rows");
  const map = {};
  for (const t of rows) {
    const items = Array.isArray(t.syllabus) ? t.syllabus : [];
    const clean = items
      .filter((i) => i && typeof i.topic === "string" && i.topic.trim())
      .map((i) => ({ topic: i.topic.trim(), percentage: typeof i.percentage === "number" ? i.percentage : null }));
    if (clean.length) map[slugFor(t, rows)] = clean;
  }
  const sorted = Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]]));
  writeFileSync(out, JSON.stringify(sorted, null, 1) + "\n");
  console.log(`[sts-syllabus] snapshot refreshed: ${Object.keys(sorted).length} tests`);
} catch (e) {
  console.warn(`[sts-syllabus] kept committed snapshot (${e.message})`);
}
