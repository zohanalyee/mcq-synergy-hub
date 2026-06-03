import { toSlug } from "@/lib/slugUtils";
import type { JobTest } from "@/services/jobTestService";

/**
 * Clean, SEO-friendly slugs for mock/job tests.
 * UUIDs are NEVER exposed in public URLs — the slug is derived from the
 * test title, and collisions are resolved with a meaningful organization
 * suffix rather than a UUID.
 */

const orgSuffix = (organization?: string): string => {
  if (!organization) return "";
  // Use an acronym of capital letters if present (e.g. "Federal Investigation Agency (FIA)" -> "fia")
  const paren = organization.match(/\(([^)]+)\)/);
  if (paren && paren[1]) return toSlug(paren[1]);
  const acronym = (organization.match(/[A-Z]/g) || []).join("");
  if (acronym.length >= 2) return acronym.toLowerCase();
  return toSlug(organization).split("-").slice(0, 2).join("-");
};

/** Base slug for a single test (no collision handling). */
export const baseJobTestSlug = (test: Pick<JobTest, "title">): string =>
  toSlug(test.title);

/**
 * Build a unique slug for `test` within the full `allTests` list.
 * If the base slug collides with another test, append the organization suffix.
 */
export const toJobTestSlug = (
  test: Pick<JobTest, "title" | "organization" | "id">,
  allTests: Pick<JobTest, "title" | "organization" | "id">[],
): string => {
  const base = baseJobTestSlug(test);
  const collisions = allTests.filter((t) => baseJobTestSlug(t) === base);
  if (collisions.length <= 1) return base;

  const suffix = orgSuffix(test.organization);
  const withOrg = suffix ? `${base}-${suffix}` : base;

  // Still colliding (same title + same org acronym)? add a short index.
  const orgCollisions = collisions.filter(
    (t) => `${base}-${orgSuffix(t.organization)}` === withOrg,
  );
  if (orgCollisions.length <= 1) return withOrg;

  const index = orgCollisions.findIndex((t) => t.id === test.id);
  return index <= 0 ? withOrg : `${withOrg}-${index + 1}`;
};

/** Resolve a slug back to the matching test from the full list. */
export const resolveJobTestBySlug = <T extends Pick<JobTest, "title" | "organization" | "id">>(
  slug: string,
  allTests: T[],
): T | null => {
  if (!slug || !allTests.length) return null;
  const target = slug.toLowerCase();
  // Exact unique-slug match first.
  const exact = allTests.find((t) => toJobTestSlug(t, allTests) === target);
  if (exact) return exact;
  // Fallback: base-slug match (handles older/looser links).
  const base = allTests.find((t) => baseJobTestSlug(t) === target);
  return base || null;
};
