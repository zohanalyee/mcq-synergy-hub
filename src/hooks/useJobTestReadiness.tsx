import { useEffect, useState } from "react";
import {
  JobTest,
  findDefinitionForTest,
  getSectionCoverage,
} from "@/services/jobTestService";

export type ReadinessState = "loading" | "ready" | "incomplete" | "no-definition";

export interface ReadinessInfo {
  state: ReadinessState;
  approved: number;
  target: number;
  incompleteSections: number;
}

/**
 * Loads a per-test readiness map so the admin can see at a glance which
 * mock tests still have missing (unapproved / not-yet-generated) questions.
 * Read-only — never triggers generation.
 */
export function useJobTestReadiness(jobTests: JobTest[], refreshKey = 0) {
  const [map, setMap] = useState<Record<string, ReadinessInfo>>({});

  useEffect(() => {
    let cancelled = false;
    if (jobTests.length === 0) {
      setMap({});
      return;
    }

    (async () => {
      const results = await Promise.all(
        jobTests.map(async (t) => {
          try {
            const def = await findDefinitionForTest({
              definition_id: (t as any).definition_id,
              title: t.title,
            });
            if (!def) {
              return [t.id, { state: "no-definition", approved: 0, target: 0, incompleteSections: 0 }] as const;
            }
            const sections = def.syllabus?.sections || [];
            const coverage = await getSectionCoverage(def.id, sections);
            const info: ReadinessInfo = {
              state: coverage.ready ? "ready" : "incomplete",
              approved: coverage.totalApproved,
              target: coverage.totalTarget,
              incompleteSections: coverage.sections.filter((s) => !s.complete).length,
            };
            return [t.id, info] as const;
          } catch {
            return [t.id, { state: "no-definition", approved: 0, target: 0, incompleteSections: 0 }] as const;
          }
        }),
      );
      if (!cancelled) {
        setMap(Object.fromEntries(results));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobTests.map((t) => t.id).join(","), refreshKey]);

  return map;
}
