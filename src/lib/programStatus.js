// Shared open/closed rules for multi-round programmes (e.g. IBA Karachi NTHP).
// Plain JS so the app and node build scripts use identical logic.
const DAY = 24 * 60 * 60 * 1000;

/** A round closes the day after its own deadline (Pakistan time). */
export function isRoundClosed(closesIso, now = Date.now()) {
  if (!closesIso) return false;
  return now >= Date.parse(`${closesIso}T00:00:00+05:00`) + DAY;
}

/** Adds `closed` to each round row. */
export function withRoundStatus(programs, now = Date.now()) {
  return (programs || []).map((p) => ({ ...p, closed: isRoundClosed(p.closesIso, now) }));
}

/** IBA Karachi National Talent Hunt Program tests. */
export function isNthpTest(organization, title) {
  return /\bnthp\b|national talent hunt/i.test(`${organization || ''} ${title || ''}`);
}

/** STS-conducted tests (link to /exams/sts). NTHP is IBA Karachi, never STS. */
export function isStsTest(organization, title) {
  if (isNthpTest(organization, title)) return false;
  return /sts|siba|sukkur iba|high court of sindh/i.test(`${organization || ''} ${title || ''}`);
}
