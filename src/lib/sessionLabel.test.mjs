import test from 'node:test';
import assert from 'node:assert/strict';
import { displaySessionName } from './sessionLabel.js';

test('non-job tests show no "Job Test:" prefix; job tests keep it', () => {
  assert.equal(displaySessionName('Job Test: IBA Karachi NTHP Mock Test 2027'), 'IBA Karachi NTHP Mock Test 2027');
  assert.equal(displaySessionName('Job Test: Sukkur IBA Sindh Talent Hunt Program (STHP) 2027'), 'Sukkur IBA Sindh Talent Hunt Program (STHP) 2027');
  assert.equal(displaySessionName('Job Test: Junior Office Associate BPS-13'), 'Job Test: Junior Office Associate BPS-13');
  assert.equal(displaySessionName('Practice: Algebra'), 'Practice: Algebra');
});
