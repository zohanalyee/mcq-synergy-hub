#!/usr/bin/env node
/**
 * Wrapper around `vite build` for the prerendered production build.
 *
 * Why: the prerender pass leaves an esbuild service child process alive, so
 * `vite build` writes dist/ completely, logs "Prerendered N pages", and then
 * never exits. The deploy build therefore hit its wall-clock deadline even
 * though the output was already correct.
 *
 * This wrapper streams vite's output through unchanged, and once the prerender
 * summary has been printed (and dist/index.html exists) it gives vite a short
 * grace period to flush and then terminates the idle process with exit code 0.
 * A real build failure still exits non-zero, exactly as before.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distIndex = path.join(root, 'dist', 'index.html');
const GRACE_MS = 3000;
// Fallback for builds where vite hangs BEFORE printing the prerender summary:
// if dist/index.html exists and vite has produced no output for this long, the
// output is already written and the process is simply idle.
const IDLE_MS = 90 * 1000;
const HARD_TIMEOUT_MS = 20 * 60 * 1000;

const child = spawn('npx', ['vite', 'build', ...process.argv.slice(2)], {
  cwd: root,
  env: { ...process.env, PRERENDER: 'true' },
  stdio: ['inherit', 'pipe', 'pipe'],
});

let finished = false;
let graceTimer = null;

const stop = (reason) => {
  if (finished) return;
  finished = true;
  console.log(`[build-client] ${reason} — build output is complete, stopping idle vite process.`);
  try { child.kill('SIGKILL'); } catch { /* already gone */ }
  process.exit(0);
};

let idleTimer = null;
const armIdleTimer = () => {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (existsSync(distIndex)) stop(`no vite output for ${IDLE_MS / 1000}s`);
  }, IDLE_MS);
  idleTimer.unref?.();
};

const watch = (stream, out) => {
  let buffer = '';
  stream.on('data', (chunk) => {
    const text = chunk.toString();
    out.write(text);
    armIdleTimer();
    buffer = (buffer + text).slice(-4000);
    if (/Prerendered\s+\d+\s+pages/.test(buffer) && !graceTimer) {
      graceTimer = setTimeout(() => {
        if (existsSync(distIndex)) stop('prerender complete');
      }, GRACE_MS);
    }
  });
};

armIdleTimer();

watch(child.stdout, process.stdout);
watch(child.stderr, process.stderr);

const hardTimer = setTimeout(() => {
  if (finished) return;
  console.error('[build-client] vite build exceeded the hard timeout.');
  try { child.kill('SIGKILL'); } catch { /* already gone */ }
  process.exit(1);
}, HARD_TIMEOUT_MS);
hardTimer.unref?.();

child.on('exit', (code, signal) => {
  if (finished) return;
  finished = true;
  if (graceTimer) clearTimeout(graceTimer);
  if (code === 0) process.exit(0);
  console.error(`[build-client] vite build failed (code=${code} signal=${signal ?? 'none'}).`);
  process.exit(code ?? 1);
});
