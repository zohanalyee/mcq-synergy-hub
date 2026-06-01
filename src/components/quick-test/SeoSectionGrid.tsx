import { QuickTestChip } from "./QuickTestChip";
import { useSeoLmsCoverage } from "./useSeoLmsCoverage";
import { getSeoLmsContext } from "@/data/seoLmsMapping";

type Props = {
  title: string;
  accent: string;
  subject: string;
  topics: string[];
  examName: string;
  returnPath: string;
};

/**
 * Subject-scoped topic chip grid for SEO landing pages.
 *
 * Reuse-first: when the page (via returnPath) maps to an existing LMS level,
 * each topic chip is resolved to its existing LMS topic so it can deep-link
 * into practice/reading/subject content instead of always generating fresh
 * questions. Pages without a mapping keep the original Quick Test behaviour.
 */
export const SeoSectionGrid = ({
  title,
  accent,
  subject,
  topics,
  examName,
  returnPath,
}: Props) => {
  const ctx = getSeoLmsContext(returnPath);
  const { resolve } = useSeoLmsCoverage(ctx);

  return (
    <section className="mb-8">
      <h2 className={`text-xl font-semibold mb-3 ${accent}`}>{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {topics.map((t) => (
          <QuickTestChip
            key={t}
            topicName={t}
            subjects={[subject]}
            examName={examName}
            returnPath={returnPath}
            resolved={resolve(t)}
          />
        ))}
      </div>
    </section>
  );
};
