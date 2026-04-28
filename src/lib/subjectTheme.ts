/**
 * Centralized subject color theming.
 *
 * Strategy: System-base hue + per-subject hash variation.
 * - Each Educational System (Federal, Sindh, Punjab, KPK, Cambridge…) gets
 *   a base hue, so cards from the same board feel cohesive.
 * - Within a system, each subject gets a deterministic ±30° hue offset
 *   derived from a hash of its name, so cards stay visually distinct.
 *
 * Returns HSL color strings to satisfy the project design-system rule
 * (all colors must be HSL).
 */

export interface SubjectTheme {
  /** Solid color for icons / badges / accents (CSS hsl string). */
  main: string;
  /** Soft pastel surface (low-alpha hsl string). */
  surface: string;
  /** Subtle border (medium-alpha hsl string). */
  border: string;
  /** Light tint for hovers / sub-chrome. */
  light: string;
  /** Raw hue used (0–360). Useful for derived computations. */
  hue: number;
}

const SYSTEM_HUES: Array<{ match: RegExp; hue: number }> = [
  { match: /federal|fbise/i, hue: 211 }, // blue
  { match: /sindh|bsek|biek|bisemir/i, hue: 158 }, // green
  { match: /punjab|bisep|bise.+(lahore|gujranwala|multan|rawalpindi|sahiwal|sargodha|faisalabad|dgkhan)/i, hue: 30 }, // orange
  { match: /cambridge|caie|edexcel|aqa|o.?level|a.?level|igcse/i, hue: 270 }, // purple
  { match: /kpk|khyber|peshawar|abbottabad|kohat|swat|bannu|malakand/i, hue: 190 }, // cyan
  { match: /balochistan|quetta/i, hue: 340 }, // pink
  { match: /aga\s*khan|agha\s*khan|aku/i, hue: 12 }, // warm red-orange
  { match: /azad\s*kashmir|ajk|mirpur/i, hue: 100 }, // lime-green
];

const FALLBACK_HUE = 222; // slate-blue

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSystemHue(systemName?: string): number {
  if (!systemName) return FALLBACK_HUE;
  const found = SYSTEM_HUES.find((s) => s.match.test(systemName));
  return found ? found.hue : FALLBACK_HUE;
}

export function getSubjectTheme(
  subjectName: string,
  systemName?: string
): SubjectTheme {
  const baseHue = getSystemHue(systemName);
  // Deterministic ±30° offset based on subject name
  const offset = (hashString(subjectName || "x") % 61) - 30;
  const hue = (baseHue + offset + 360) % 360;

  return {
    hue,
    main: `hsl(${hue} 70% 50%)`,
    surface: `hsl(${hue} 75% 95% / 0.65)`,
    border: `hsl(${hue} 50% 80% / 0.6)`,
    light: `hsl(${hue} 70% 92%)`,
  };
}

/** A muted theme used when we just need the system color, not a per-subject one. */
export function getSystemTheme(systemName?: string): SubjectTheme {
  const hue = getSystemHue(systemName);
  return {
    hue,
    main: `hsl(${hue} 70% 50%)`,
    surface: `hsl(${hue} 75% 95% / 0.5)`,
    border: `hsl(${hue} 50% 80% / 0.5)`,
    light: `hsl(${hue} 70% 94%)`,
  };
}
