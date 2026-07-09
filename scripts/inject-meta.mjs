#!/usr/bin/env node
/**
 * inject-meta — post-build, per-URL <head> injection for DB-driven detail pages.
 *
 * WHY: renderToString (vite-prerender-plugin) is synchronous and cannot await the
 * Supabase queries that mock-tests / jobs / scholarships / blog / board-topic
 * pages depend on. Those routes therefore never get prerendered and a raw
 * (non-JS) crawler fetch returns the homepage shell's head — wrong title,
 * description, canonical and social-preview tags on every detail URL.
 *
 * FIX: after the build, take the (already prerendered + deduped) dist/index.html
 * as a base shell and, for every indexable detail URL — pulled from the SAME data
 * source as the sitemap generator — write dist/<path>/index.html with a corrected
 * <head> (unique title/description/keywords, self-referencing canonical + og:url +
 * twitter:url, category OG image, robots index,follow).
 *
 * Safe + idempotent. Never fails the build over a transient DB issue.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TOOLS_WITHOUT_SEOHEAD, SUBJECT_CONTENT_META } from "./prerender-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const BASE_URL = "https://mcqsai.com";

if (!existsSync(join(DIST, "index.html"))) {
  console.log("[inject-meta] skipped (no dist/index.html)");
  process.exit(0);
}
const SHELL = readFileSync(join(DIST, "index.html"), "utf8");

// ---------- env ----------
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
// Public anon/publishable key. Mirrors src/integrations/supabase/client.ts so that
// DB-driven meta injection ALWAYS has credentials at build time, even when the
// Lovable build environment does not expose VITE_*/.env vars. Without this the
// client falls back to null, DB pages are silently skipped, and every dynamic
// detail route ships the homepage shell — exactly the production bug we are fixing.
const DEFAULT_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6aHZpcGtjc3N4cnN4eGxqYmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjAzODYsImV4cCI6MjA1OTU5NjM4Nn0.XILYqQfW-4sqxdLXIfklKHLJVHH_tY5Ci0xNk4Kxbyw";
const SUPABASE_KEY =
  env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || DEFAULT_PUBLISHABLE_KEY;
const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Production builds must not silently ship the homepage shell for dynamic routes.
const STRICT = process.env.NODE_ENV !== "development" && process.env.SEO_INJECT_STRICT !== "false";
// SEO-critical routes that MUST exist with correct head after a production build.
const REQUIRED_ROUTES = [
  "/mock-tests/sindh-teaching-license-exam-secondary-school-teacher",
  "/subject-content/physics",
];

// Manifest of every route we patch, written to dist/seo-injected-routes.json for
// auditability (inspect the build output to confirm a route was generated).
const MANIFEST = [];

// ---------- slug helpers (mirror generate-sitemaps.mjs / jobTestSlug.ts) ----------
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
function humanize(slug) {
  return String(slug || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- head patching ----------
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function clamp(s, max = 160) {
  const v = String(s || "").replace(/\s+/g, " ").trim();
  return v.length > max ? `${v.slice(0, max - 1).trimEnd()}…` : v;
}
function upsert(html, re, tag) {
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}
function setTitle(html, title) {
  const tag = `<title>${esc(title)}</title>`;
  return upsert(html, /<title\b[^>]*>[\s\S]*?<\/title>/i, tag);
}
function setName(html, name, content) {
  return upsert(
    html,
    new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*>`, "i"),
    `<meta name="${name}" content="${esc(content)}" />`,
  );
}
function setProp(html, prop, content) {
  return upsert(
    html,
    new RegExp(`<meta\\b[^>]*\\bproperty=["']${prop}["'][^>]*>`, "i"),
    `<meta property="${prop}" content="${esc(content)}" />`,
  );
}
function setCanonical(html, url) {
  return upsert(html, /<link\b[^>]*\brel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${esc(url)}" />`);
}

const OG_DEFAULT = `${BASE_URL}/og/default-og.jpg`;
const OG_JOBS = `${BASE_URL}/og/jobs-og.jpg`;
const OG_SCHOLAR = `${BASE_URL}/og/scholarships-og.jpg`;
const OG_BLOG = `${BASE_URL}/og/blog-og.jpg`;
const OG_TOOLS = `${BASE_URL}/og/tools-og.jpg`;
const OG_BOARDS = `${BASE_URL}/og/boards-og.jpg`;
const OG_EXAMS = `${BASE_URL}/og/exams-og.jpg`;

// Thin-content thresholds — MUST match scripts/generate-sitemaps.mjs and the
// page components so the static robots tag, the sitemap, and the client-side
// SEOHead all agree on which pages are indexable.
const OPPORTUNITY_MIN_WORDS = 25;
const BLOG_MIN_WORDS = 80;
function wordCount(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~\-!\[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function patch({ path, title, description, keywords, ogImage = OG_DEFAULT, ogType = "website", robots = "index,follow", inPlace = false, pageType = "other" }) {
  const url = `${BASE_URL}${path}`;
  const desc = clamp(description, 165);
  // For prerendered routes (inPlace) keep the real page body and only correct the
  // <head>; otherwise build a fresh shell from dist/index.html.
  const existing = join(DIST, path.replace(/^\//, ""), "index.html");
  let html = inPlace && existsSync(existing) ? readFileSync(existing, "utf8") : SHELL;
  html = setTitle(html, title);
  html = setName(html, "description", desc);
  if (keywords) html = setName(html, "keywords", keywords);
  html = setName(html, "robots", robots);
  html = setCanonical(html, url);
  html = setProp(html, "og:url", url);
  html = setProp(html, "og:type", ogType);
  html = setProp(html, "og:title", title);
  html = setProp(html, "og:description", desc);
  html = setProp(html, "og:image", ogImage);
  html = setProp(html, "og:image:secure_url", ogImage);
  html = setProp(html, "og:image:type", "image/jpeg");
  html = setProp(html, "og:image:width", "1200");
  html = setProp(html, "og:image:height", "630");
  html = setProp(html, "og:image:alt", title);
  html = setName(html, "twitter:url", url);
  html = setName(html, "twitter:card", "summary_large_image");
  html = setName(html, "twitter:title", title);
  html = setName(html, "twitter:description", desc);
  html = setName(html, "twitter:image", ogImage);
  html = setName(html, "twitter:image:alt", title);

  const outDir = join(DIST, path.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html, "utf8");
  MANIFEST.push({ path, type: pageType, title, canonical: url, generatedAt: new Date().toISOString() });
}

// ---------- generators ----------
async function injectMockTests() {
  const { data } = await supabase
    .from("job_tests")
    .select("id,title,organization,questions,seo_title,meta_description,keywords");
  const all = data || [];
  for (const t of all) {
    const slug = jobTestSlug(t, all);
    const metaTitle = t.seo_title?.trim()
      ? t.seo_title.trim()
      : `${t.title} Mock Test — Free Online Preparation`;
    const metaDescription = t.meta_description?.trim()
      ? t.meta_description.trim()
      : `Prepare for the ${t.title} test by ${t.organization} with free AI-powered mock tests. ` +
        `Official syllabus, subject weightage, and ${t.questions} practice MCQs in simple Pakistani exam English.`;
    patch({
      path: `/mock-tests/${slug}`,
      title: `${metaTitle} | MCQsAI`,
      description: metaDescription,
      keywords: Array.isArray(t.keywords) && t.keywords.length
        ? t.keywords.join(", ")
        : `${t.title} mock test, ${t.title} preparation, ${t.organization || ""} test, Pakistan exam MCQs`,
      ogImage: OG_EXAMS,
      ogType: "article",
      pageType: "mock-tests",
    });
  }
  return all.length;
}

async function injectOpportunities() {
  // Same source + URL form as the sitemap (/opportunity/<title-slug>-<id>).
  let count = 0;
  for (const cfg of [
    { category: "job", type: "job", og: OG_JOBS },
    { category: "scholarship", type: "scholarship", og: OG_SCHOLAR },
  ]) {
    const [{ data: ci }, { data: eo }] = await Promise.all([
      supabase.from("content_items").select("id,title,description").eq("category", cfg.category).eq("status", "approved"),
      supabase.from("external_opportunities").select("id,title,description,organization,source_name").eq("type", cfg.type).eq("status", "approved"),
    ]);
    const seen = new Set();
    for (const r of [...(ci || []), ...(eo || [])]) {
      const slug = generateSlugUrl(r.title, r.id);
      if (seen.has(slug)) continue;
      seen.add(slug);
      const fallback = `${cfg.type} opportunity from ${r.organization || r.source_name || "MCQsAI"}`;
      const thin = wordCount(r.description) < OPPORTUNITY_MIN_WORDS;
      patch({
        path: `/opportunity/${slug}`,
        // Mirror OpportunityDetail.tsx SEOHead title (it passes "<title> | MCQSAI",
        // and SEOHead appends " | MCQsAI").
        title: `${r.title} | MCQSAI | MCQsAI`,
        description: clamp(r.description || fallback, 160),
        ogImage: cfg.og,
        ogType: "article",
        robots: thin ? "noindex,follow" : "index,follow",
        pageType: "opportunity",
      });
      count++;
    }
  }
  return count;
}

async function injectBlog() {
  const { data } = await supabase
    .from("blog_posts")
    .select("slug,title,content,excerpt,meta_title,meta_description")
    .eq("status", "published");
  const all = data || [];
  for (const p of all) {
    const t = (p.meta_title || p.title || "").trim();
    const thin = wordCount(p.content) < BLOG_MIN_WORDS;
    patch({
      path: `/blog/${p.slug}`,
      title: `${t} | MCQsAI`,
      description: p.meta_description || p.excerpt || `${t} — MCQsAI blog.`,
      ogImage: OG_BLOG,
      ogType: "article",
      robots: thin ? "noindex,follow" : "index,follow",
      pageType: "blog",
    });
  }
  return all.length;
}

async function injectBoards() {
  const { data, error } = await supabase.rpc("get_indexable_board_topic_paths", { p_min_approved_mcqs: 5 });
  if (error) throw error;
  const seen = new Set();
  let count = 0;
  for (const r of data || []) {
    const path = r.path;
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const parts = path.split("/").filter(Boolean); // boards, board, class-N, subject, topic
    if (parts.length < 5) continue;
    const board = humanize(parts[1]);
    const classN = (String(parts[2]).match(/\d+/) || [""])[0];
    const subject = humanize(parts[3]);
    const topic = humanize(parts[4]);
    patch({
      path,
      title: `${topic} MCQs - ${subject} Class ${classN} | ${board} | MCQsAI`,
      description: `Practice ${topic} MCQs for ${subject} Class ${classN} (${board}). Free online preparation with explanations — MCQsAI.`,
      keywords: `${topic} MCQs, ${subject} class ${classN}, ${board} preparation, Pakistan exam MCQs`,
      ogImage: OG_BOARDS,
      ogType: "article",
      pageType: "board-topic",
    });
    count++;
  }
  return count;
}

// Mirror src/lib/slugUtils.ts toSlug so DB display names map back to the exact
// URL segments the board pages resolve via findBestMatch.
function pageToSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
// Mirror src/lib/slugUtils.ts toClassSegment (numeric → class-N).
function pageClassSeg(name) {
  const digits = String(name || "").toLowerCase().match(/\d+/)?.[0];
  if (digits) return `class-${digits}`;
  return pageToSlug(String(name || "").replace(/^class[-\s]*/i, ""));
}

// Board HUB pages (landing / class / subject). These are NOT prerendered and
// were shipping the homepage shell's generic description → the "39 identical
// descriptions" GSC flagged. We derive the hub paths from the SAME indexable
// topic RPC used for leaves (so only hubs with real content get patched) and
// resolve real display names from the DB so the static description EXACTLY
// matches each page's client-side SEOHead output.
async function injectBoardHubs() {
  const { data: topicRows, error } = await supabase.rpc("get_indexable_board_topic_paths", { p_min_approved_mcqs: 5 });
  if (error) throw error;

  // Build display-name lookups keyed by URL segment.
  const [{ data: systems }, { data: levels }, { data: subjects }] = await Promise.all([
    supabase.from("educational_systems").select("id,name").eq("is_active", true),
    supabase.from("levels").select("id,name,system_id"),
    supabase.from("subjects").select("id,name,level_id"),
  ]);
  const boardName = new Map();       // boardSlug -> name
  const boardSlugById = new Map();   // system_id -> boardSlug
  for (const s of systems || []) {
    const slug = pageToSlug(s.name);
    boardName.set(slug, s.name);
    boardSlugById.set(s.id, slug);
  }
  const levelName = new Map();       // `${boardSlug}::${classSeg}` -> name
  const levelKeyById = new Map();    // level_id -> `${boardSlug}::${classSeg}`
  for (const l of levels || []) {
    const bSlug = boardSlugById.get(l.system_id);
    if (!bSlug) continue;
    const key = `${bSlug}::${pageClassSeg(l.name)}`;
    levelName.set(key, l.name);
    levelKeyById.set(l.id, key);
  }
  const subjectName = new Map();     // `${boardSlug}::${classSeg}::${subjectSlug}` -> name
  for (const sub of subjects || []) {
    const lKey = levelKeyById.get(sub.level_id);
    if (!lKey) continue;
    subjectName.set(`${lKey}::${pageToSlug(sub.name)}`, sub.name);
  }

  // Collect unique hub paths (landing / class / subject) from indexable topics.
  const landing = new Set();
  const classHub = new Set();
  const subjectHub = new Set();
  for (const r of topicRows || []) {
    const parts = String(r.path || "").split("/").filter(Boolean); // boards, board, class-N, subject, topic
    if (parts.length < 5) continue;
    const [, board, classSeg, subject] = parts;
    landing.add(board);
    classHub.add(`${board}/${classSeg}`);
    subjectHub.add(`${board}/${classSeg}/${subject}`);
  }

  let count = 0;
  const classNumOf = (seg) => (String(seg).match(/\d+/) || [""])[0];

  for (const board of landing) {
    const bName = boardName.get(board) || humanize(board);
    patch({
      path: `/boards/${board}`,
      title: `${bName} MCQs 2026 — All Classes & Subjects | MCQsAI`,
      description: `Free ${bName} MCQs with answers for all classes and subjects. AI-powered practice with instant feedback — MCQsAI Pakistan.`,
      keywords: `${bName} MCQs, ${bName} past papers, ${bName} class 9, ${bName} class 10, ${bName} class 11, ${bName} class 12, Pakistan board MCQs`,
      ogImage: OG_BOARDS,
      ogType: "website",
      pageType: "board-landing",
    });
    count++;
  }
  for (const p of classHub) {
    const [board, classSeg] = p.split("/");
    const bName = boardName.get(board) || humanize(board);
    const lName = levelName.get(`${board}::${classSeg}`) || `Class ${classNumOf(classSeg)}`;
    patch({
      path: `/boards/${board}/${classSeg}`,
      title: `${lName} – ${bName} Subjects | MCQsAI`,
      description: `Browse ${bName} ${lName} subjects. Practice MCQs for all subjects.`,
      keywords: `${bName} ${lName} MCQs, ${bName} ${lName} subjects, Pakistan board MCQs`,
      ogImage: OG_BOARDS,
      ogType: "website",
      pageType: "board-class",
    });
    count++;
  }
  for (const p of subjectHub) {
    const [board, classSeg, subject] = p.split("/");
    const bName = boardName.get(board) || humanize(board);
    const lName = levelName.get(`${board}::${classSeg}`) || `Class ${classNumOf(classSeg)}`;
    const sName = subjectName.get(`${board}::${classSeg}::${subject}`) || humanize(subject);
    patch({
      path: `/boards/${board}/${classSeg}/${subject}`,
      title: `${sName} Topics – ${lName} ${bName} | MCQsAI`,
      description: `Browse ${sName} topics for ${lName} (${bName}). Practice MCQs topic by topic.`,
      keywords: `${sName} MCQs, ${sName} ${lName}, ${bName} ${sName}, Pakistan board MCQs`,
      ogImage: OG_BOARDS,
      ogType: "website",
      pageType: "board-subject",
    });
    count++;
  }
  return count;
}

function injectTools() {
  // Tool pages without <SEOHead> (not prerendered) — give them unique heads.
  for (const t of TOOLS_WITHOUT_SEOHEAD) {
    patch({
      path: t.path,
      title: `${t.title} | MCQsAI`,
      description: t.description,
      ogImage: OG_TOOLS,
      pageType: "tools",
    });
  }
  return TOOLS_WITHOUT_SEOHEAD.length;
}

function injectSubjectContent() {
  // Backstop for static /subject-content/:id pages. They ARE prerendered, but a
  // lazy-chunk Suspense miss on the first synchronous render can leave an empty
  // <title>. Patch the existing prerendered HTML in place (body preserved) so the
  // head always matches SubjectContent's SEOHead output.
  for (const s of SUBJECT_CONTENT_META) {
    patch({
      path: s.path,
      title: `${s.title} MCQs with Answers — Free Practice | MCQsAI`,
      description: `Free ${s.title} MCQs with answers and detailed explanations. AI-powered ${s.title} practice questions for MDCAT, ECAT, NTS, FPSC & board exams — MCQsAI Pakistan.`,
      keywords: `${s.title} MCQs, ${s.title} MCQs with answers, ${s.title} past papers, ${s.title} quiz, ${s.title} practice questions Pakistan`,
      ogImage: OG_DEFAULT,
      ogType: "article",
      inPlace: true,
      pageType: "subject-content",
    });
  }
  return SUBJECT_CONTENT_META.length;
}

// ---------- main ----------
function fail(msg) {
  console.error(`[inject-meta] ${msg}`);
  if (STRICT) process.exit(1);
  process.exit(0);
}

function writeManifest() {
  try {
    writeFileSync(
      join(DIST, "seo-injected-routes.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), count: MANIFEST.length, routes: MANIFEST }, null, 2),
      "utf8",
    );
    console.log(`[inject-meta] manifest written: dist/seo-injected-routes.json (${MANIFEST.length} routes)`);
  } catch (e) {
    console.warn(`[inject-meta] could not write manifest: ${e?.message || e}`);
  }
}

function verifyRequiredRoutes() {
  const missing = [];
  for (const route of REQUIRED_ROUTES) {
    const file = join(DIST, route.replace(/^\//, ""), "index.html");
    if (!existsSync(file)) {
      missing.push(`${route} (file not written)`);
      continue;
    }
    const html = readFileSync(file, "utf8");
    const canon = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i)?.[1] || "";
    if (canon !== `${BASE_URL}${route}`) missing.push(`${route} (canonical="${canon}")`);
  }
  if (missing.length) fail(`Required SEO routes missing/incorrect after injection:\n  - ${missing.join("\n  - ")}`);
  else console.log(`[inject-meta] required routes OK: ${REQUIRED_ROUTES.join(", ")}`);
}

(async () => {
  console.log(`[inject-meta] tools (no-SEOHead): ${injectTools()}`);
  console.log(`[inject-meta] subject-content (in-place): ${injectSubjectContent()}`);

  if (!supabase) {
    writeManifest();
    return fail("No Supabase credentials; DB-driven pages (mock-tests/opportunities/blog/boards) were skipped.");
  }

  const results = await Promise.allSettled([
    injectMockTests(), injectOpportunities(), injectBlog(), injectBoards(), injectBoardHubs(),
  ]);
  const labels = ["mock-tests", "opportunities", "blog", "boards", "board-hubs"];
  const counts = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      counts[labels[i]] = r.value;
      console.log(`[inject-meta] ${labels[i]}: ${r.value} pages`);
    } else {
      counts[labels[i]] = -1;
      console.warn(`[inject-meta] ${labels[i]} FAILED: ${r.reason?.message || r.reason}`);
    }
  });

  writeManifest();

  // Mock tests are the SEO-critical category that originally regressed: if zero
  // were generated (DB unreachable / RLS / query change), fail the build loudly
  // instead of silently shipping the homepage shell for every mock-test URL.
  if (!counts["mock-tests"] || counts["mock-tests"] < 1) {
    return fail(`Mock-test meta injection produced ${counts["mock-tests"]} pages — refusing to ship homepage shell for /mock-tests/*.`);
  }

  verifyRequiredRoutes();

  console.log("[inject-meta] DONE");
  process.exit(0);
})().catch((err) => {
  console.error("[inject-meta] FATAL:", err);
  if (STRICT) process.exit(1);
  process.exit(0);
});
