import { supabase } from "@/integrations/supabase/client";

export interface TopicStats {
  name: string;
  approvedCount: number;
}

export interface SubjectStats {
  name: string;
  totalApproved: number;
  topics: TopicStats[];
}

export interface AggregatedStats {
  subjects: SubjectStats[];
  grandTotal: number;
  lowContentCount: number; // Topics with < 10 questions
  totalTopics: number;
}

export const fetchContentStats = async (): Promise<AggregatedStats> => {
  // Fetch approved MCQ content grouped by subject and topic
  const { data, error } = await supabase
    .from("content_items")
    .select("subject, topic")
    .eq("category", "mcq")
    .eq("status", "approved");

  if (error) {
    console.error("Error fetching content stats:", error);
    throw error;
  }

  // Aggregate data in JavaScript
  const statsMap = new Map<string, Map<string, number>>();

  (data || []).forEach((item) => {
    const subject = item.subject || "Uncategorized";
    const topic = item.topic || "General";

    if (!statsMap.has(subject)) {
      statsMap.set(subject, new Map());
    }

    const topicMap = statsMap.get(subject)!;
    topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
  });

  // Convert to structured format
  const subjects: SubjectStats[] = [];
  let grandTotal = 0;
  let lowContentCount = 0;
  let totalTopics = 0;

  // Sort subjects alphabetically
  const sortedSubjects = Array.from(statsMap.keys()).sort((a, b) => 
    a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b)
  );

  sortedSubjects.forEach((subjectName) => {
    const topicMap = statsMap.get(subjectName)!;
    const topics: TopicStats[] = [];
    let subjectTotal = 0;

    // Sort topics alphabetically
    const sortedTopics = Array.from(topicMap.keys()).sort((a, b) =>
      a === "General" ? 1 : b === "General" ? -1 : a.localeCompare(b)
    );

    sortedTopics.forEach((topicName) => {
      const count = topicMap.get(topicName)!;
      topics.push({ name: topicName, approvedCount: count });
      subjectTotal += count;
      totalTopics++;

      if (count < 10) {
        lowContentCount++;
      }
    });

    subjects.push({
      name: subjectName,
      totalApproved: subjectTotal,
      topics,
    });

    grandTotal += subjectTotal;
  });

  return {
    subjects,
    grandTotal,
    lowContentCount,
    totalTopics,
  };
};
