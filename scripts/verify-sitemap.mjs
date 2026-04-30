#!/usr/bin/env node
// Build-time guardrail: ensures the public/dist sitemap.xml is intact,
// is a same-origin (mcqsai.com) sitemap index, and references all the
// expected child sitemaps. Run as `pre` (checks public/) or `post` (dist/).
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2] === "post" ? "post" : "pre";
const root = mode === "post" ? "dist" : "public";
const indexPath = resolve(process.cwd(), `${root}/sitemap.xml`);

const REQUIRED_CHILDREN = [
  "/sitemaps/static.xml",
  "/sitemaps/tools.xml",
  "/sitemaps/exams.xml",
  "/sitemaps/jobs.xml",
  "/sitemaps/scholarships.xml",
  "/sitemaps/blog.xml",
];

if (!existsSync(indexPath)) {
  console.error(`[verify-sitemap:${mode}] MISSING FILE: ${root}/sitemap.xml`);
  process.exit(1);
}

const xml = readFileSync(indexPath, "utf8");

if (!xml.includes("<sitemapindex")) {
  console.error(`[verify-sitemap:${mode}] ${root}/sitemap.xml is not a sitemapindex`);
  process.exit(1);
}

// Reject any cross-domain (supabase.co) URLs — those are the bug we just fixed.
if (/supabase\.co/i.test(xml)) {
  console.error(`[verify-sitemap:${mode}] ${root}/sitemap.xml still references supabase.co — must be same-origin only`);
  process.exit(1);
}

const missing = REQUIRED_CHILDREN.filter(needle => !xml.includes(needle));
if (missing.length) {
  console.error(`[verify-sitemap:${mode}] ${root}/sitemap.xml is missing entries:`, missing);
  process.exit(1);
}

if (!/\/sitemaps\/boards-\d+\.xml/.test(xml)) {
  console.error(`[verify-sitemap:${mode}] ${root}/sitemap.xml has no boards-*.xml entry`);
  process.exit(1);
}

console.log(`[verify-sitemap:${mode}] OK — ${root}/sitemap.xml is same-origin and complete.`);
