import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { getSystemTheme } from "@/lib/subjectTheme";

interface GroupableSubject {
  id: string;
  name: string;
  system?: string;
  level?: string;
}

interface GroupedSubjectGridProps<T extends GroupableSubject> {
  subjects: T[];
  groupBy?: "system" | "level" | "none";
  renderCard: (subject: T) => React.ReactNode;
  /** Optional ordered list of group names to enforce display order. */
  groupOrder?: string[];
  className?: string;
  /** Tailwind grid classes for the card grid inside each group. */
  gridClassName?: string;
}

export function GroupedSubjectGrid<T extends GroupableSubject>({
  subjects,
  groupBy = "system",
  renderCard,
  groupOrder,
  className,
  gridClassName = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 items-start",
}: GroupedSubjectGridProps<T>) {
  const groups = useMemo(() => {
    if (groupBy === "none") {
      return [["All Subjects", [...subjects].sort((a, b) => a.name.localeCompare(b.name))]] as Array<[string, T[]]>;
    }

    const map = new Map<string, T[]>();
    for (const s of subjects) {
      const key =
        groupBy === "system"
          ? s.system || "Other"
          : s.level || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }

    // Sort within each group alphabetically
    map.forEach((arr) =>
      arr.sort((a, b) => a.name.localeCompare(b.name))
    );

    let entries = Array.from(map.entries());

    if (groupOrder && groupOrder.length) {
      entries.sort((a, b) => {
        const ai = groupOrder.indexOf(a[0]);
        const bi = groupOrder.indexOf(b[0]);
        const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
        const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
        if (aRank !== bRank) return aRank - bRank;
        return a[0].localeCompare(b[0]);
      });
    } else {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    }

    return entries;
  }, [subjects, groupBy, groupOrder]);

  // If only one group, hide the header chrome — avoids redundant labelling.
  const hideHeader = groupBy === "none" || groups.length <= 1;

  return (
    <div className={className}>
      <div className="space-y-6">
        {groups.map(([groupName, groupSubjects]) => {
          const theme = getSystemTheme(groupName);
          return (
            <section key={groupName}>
              {!hideHeader && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 mb-3 px-1"
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: theme.main }}
                    aria-hidden
                  />
                  <h2
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: theme.main }}
                  >
                    {groupName}
                  </h2>
                  <span className="text-[10px] text-muted-foreground">
                    {groupSubjects.length} subject
                    {groupSubjects.length === 1 ? "" : "s"}
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{
                      background: `linear-gradient(to right, ${theme.border}, transparent)`,
                    }}
                    aria-hidden
                  />
                </motion.div>
              )}

              <div className={gridClassName}>
                {groupSubjects.map((s) => (
                  <React.Fragment key={s.id}>{renderCard(s)}</React.Fragment>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default GroupedSubjectGrid;
