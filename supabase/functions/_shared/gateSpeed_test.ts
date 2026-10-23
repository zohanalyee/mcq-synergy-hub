import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { priorityTier, orderTests, exactDupKey, canStartCall } from './qualityChecks.ts';

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
