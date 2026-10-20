import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { decideBudget, isKeyCooling, googleDayStart, type FreeBudgetConfig } from './freeBudget.ts';

const cfg: FreeBudgetConfig = {
  enabled: true,
  groups: { user: { reserve: 150 }, quality_gate: { max: 100 }, auto_fill: { max: 120 }, admin_bulk: { max: 60 } },
  total_max: 450,
};

Deno.test('background group refused when its own budget is used up', () => {
  assertEquals(decideBudget(cfg, 'quality_gate', { group: 100, user: 0, total: 100 }).allowed, false);
  assertEquals(decideBudget(cfg, 'quality_gate', { group: 99, user: 0, total: 99 }).allowed, true);
});

Deno.test('background group refused when it would eat the learner reserve', () => {
  // 300 used by background, learners used 0 → 150 still reserved → 300+150 = 450 reached.
  assertEquals(decideBudget(cfg, 'auto_fill', { group: 50, user: 0, total: 300 }).allowed, false);
  // Learners already used their 150 → reserve gone, 300 < 450 ok.
  assertEquals(decideBudget(cfg, 'auto_fill', { group: 50, user: 150, total: 300 }).allowed, true);
});

Deno.test('learner calls are never blocked by the budget', () => {
  assertEquals(decideBudget(cfg, 'user', { group: 999, user: 999, total: 999 }).allowed, true);
});

Deno.test('disabled budget allows everything', () => {
  assertEquals(decideBudget({ ...cfg, enabled: false }, 'admin_bulk', { group: 999, user: 0, total: 999 }).allowed, true);
});

Deno.test('key in cooldown is detected, expired cooldown is not', () => {
  const now = 1_000_000;
  const health = { '0': { ok: false, cooldown_until: now + 1 }, '1': { ok: false, cooldown_until: now - 1 }, '2': { ok: true } };
  assertEquals(isKeyCooling(health, 0, now), true);
  assertEquals(isKeyCooling(health, 1, now), false);
  assertEquals(isKeyCooling(health, 2, now), false);
});

Deno.test('Google day starts at 08:00 UTC', () => {
  assertEquals(googleDayStart(new Date('2026-10-20T06:00:00Z')).toISOString(), '2026-10-19T08:00:00.000Z');
  assertEquals(googleDayStart(new Date('2026-10-20T09:00:00Z')).toISOString(), '2026-10-20T08:00:00.000Z');
});

import { switchPolicy } from './freeBudget.ts';

Deno.test('learner call keeps paid fallback and the retry pass', () => {
  const p = switchPolicy('user', true);
  assertEquals(p.forceFreeOnly, false);
  assertEquals(p.checkBudget, false);
  assertEquals(p.retryAfterAll429, true);
});

Deno.test('background call is free-only, budget-checked, no retry', () => {
  for (const g of ['quality_gate', 'auto_fill', 'admin_bulk'] as const) {
    const p = switchPolicy(g, true);
    assertEquals([p.forceFreeOnly, p.checkBudget, p.retryAfterAll429], [true, true, false]);
  }
});

Deno.test('budget disabled restores previous behaviour', () => {
  const p = switchPolicy('auto_fill', false);
  assertEquals([p.forceFreeOnly, p.checkBudget, p.retryAfterAll429, p.skipCoolingKeys], [false, false, true, false]);
});
