// "Job Test: <title>" is a hidden storage key for every mock test (progress and
// resume depend on it). Only the SHOWN label drops the prefix for non-job tests.
const NON_JOB = /talent hunt|\bnthp\b|\bsthp\b|admission|entry test|\bmdcat\b|\becat\b|\busat\b|\bnat\b|\bgat\b|foundation semester/i;

export function displaySessionName(name) {
  const s = String(name || '');
  if (!s.startsWith('Job Test:')) return s;
  const title = s.replace(/^Job Test:\s*/, '');
  return NON_JOB.test(title) ? title : s;
}
