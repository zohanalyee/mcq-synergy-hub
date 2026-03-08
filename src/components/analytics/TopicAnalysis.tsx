import { TrendingDown, Play, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { SubjectAnalytics } from "@/hooks/useAnalyticsData";
import { useNavigate } from "react-router-dom";

interface Props {
  subjects: SubjectAnalytics[];
}

const TopicAnalysis = ({ subjects }: Props) => {
  const navigate = useNavigate();
  const subjectsWithTopics = subjects.filter((s) => s.topics.length > 0);

  if (subjectsWithTopics.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-3">Topic-Level Performance</h2>
        <p className="text-sm text-muted-foreground">Topic-level breakdowns will appear as you take more tests with detailed answer data.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-3">Topic-Level Performance</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {subjectsWithTopics.map((subject) => (
          <AccordionItem key={subject.name} value={subject.name} className="border rounded-lg px-3">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center justify-between w-full pr-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold text-sm">{subject.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{subject.topics.length} topics</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-2">
                {subject.topics.map((topic) => (
                  <div
                    key={topic.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-medium text-sm truncate">{topic.name}</p>
                        <Badge variant={topic.accuracy >= 70 ? "default" : "destructive"} className="text-xs ml-2">
                          {topic.accuracy}%
                        </Badge>
                      </div>
                      <Progress value={topic.accuracy} className="h-1.5" />
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{topic.questionsAttempted} attempted</span>
                        <span>•</span>
                        <span>{topic.correctAnswers} correct</span>
                        {topic.accuracy < 70 && (
                          <>
                            <span>•</span>
                            <span className="text-orange-500 flex items-center gap-0.5">
                              <TrendingDown className="w-3 h-3" />
                              Needs practice
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => navigate("/custom-syllabus")}>
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default TopicAnalysis;
