import { BookOpen, AlertTriangle, Lightbulb, PlayCircle, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SubjectAnalytics } from "@/hooks/useAnalyticsData";
import { getSubjectStatus, generateRecommendation } from "@/lib/aiCoach";
import { useNavigate } from "react-router-dom";

interface Props {
  subject: SubjectAnalytics;
}

const SubjectAnalysisCard = ({ subject }: Props) => {
  const navigate = useNavigate();
  const status = getSubjectStatus(subject.accuracy);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${status.bg}`}>
            <BookOpen className={`w-4 h-4 ${status.icon}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{subject.name}</h3>
            <p className="text-xs text-muted-foreground">
              {subject.totalQuestions} questions • {subject.testsCount} tests
            </p>
          </div>
        </div>
        <Badge variant={status.variant}>{subject.accuracy}%</Badge>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Accuracy</span>
          <span className={status.text}>{status.label}</span>
        </div>
        <Progress value={subject.accuracy} className="h-2" />
      </div>

      {subject.topics.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
            {subject.topics.filter(t => t.accuracy < 70).length > 0 ? "Weak Topics:" : "Topics:"}
          </p>
          <div className="flex flex-wrap gap-1">
            {subject.topics.filter(t => t.accuracy < 70).slice(0, 3).map((topic) => (
              <Badge key={topic.name} variant="outline" className="text-xs">
                {topic.name} ({topic.accuracy}%)
              </Badge>
            ))}
            {subject.topics.filter(t => t.accuracy < 70).length === 0 && (
              <span className="text-xs text-muted-foreground">All topics above 70%!</span>
            )}
          </div>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-2.5 mb-3">
        <p className="text-xs font-medium mb-0.5 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          AI Recommendation:
        </p>
        <p className="text-xs text-muted-foreground">{generateRecommendation(subject)}</p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => navigate("/custom-syllabus")}
        >
          <PlayCircle className="w-3.5 h-3.5 mr-1" />
          Practice
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => navigate("/mock-tests")}
        >
          <Zap className="w-3.5 h-3.5 mr-1" />
          Take Test
        </Button>
      </div>
    </Card>
  );
};

export default SubjectAnalysisCard;
