#!/usr/bin/env node
// Build-time sitemap generator.
// Writes same-origin (mcqsai.com) static XML files into public/sitemaps/
// so Google never sees cross-domain (supabase.co) sitemap URLs.
//
// Runs at `prebuild`. If Supabase is unreachable, we keep whatever files
// are already on disk and only refresh public/sitemap.xml so the build
// never fails over a transient DB issue.

import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC = resolve(ROOT, "public");
const SITEMAPS_DIR = resolve(PUBLIC, "sitemaps");
mkdirSync(SITEMAPS_DIR, { recursive: true });

const BASE_URL = "https://mcqsai.com";
const ITEMS_PER_SITEMAP = 1000;

// Read .env for VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
function loadEnv() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return out;
}
const env = { ...loadEnv(), ...process.env };

const SUPABASE_URL = env.VITE_SUPABASE_URL || "https://pzhvipkcssxrsxxljbbz.supabase.co";
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;

const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const today = new Date().toISOString().split("T")[0];

// ---------- helpers ----------
function toSlug(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function generateSlugUrl(title, id) {
  const slug = String(title || "")
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60).replace(/-+$/g, "");
  return slug ? `${slug}-${id}` : id;
}
function extractClassNumber(levelName) {
  const m = String(levelName || "").match(/(\d+)/);
  return m ? m[1] : null;
}
function urlSet(urls) {
  const entries = urls.map(u =>
    `<url><loc>${u.loc}</loc><lastmod>${u.lastmod || today}</lastmod><changefreq>${u.freq || "weekly"}</changefreq><priority>${u.priority || "0.6"}</priority></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
}
function write(name, xml) {
  const path = resolve(SITEMAPS_DIR, name);
  writeFileSync(path, xml, "utf8");
  console.log(`[sitemap] wrote sitemaps/${name} (${xml.length} bytes)`);
}

// ---------- static lists (always safe) ----------
const STATIC_PAGES = [
  { loc: "/", priority: "1.0", freq: "daily" },
  { loc: "/subjects", priority: "0.9", freq: "weekly" },
  { loc: "/quizzes", priority: "0.9", freq: "weekly" },
  { loc: "/custom-syllabus", priority: "0.8", freq: "monthly" },
  { loc: "/mock-tests", priority: "0.8", freq: "weekly" },
  { loc: "/jobs", priority: "0.7", freq: "daily" },
  { loc: "/scholarships", priority: "0.7", freq: "daily" },
  { loc: "/tools", priority: "0.7", freq: "monthly" },
  { loc: "/question-bank", priority: "0.7", freq: "weekly" },
  { loc: "/past-papers", priority: "0.7", freq: "weekly" },
  { loc: "/leaderboard", priority: "0.6", freq: "daily" },
  { loc: "/reviews", priority: "0.6", freq: "weekly" },
  { loc: "/about", priority: "0.5", freq: "monthly" },
  { loc: "/contact", priority: "0.5", freq: "monthly" },
  { loc: "/blog", priority: "0.8", freq: "weekly" },
  { loc: "/faq", priority: "0.7", freq: "monthly" },
  { loc: "/study-guides", priority: "0.7", freq: "weekly" },
  { loc: "/boards", priority: "0.8", freq: "weekly" },
  { loc: "/mdcat-syllabus", priority: "0.8", freq: "monthly" },
  { loc: "/privacy-policy", priority: "0.3", freq: "yearly" },
  { loc: "/terms-of-service", priority: "0.3", freq: "yearly" },
];

const TOOL_PATHS = [
  "/tools/school-attendance-system","/tools/math","/tools/age-calculator","/tools/timer",
  "/tools/gpa-calculator","/tools/units","/tools/notes","/tools/calendar",
  "/tools/islamic-calendar","/tools/international-calendar","/tools/bmi-calculator",
  "/tools/percentage-calculator","/tools/salary-calculator","/tools/emi-calculator",
  "/tools/tip-calculator","/tools/loan-calculator","/tools/discount-calculator",
  "/tools/bmr-calculator","/tools/duration-calculator","/tools/ratio-calculator",
  "/tools/speed-calculator","/tools/area-calculator","/tools/fraction-calculator",
  "/tools/date-calculator","/tools/fuel-calculator","/tools/cgpa-calculator",
  "/tools/gpa-to-percentage","/tools/percentage-to-gpa","/tools/grade-calculator",
  "/tools/marks-calculator","/tools/attendance-calculator","/tools/result-calculator",
  "/tools/formula-sheet","/tools/periodic-table","/tools/multiplication-table",
  "/tools/currency-converter","/tools/temperature-converter","/tools/roman-converter",
  "/tools/binary-converter","/tools/case-converter","/tools/image-resizer",
  "/tools/image-compressor","/tools/image-converter","/tools/pdf-compressor",
  "/tools/pdf-merger","/tools/pdf-to-text","/tools/pdf-splitter","/tools/stopwatch",
  "/tools/world-clock","/tools/word-counter","/tools/character-counter","/tools/qr-generator","/tools/qr-scanner",
  "/tools/password-generator","/tools/name-generator","/tools/color-picker",
  "/tools/random-number","/tools/equation-solver",
];

// Programmatic SEO /p/* slugs — mirrors indexableProgSeoSlugs() in src/data/programmaticSeo.ts
const PROG_SEO_SLUGS = [
  "mdcat-karachi","mdcat-sindh","mdcat-islamabad",
  "nts-karachi","nts-lahore","nts-islamabad",
  "css-islamabad","css-karachi",
  "fpsc-islamabad","fpsc-karachi",
  "ppsc-lahore","ppsc-punjab",
  "ecat-punjab","ecat-lahore",
  "mdcat-lahore","mdcat-punjab",
  "biology-mcqs-class-12","biology-mcqs-class-11",
  "chemistry-mcqs-class-12","physics-mcqs-class-12",
];

const EXAM_SLUGS = ["mdcat","ecat","css","ppsc","fpsc","nts"];

function writeStatic() {
  write("static.xml", urlSet(STATIC_PAGES.map(p => ({
    loc: `${BASE_URL}${p.loc}`, lastmod: today, freq: p.freq, priority: p.priority,
  }))));
}
function writeTools() {
  write("tools.xml", urlSet(TOOL_PATHS.map(p => ({
    loc: `${BASE_URL}${p}`, lastmod: today, freq: "monthly", priority: "0.6",
  }))));
}
function writeExams() {
  write("exams.xml", urlSet(EXAM_SLUGS.map(s => ({
    loc: `${BASE_URL}/exams/${s}`, lastmod: today, freq: "monthly", priority: "0.8",
  }))));
}
function writeProgSeo() {
  write("programmatic.xml", urlSet(PROG_SEO_SLUGS.map(s => ({
    loc: `${BASE_URL}/p/${s}`, lastmod: today, freq: "monthly", priority: "0.7",
  }))));
}

// ---------- DB-backed sitemaps ----------
async function buildOpportunitySitemap(category, type, fileName) {
  const [{ data: ci }, { data: eo }] = await Promise.all([
    supabase.from("content_items").select("id,title,updated_at").eq("category", category).eq("status", "approved"),
    supabase.from("external_opportunities").select("id,title,updated_at").eq("type", type).eq("status", "approved"),
  ]);
  const seen = new Set();
  const items = [...(ci || []), ...(eo || [])]
    .map(r => ({ slug: generateSlugUrl(r.title, r.id), lastmod: (r.updated_at || "").split("T")[0] || today }))
    .filter(i => { if (seen.has(i.slug)) return false; seen.add(i.slug); return true; });
  write(fileName, urlSet(items.map(i => ({
    loc: `${BASE_URL}/opportunity/${i.slug}`, lastmod: i.lastmod, freq: "weekly", priority: "0.6",
  }))));
}

async function buildBlog() {
  const { data: posts } = await supabase
    .from("blog_posts").select("slug,updated_at").eq("status", "published");
  write("blog.xml", urlSet((posts || []).map(p => ({
    loc: `${BASE_URL}/blog/${p.slug}`,
    lastmod: (p.updated_at || "").split("T")[0] || today,
    freq: "weekly", priority: "0.7",
  }))));
}

async function buildBoards() {
  const { data: topics, error } = await supabase
    .from("topics")
    .select(`id,name,subjects!inner(id,name,levels!inner(id,name,educational_systems!inner(id,name,is_active)))`)
    .eq("subjects.levels.educational_systems.is_active", true);
  if (error) throw error;

  const all = [];
  for (const t of topics || []) {
    const s = t.subjects, l = s?.levels, sys = l?.educational_systems;
    if (!s || !l || !sys) continue;
    const cls = extractClassNumber(l.name);
    if (!cls) continue;
    all.push({
      loc: `${BASE_URL}/boards/${toSlug(sys.name)}/class-${cls}/${toSlug(s.name)}/${toSlug(t.name)}`,
      lastmod: today, freq: "weekly", priority: "0.7",
    });
  }
  const pages = Math.max(1, Math.ceil(all.length / ITEMS_PER_SITEMAP));
  for (let i = 1; i <= pages; i++) {
    const slice = all.slice((i - 1) * ITEMS_PER_SITEMAP, i * ITEMS_PER_SITEMAP);
    write(`boards-${i}.xml`, urlSet(slice));
  }
  return pages;
}

function writeIndex(boardPages) {
  const entries = [
    "static.xml", "tools.xml", "exams.xml", "programmatic.xml",
    "jobs.xml", "scholarships.xml", "blog.xml",
    ...Array.from({ length: boardPages }, (_, i) => `boards-${i + 1}.xml`),
  ].map(name =>
    `  <sitemap><loc>${BASE_URL}/sitemaps/${name}</loc><lastmod>${today}</lastmod></sitemap>`
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>`;
  writeFileSync(resolve(PUBLIC, "sitemap.xml"), xml, "utf8");
  console.log(`[sitemap] wrote sitemap.xml index with ${entries.length} entries`);
}

// ---------- main ----------
(async () => {
  // Static lists are safe and always written
  writeStatic();
  writeTools();
  writeExams();
  writeProgSeo();

  let boardPages = 1;

  if (!supabase) {
    console.warn("[sitemap] No Supabase credentials; writing minimal placeholder DB sitemaps.");
    write("jobs.xml", urlSet([]));
    write("scholarships.xml", urlSet([]));
    write("blog.xml", urlSet([]));
    write("boards-1.xml", urlSet([]));
    writeIndex(1);
    return;
  }

  try {
    await buildOpportunitySitemap("job", "job", "jobs.xml");
  } catch (e) {
    console.warn("[sitemap] jobs failed:", e?.message); write("jobs.xml", urlSet([]));
  }
  try {
    await buildOpportunitySitemap("scholarship", "scholarship", "scholarships.xml");
  } catch (e) {
    console.warn("[sitemap] scholarships failed:", e?.message); write("scholarships.xml", urlSet([]));
  }
  try {
    await buildBlog();
  } catch (e) {
    console.warn("[sitemap] blog failed:", e?.message); write("blog.xml", urlSet([]));
  }
  try {
    boardPages = await buildBoards();
  } catch (e) {
    console.warn("[sitemap] boards failed:", e?.message); write("boards-1.xml", urlSet([])); boardPages = 1;
  }

  writeIndex(boardPages);
  console.log("[sitemap] DONE — all URLs are same-origin (mcqsai.com)");
})().catch(err => {
  console.error("[sitemap] FATAL:", err);
  // Don't fail the build over sitemap issues
  process.exit(0);
});
