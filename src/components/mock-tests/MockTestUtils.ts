
import { subjects } from "@/pages/Subjects";
import { getRandomTopics } from "@/utils/mockTestUtils";

export const generateAllMockTests = () => {
  return subjects.map((subject, index) => ({
    id: index + 1,
    title: subject.title,
    description: `Practice test for ${subject.title} covering all essential topics`,
    category: subject.category,
    difficulty: "Medium",
    duration: 45,
    questions: 30,
    topics: getRandomTopics(subject.title, 5)
  }));
};
