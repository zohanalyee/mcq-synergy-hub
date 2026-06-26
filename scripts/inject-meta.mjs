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
import { TOOLS_WITHOUT_SEOHEAD } from "./prerender-routes.mjs";

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
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

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

function patch({ path, title, description, keywords, ogImage = OG_DEFAULT, ogType = "website", robots = "index,follow" }) {
  const url = `${BASE_URL}${path}`;
  const desc = clamp(description, 165);
  let html = SHELL;
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
}

// ---------- generators ----------
async function injectMockTests() {
  const { data } = await supabase
    .from("job_tests")
    .select("id,title,organization,questions,seo_title,meta_description");
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
      keywords: `${t.title} mock test, ${t.title} preparation, ${t.organization || ""} test, Pakistan exam MCQs`,
      ogImage: OG_EXAMS,
      ogType: "article",
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
      patch({
        path: `/opportunity/${slug}`,
        // Mirror OpportunityDetail.tsx SEOHead title (it passes "<title> | MCQSAI",
        // and SEOHead appends " | MCQsAI").
        title: `${r.title} | MCQSAI | MCQsAI`,
        description: clamp(r.description || fallback, 160),
        ogImage: cfg.og,
        ogType: "article",
      });
      count++;
    }
  }
  return count;
}

async function injectBlog() {
  const { data } = await supabase
    .from("blog_posts")
    .select("slug,title,excerpt,meta_title,meta_description")
    .eq("status", "published");
  const all = data || [];
  for (const p of all) {
    const t = (p.meta_title || p.title || "").trim();
    patch({
      path: `/blog/${p.slug}`,
      title: `${t} | MCQsAI`,
      description: p.meta_description || p.excerpt || `${t} — MCQsAI blog.`,
      ogImage: OG_BLOG,
      ogType: "article",
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
    });
  }
  return TOOLS_WITHOUT_SEOHEAD.length;
}

// ---------- main ----------
(async () => {
  const tools = injectTools();
  console.log(`[inject-meta] tools (no-SEOHead): ${tools}`);

  if (!supabase) {
    console.warn("[inject-meta] No Supabase credentials; skipped DB-driven pages.");
    process.exit(0);
  }

  const results = await Promise.allSettled([
    injectMockTests(), injectOpportunities(), injectBlog(), injectBoards(),
  ]);
  const labels = ["mock-tests", "opportunities", "blog", "boards"];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") console.log(`[inject-meta] ${labels[i]}: ${r.value} pages`);
    else console.warn(`[inject-meta] ${labels[i]} FAILED: ${r.reason?.message || r.reason}`);
  });
  console.log("[inject-meta] DONE");
  process.exit(0);
})().catch((err) => {
  console.error("[inject-meta] FATAL:", err);
  // Never fail the build over meta injection.
  process.exit(0);
});
