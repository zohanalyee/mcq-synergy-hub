#!/usr/bin/env node
// Route-manifest guard for the entry chunk.
//
// Every page eagerly imported by src/App.tsx lands in the single entry bundle
// that EVERY visitor downloads, parses and executes before first paint. Eager
// imports are only justified for routes that are statically prerendered (they
// must render synchronously during renderToString). Anything else must be
// lazy() so it ships as its own chunk.
//
// This guard fails the build when an eager page import lacks an
// `// eager: <reason>` justification comment, or when the eager page count
// exceeds the agreed budget.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const APP = join(process.cwd(), 'src/App.tsx');
const src = readFileSync(APP, 'utf8');

// Budget: current justified count + small headroom. Raise deliberately, with a
// prerender route to match — never just to make a new page load "instantly".
const EAGER_BUDGET = 70;

const EAGER_RE = /^import\s+[A-Z][A-Za-z0-9_]*\s+from\s+["'](?:\.\/|@\/)pages\/[^"']+["'];?(.*)$/;

const unjustified = [];
let eagerCount = 0;

src.split('\n').forEach((line, i) => {
  const m = line.match(EAGER_RE);
  if (!m) return;
  eagerCount += 1;
  if (!/\/\/\s*eager:/.test(m[1])) {
    unjustified.push(`${i + 1}: ${line.trim()}`);
  }
});

const problems = [];
if (unjustified.length) {
  problems.push(
    `${unjustified.length} eager page import(s) without an "// eager: <reason>" comment:\n  ` +
      unjustified.join('\n  ') +
      '\n  → either lazy() the page, or add the route to PRERENDER_ROUTES ' +
      '(vite.config.ts) / EXTRA_PRERENDER_ROUTES (scripts/prerender-routes.mjs) ' +
      'and document it with "// eager: prerendered ...".',
  );
}
if (eagerCount > EAGER_BUDGET) {
  problems.push(
    `eager page imports = ${eagerCount}, over the budget of ${EAGER_BUDGET}. ` +
      'Move non-prerendered routes to lazy() instead of growing the entry chunk.',
  );
}

if (problems.length) {
  console.error('[verify-eager-routes] FAILED');
  problems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}

console.log(`[verify-eager-routes] OK — ${eagerCount} justified eager page imports (budget ${EAGER_BUDGET})`);
