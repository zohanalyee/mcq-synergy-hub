import { Link } from "react-router-dom";
import { Building, ArrowRight } from "lucide-react";
import { JobTest } from "@/services/jobTestService";
import { toJobTestSlug } from "@/lib/jobTestSlug";

interface RelatedMockTestsProps {
  current: JobTest;
  allTests: JobTest[];
  limit?: number;
}

export const RelatedMockTests = ({ current, allTests, limit = 6 }: RelatedMockTestsProps) => {
  const others = allTests.filter((t) => t.id !== current.id);
  // Prioritise same organisation, then fill with the rest.
  const sameOrg = others.filter((t) => t.organization === current.organization);
  const restOrg = others.filter((t) => t.organization !== current.organization);
  const related = [...sameOrg, ...restOrg].slice(0, limit);

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-tests-heading" className="space-y-3">
      <h2 id="related-tests-heading" className="text-lg font-semibold text-foreground">
        Related Mock Tests
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {related.map((t) => (
          <Link
            key={t.id}
            to={`/mock-tests/${toJobTestSlug(t, allTests)}`}
            className="group rounded-xl border border-border bg-card/60 p-3 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary">
              {t.title}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              <span className="line-clamp-1">{t.organization}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
              View test preparation <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedMockTests;
