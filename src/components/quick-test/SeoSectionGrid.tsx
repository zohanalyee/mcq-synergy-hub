import { QuickTestChip } from "./QuickTestChip";

type Props = {
  title: string;
  accent: string;
  subject: string;
  topics: string[];
  examName: string;
  returnPath: string;
};

/** Subject-scoped topic chip grid for SEO landing pages. */
export const SeoSectionGrid = ({
  title,
  accent,
  subject,
  topics,
  examName,
  returnPath,
}: Props) => (
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
        />
      ))}
    </div>
  </section>
);
