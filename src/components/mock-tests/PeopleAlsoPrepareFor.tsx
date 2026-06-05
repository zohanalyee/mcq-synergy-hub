import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { JobTest } from "@/services/jobTestService";
import { toJobTestSlug } from "@/lib/jobTestSlug";

interface PeopleAlsoPrepareForProps {
  current: JobTest;
  allTests: JobTest[];
  limit?: number;
}

/**
 * Contextual internal-linking block. Surfaces sibling mock tests from the
 * same organisation first (keyword-rich anchors like "FIA ASI Mock Test"),
 * then fills with other popular mock tests. Anchor text intentionally appends
 * "Mock Test" for SEO consistency while preserving each test's own keywords.
 */
export const PeopleAlsoPrepareFor = ({ current, allTests, limit = 8 }: PeopleAlsoPrepareForProps) => {
  const others = allTests.filter((t) => t.id !== current.id);
  const sameOrg = others.filter((t) => t.organization === current.organization);
  const restOrg = others.filter((t) => t.organization !== current.organization);
  const items = [...sameOrg, ...restOrg].slice(0, limit);

  if (items.length === 0) return null;

  const anchorText = (t: JobTest) =>
    /mock test/i.test(t.title) ? t.title : `${t.title} Mock Test`;

  return (
    <section aria-labelledby="also-prepare-heading" className="space-y-3">
      <h2 id="also-prepare-heading" className="text-lg font-semibold text-foreground">
        People Also Prepare For
      </h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((t) => (
          <li key={t.id}>
            <Link
              to={`/mock-tests/${toJobTestSlug(t, allTests)}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              {anchorText(t)}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PeopleAlsoPrepareFor;
