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

const FETCH_TIMEOUT_MS = Number(process.env.SITEMAP_FETCH_TIMEOUT_MS || 6000);

function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const signal = init.signal || controller.signal;
  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timeout));
}

const supabase = SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { global: { fetch: fetchWithTimeout } })
  : null;
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
  { loc: "/features/ai-coach", priority: "0.8", freq: "monthly" },
  { loc: "/privacy-policy", priority: "0.3", freq: "yearly" },
  { loc: "/terms-of-service", priority: "0.3", freq: "yearly" },
  { loc: "/editorial-policy", priority: "0.5", freq: "monthly" },
];

// I-5 tools triage: only Pakistan-education-relevant tools with real on-page
// depth are indexable. MUST stay in sync with INDEXABLE_TOOL_PATHS in
// src/config/toolsSeo.ts (every other /tools/* page is noindex,follow).
const TOOL_PATHS = [
  "/tools/school-attendance-system","/tools/aggregate-calculator","/tools/merit-calculator",
  "/tools/gpa-calculator","/tools/cgpa-calculator","/tools/gpa-to-percentage",
  "/tools/percentage-to-gpa","/tools/marks-calculator","/tools/result-calculator",
  "/tools/attendance-calculator","/tools/percentage-calculator","/tools/age-calculator",
  "/tools/periodic-table","/tools/pakistan-tax-calculator","/tools/zakat-calculator",
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

// Keep in sync with the "/exams/*" entries of PRERENDER_ROUTES in vite.config.ts.
const EXAM_SLUGS = ["mdcat","ecat","css","ppsc","fpsc","nts","pms"];

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
  write("exams.xml", urlSet([
    { loc: `${BASE_URL}/exams`, lastmod: today, freq: "weekly", priority: "0.8" },
    ...EXAM_SLUGS.map(s => ({
      loc: `${BASE_URL}/exams/${s}`, lastmod: today, freq: "monthly", priority: "0.8",
    })),
  ]));
}
function writeProgSeo() {
  const entries = [
    { loc: `${BASE_URL}/p`, lastmod: today, freq: "weekly", priority: "0.7" },
    ...PROG_SEO_SLUGS.map(s => ({
      loc: `${BASE_URL}/p/${s}`, lastmod: today, freq: "monthly", priority: "0.7",
    })),
  ];
  write("programmatic.xml", urlSet(entries));
}

// ---------- thin-content thresholds (must match the page components) ----------
// Opportunities are time-sensitive (jobs/scholarships) so the bar is low — only
// near-empty listings are excluded. Blog posts need real body copy to index.
const OPPORTUNITY_MIN_WORDS = 25;
const BLOG_MIN_WORDS = 80;
function wordCount(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")        // strip HTML tags
    .replace(/[#*_>`~\-!\[\]()]/g, " ") // strip common markdown punctuation
    .split(/\s+/)
    .filter(Boolean).length;
}

// ---------- DB-backed sitemaps ----------
async function buildOpportunitySitemap(category, type, fileName) {
  const [{ data: ci }, { data: eo }] = await Promise.all([
    supabase.from("content_items").select("id,title,description,updated_at").eq("category", category).eq("status", "approved"),
    supabase.from("external_opportunities").select("id,title,description,updated_at").eq("type", type).eq("status", "approved"),
  ]);
  const seen = new Set();
  let dropped = 0;
  const items = [...(ci || []), ...(eo || [])]
    .filter(r => { if (wordCount(r.description) >= OPPORTUNITY_MIN_WORDS) return true; dropped++; return false; })
    .map(r => ({ slug: generateSlugUrl(r.title, r.id), lastmod: (r.updated_at || "").split("T")[0] || today }))
    .filter(i => { if (seen.has(i.slug)) return false; seen.add(i.slug); return true; });
  if (dropped) console.log(`[sitemap] ${fileName}: dropped ${dropped} thin opportunity URLs (< ${OPPORTUNITY_MIN_WORDS} words)`);
  write(fileName, urlSet(items.map(i => ({
    loc: `${BASE_URL}/opportunity/${i.slug}`, lastmod: i.lastmod, freq: "weekly", priority: "0.6",
  }))));
}

async function buildBlog() {
  const { data: posts } = await supabase
    .from("blog_posts").select("slug,content,excerpt,updated_at").eq("status", "published");
  let dropped = 0;
  const kept = (posts || []).filter(p => {
    if (wordCount(p.content) >= BLOG_MIN_WORDS) return true;
    dropped++; return false;
  });
  if (dropped) console.log(`[sitemap] blog.xml: dropped ${dropped} thin blog URLs (< ${BLOG_MIN_WORDS} words)`);
  write("blog.xml", urlSet(kept.map(p => ({
    loc: `${BASE_URL}/blog/${p.slug}`,
    lastmod: (p.updated_at || "").split("T")[0] || today,
    freq: "weekly", priority: "0.7",
  }))));
}

// Mirror of src/lib/jobTestSlug.ts so public URLs match the React routes.
function orgSuffix(organization) {
  if (!organization) return "";
  const paren = String(organization).match(/\(([^)]+)\)/);
  if (paren && paren[1]) return toSlug(paren[1]);
  const acronym = (String(organization).match(/[A-Z]/g) || []).join("");
  if (acronym.length >= 2) return acronym.toLowerCase();
  return toSlug(organization).split("-").slice(0, 2).join("-");
}
function jobTestSlug(test, all) {
  const base = toSlug(test.title);
  const collisions = all.filter((t) => toSlug(t.title) === base);
  if (collisions.length <= 1) return base;
  const suffix = orgSuffix(test.organization);
  const withOrg = suffix ? `${base}-${suffix}` : base;
  const orgCollisions = collisions.filter((t) => `${base}-${orgSuffix(t.organization)}` === withOrg);
  if (orgCollisions.length <= 1) return withOrg;
  const index = orgCollisions.findIndex((t) => t.id === test.id);
  return index <= 0 ? withOrg : `${withOrg}-${index + 1}`;
}

async function buildMockTests() {
  const { data: tests } = await supabase
    .from("job_tests")
    .select("id,title,organization,updated_at");
  const all = tests || [];
  write("mock-tests.xml", urlSet(all.map((t) => ({
    loc: `${BASE_URL}/mock-tests/${jobTestSlug(t, all)}`,
    lastmod: (t.updated_at || "").split("T")[0] || today,
    freq: "weekly", priority: "0.8",
  }))));
}

async function buildBoards() {
  // AdSense / crawl-budget: only emit board topic URLs that have enough
  // approved MCQs to be genuinely useful. Thin pages (< 5 approved MCQs) are
  // low-value near-duplicates — they stay reachable for users but are kept out
  // of the sitemap and are noindex (see BoardTopicPage.tsx).
  //
  // IMPORTANT: anonymous clients can no longer read content_items directly
  // (RLS hardening for the answer-leak fix). We therefore resolve the indexable
  // board topic paths + approved-MCQ counts through a SECURITY DEFINER RPC that
  // returns ONLY public URL paths and aggregate counts — never question content
  // or answer keys.
  const MIN_APPROVED_MCQS = 5;

  const { data: rows, error } = await supabase.rpc("get_indexable_board_topic_paths", {
    p_min_approved_mcqs: MIN_APPROVED_MCQS,
  });
  if (error) throw error;

  const all = [];
  const indexablePaths = [];
  const seen = new Set();
  for (const r of rows || []) {
    const path = r.path;
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const lastmod = (r.lastmod || "").toString().split("T")[0] || today;
    all.push({ loc: `${BASE_URL}${path}`, lastmod, freq: "weekly", priority: "0.7" });
    indexablePaths.push(path);
  }
  console.log(`[sitemap] boards: ${all.length} URLs kept (>= ${MIN_APPROVED_MCQS} approved MCQs)`);

  // Build-time manifest of indexable board topic paths (>= 5 approved MCQs).
  // Consumed synchronously by BoardTopicPage.tsx so the noindex decision is
  // deterministic in the prerendered (SSR) HTML — thin/empty pages ship a
  // robots=noindex tag in static HTML, exactly matching what's in the sitemap.
  // Written into src/ (not public/) so the bundler can import it at build time.
  const GENERATED_DIR = resolve(ROOT, "src", "generated");
  mkdirSync(GENERATED_DIR, { recursive: true });
  writeFileSync(
    resolve(GENERATED_DIR, "indexableTopics.json"),
    JSON.stringify(indexablePaths)
  );
  console.log(`[sitemap] src/generated/indexableTopics.json written (${indexablePaths.length} paths)`);

  // Build-time manifest of indexable board HUB paths (landing / class / subject).
  // A hub is indexable iff it has at least one indexable topic (>= 5 approved
  // MCQs) beneath it. Consumed synchronously by the hub page components so thin
  // hubs (no real content underneath) ship robots=noindex in static HTML —
  // matching the topic-level gate and keeping thin hubs out of the index.
  const hubSet = new Set();
  for (const path of indexablePaths) {
    const parts = path.split("/").filter(Boolean); // boards, board, class-N, subject, topic
    if (parts.length < 5) continue;
    const [, board, classSeg, subject] = parts;
    hubSet.add(`/boards/${board}`);
    hubSet.add(`/boards/${board}/${classSeg}`);
    hubSet.add(`/boards/${board}/${classSeg}/${subject}`);
  }
  writeFileSync(
    resolve(GENERATED_DIR, "indexableHubs.json"),
    JSON.stringify([...hubSet])
  );
  console.log(`[sitemap] src/generated/indexableHubs.json written (${hubSet.size} paths)`);

  const pages = Math.max(1, Math.ceil(all.length / ITEMS_PER_SITEMAP));
  for (let i = 1; i <= pages; i++) {
    const slice = all.slice((i - 1) * ITEMS_PER_SITEMAP, i * ITEMS_PER_SITEMAP);
    write(`boards-${i}.xml`, urlSet(slice));
  }
  return pages;
}

function writeIndex(boardPages) {
  const entries = [
    "static.xml", "tools.xml", "exams.xml", "mock-tests.xml", "programmatic.xml",
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
    write("mock-tests.xml", urlSet([]));
    write("boards-1.xml", urlSet([]));
    writeIndex(1);
    return;
  }

  await Promise.all([
    buildOpportunitySitemap("job", "job", "jobs.xml").catch(e => {
      console.warn("[sitemap] jobs failed:", e?.message); write("jobs.xml", urlSet([]));
    }),
    buildOpportunitySitemap("scholarship", "scholarship", "scholarships.xml").catch(e => {
      console.warn("[sitemap] scholarships failed:", e?.message); write("scholarships.xml", urlSet([]));
    }),
    buildBlog().catch(e => {
      console.warn("[sitemap] blog failed:", e?.message); write("blog.xml", urlSet([]));
    }),
    buildMockTests().catch(e => {
      console.warn("[sitemap] mock-tests failed:", e?.message); write("mock-tests.xml", urlSet([]));
    }),
  ]);
  try {
    boardPages = await buildBoards();
  } catch (e) {
    console.warn("[sitemap] boards failed:", e?.message); write("boards-1.xml", urlSet([])); boardPages = 1;
  }

  writeIndex(boardPages);
  console.log("[sitemap] DONE — all URLs are same-origin (mcqsai.com)");
  process.exit(0);
})().catch(err => {
  console.error("[sitemap] FATAL:", err);
  // Don't fail the build over sitemap issues
  process.exit(0);
});
