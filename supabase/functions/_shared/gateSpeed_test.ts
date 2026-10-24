import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { priorityTier, orderTests, exactDupKey, canStartCall, hasTimeFor, usableKeyIndexes } from './qualityChecks.ts';

Deno.test('hard time check before slow steps (45 s budget)', () => {
  assertEquals(hasTimeFor(40000, 4000, 45000), true);
  assertEquals(hasTimeFor(42000, 4000, 45000), false);
  assertEquals(hasTimeFor(45001, 0, 45000), false);
});

Deno.test('keys in daily cooldown are not used again; none usable stops the run', () => {
  const now = 1_000_000;
  const health = { '0': { ok: false, cooldown_until: now + 3600_000 }, '1': { ok: false, cooldown_until: now - 1 }, '2': { ok: true } };
  assertEquals(usableKeyIndexes([0, 1, 2], health, now), [1, 2]);
  const allParked = { '0': { ok: false, cooldown_until: now + 1 }, '1': { ok: false, cooldown_until: now + 1 }, '2': { ok: false, cooldown_until: now + 1 } };
  assertEquals(usableKeyIndexes([0, 1, 2], allParked, now), []);
});

Deno.test('priority tiers', () => {
  assertEquals(priorityTier('Junior Clerk (BPS-11) - SIBA Testing Services (STS)'), 0);
  assertEquals(priorityTier('EST Physics', 'IBA Community Colleges & Schools'), 0);
  assertEquals(priorityTier('IBA Karachi NTHP Mock Test 2027'), 1);
  assertEquals(priorityTier('Sukkur IBA Sindh Talent Hunt Program (STHP) 2027'), 2);
  assertEquals(priorityTier('Sindh Teaching License Exam - EST'), 3);
  assertEquals(priorityTier('Junior Office Associate (BPS-13)'), 9);
  assertEquals(priorityTier('Clerk', 'STS (Sindh Testing Service)'), 9);
});

Deno.test('order: tier first, then oldest checked', () => {
  const t = [{ id: 'a', tier: 9 }, { id: 'b', tier: 0 }, { id: 'c', tier: 9 }, { id: 'd', tier: 1 }];
  const o = orderTests(t, { a: '2026-10-23T05:00Z', c: '2026-10-20T05:00Z' }).map((x) => x.id);
  assertEquals(o, ['b', 'd', 'c', 'a']);
});

Deno.test('exact duplicate key', () => {
  const q = { id: '1', question: 'Capital of Pakistan?', options: ['Lahore', 'Islamabad', 'Karachi', 'Quetta'], correct_answer: 'B' };
  const same = { id: '2', question: 'capital of pakistan', options: ['Quetta', 'Karachi', 'Islamabad', 'Lahore'], correct_answer: 'C' };
  const wrongKey = { ...same, correct_answer: 'A' };
  const oneOpt = { ...q, options: ['Lahore', 'Islamabad', 'Karachi', 'Peshawar'] };
  assertEquals(exactDupKey(q), exactDupKey(same));
  assertEquals(exactDupKey(q) === exactDupKey(wrongKey), false);
  assertEquals(exactDupKey(q) === exactDupKey(oneOpt), false);
  assertEquals(exactDupKey({ ...q, correct_answer: 'Z' }), null);
});

Deno.test('stop rules: time, run limit, daily cap', () => {
  const o = { budgetMs: 45000, perCallMs: 15000, maxRunCalls: 8, dailyCap: 300 };
  assertEquals(canStartCall(10000, 0, 0, o).ok, true);
  assertEquals(canStartCall(31000, 0, 0, o).ok, false);
  assertEquals(canStartCall(0, 8, 0, o).ok, false);
  assertEquals(canStartCall(0, 0, 300, o).ok, false);
});
