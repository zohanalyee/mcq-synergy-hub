#!/usr/bin/env node
// Build-time guardrail: ensures the public/dist sitemap.xml is intact
// and contains all 7 cross-domain Supabase Edge Function URLs.
// Run as either `pre` (checks public/) or `post` (checks dist/) via argv.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2] === "post" ? "post" : "pre";
const target = mode === "post" ? "dist/sitemap.xml" : "public/sitemap.xml";
const path = resolve(process.cwd(), target);

const REQUIRED = [
  "type=static",
  "type=jobs",
  "type=scholarships",
  "type=blog",
  "type=exams",
  "type=boards&amp;page=1",
  "type=tools",
];

if (!existsSync(path)) {
  console.error(`[verify-sitemap:${mode}] MISSING FILE: ${target}`);
  process.exit(1);
}

const xml = readFileSync(path, "utf8");

if (!xml.includes("<sitemapindex")) {
  console.error(`[verify-sitemap:${mode}] ${target} is not a valid sitemapindex`);
  process.exit(1);
}

const missing = REQUIRED.filter((needle) => !xml.includes(needle));
if (missing.length) {
  console.error(`[verify-sitemap:${mode}] ${target} is missing entries:`, missing);
  process.exit(1);
}

console.log(`[verify-sitemap:${mode}] OK — ${target} contains all 7 sitemap entries.`);
