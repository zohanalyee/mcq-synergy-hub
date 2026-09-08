#!/usr/bin/env node
// Route-manifest guard for the entry chunk.
//
// Every page eagerly imported by src/App.tsx lands in the single entry bundle
// that EVERY visitor downloads, parses and executes before first paint. Eager
// page imports therefore belong in EXACTLY ONE place: src/routes/eagerPages.tsx,
// which is loaded only by src/prerender.tsx (renderToString cannot await a
// lazy() import, so prerendered routes must resolve synchronously there).
//
// The browser gets the same pages through src/routes/lazyPages.ts, so each one
// ships as its own chunk.
//
// This guard fails the build when:
//   - src/App.tsx (or any file other than the prerender registry) eagerly
//     imports a page module;
//   - eagerPages.tsx and lazyPages.ts drift out of sync (different keys);
//   - the eager registry grows past the agreed budget.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), 'utf8');

// Budget: prerendered routes only. Raise deliberately, and only together with a
// matching entry in PRERENDER_ROUTES (vite.config.ts) / EXTRA_PRERENDER_ROUTES
// (scripts/prerender-routes.mjs).
const EAGER_BUDGET = 70;

const PAGE_IMPORT_RE = /^import\s+([A-Z][A-Za-z0-9_]*)\s+from\s+["'](?:\.\/|@\/)pages\/[^"']+["']/;

const problems = [];

// 1. App.tsx must contain ZERO eager page imports.
const appEager = read('src/App.tsx')
  .split('\n')
  .map((line, i) => ({ line: line.trim(), n: i + 1 }))
  .filter(({ line }) => PAGE_IMPORT_RE.test(line));
if (appEager.length) {
  problems.push(
    `${appEager.length} eager page import(s) in src/App.tsx:\n  ` +
      appEager.map(({ n, line }) => `${n}: ${line}`).join('\n  ') +
      '\n  → add the page to src/routes/eagerPages.tsx + src/routes/lazyPages.ts ' +
      'and reference it as <P.PageName /> instead.',
  );
}

// 2. Eager registry size + registry parity.
const eagerSrc = read('src/routes/eagerPages.tsx');
const eagerKeys = eagerSrc
  .split('\n')
  .map((l) => l.trim().match(PAGE_IMPORT_RE)?.[1])
  .filter(Boolean);
const lazySrc = read('src/routes/lazyPages.ts');
const lazyKeys = [...lazySrc.matchAll(/^\s{2}([A-Z][A-Za-z0-9_]*):\s*lazyWithReload\(/gm)].map((m) => m[1]);

const eagerSet = new Set(eagerKeys);
const lazySet = new Set(lazyKeys);
const missingLazy = eagerKeys.filter((k) => !lazySet.has(k));
const missingEager = lazyKeys.filter((k) => !eagerSet.has(k));
if (missingLazy.length || missingEager.length) {
  problems.push(
    'route registries out of sync — ' +
      (missingLazy.length ? `missing in lazyPages.ts: ${missingLazy.join(', ')}. ` : '') +
      (missingEager.length ? `missing in eagerPages.tsx: ${missingEager.join(', ')}.` : ''),
  );
}
if (eagerKeys.length > EAGER_BUDGET) {
  problems.push(
    `eager page imports = ${eagerKeys.length}, over the budget of ${EAGER_BUDGET}. ` +
      'Only prerendered routes belong in src/routes/eagerPages.tsx.',
  );
}

// 3. Only the prerender registry may import pages eagerly.
if (!/from ['"]\.\/routes\/eagerPages['"]/.test(read('src/prerender.tsx'))) {
  problems.push('src/prerender.tsx no longer loads src/routes/eagerPages — prerendered routes would ship an empty #root.');
}

if (problems.length) {
  console.error('[verify-eager-routes] FAILED');
  problems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}

console.log(
  `[verify-eager-routes] OK — App.tsx has 0 eager page imports; ` +
    `${eagerKeys.length} prerender-only eager pages (budget ${EAGER_BUDGET}), registries in sync`,
);
