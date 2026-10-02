// Single source of truth for indexable /p/* slugs: compiles
// src/data/programmaticSeo.ts and runs its real quality gate, so the sitemap
// and prerender list can never include a page that renders noindex.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformSync } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/data/programmaticSeo.ts"), "utf8");
const { code } = transformSync(src, { loader: "ts", format: "esm" });
const out = join(mkdtempSync(join(tmpdir(), "progseo-")), "programmaticSeo.mjs");
writeFileSync(out, code);
const mod = await import(pathToFileURL(out).href);
export const PROG_SEO_SLUGS = mod.indexableProgSeoSlugs();
