import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, ChevronDown, BookOpen, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface TestAttempt {
  id: string;
  test_type: string;
  score: number;
  total_questions: number;
  time_taken: number | null;
  completed_at: string | null;
  created_at: string;
  subjects: string[] | null;
}

interface Props {
  attempts: TestAttempt[];
}

const getSourceLabel = (testType: string) => {
  const map: Record<string, { label: string; color: string }> = {
    custom_quiz: { label: "Custom Quiz", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    syllabus_builder: { label: "Syllabus", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    mock_test: { label: "Mock Test", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    practice: { label: "Practice", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  };
  return map[testType] || { label: testType.replace(/_/g, " "), color: "bg-muted text-muted-foreground" };
};

const TestHistorySection = ({ attempts }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? attempts : attempts.slice(0, 5);

  if (attempts.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Test History
        </h2>
        <Badge variant="outline" className="text-xs">
          {attempts.length} total
        </Badge>
      </div>

      <div className="space-y-2">
        {displayed.map((attempt) => {
          const percentage = attempt.total_questions > 0
            ? Math.round((attempt.score / attempt.total_questions) * 100)
            : 0;
          const passed = percentage >= 50;
          const source = getSourceLabel(attempt.test_type);
          const timeStr = attempt.time_taken
            ? `${Math.floor(attempt.time_taken / 60)}m ${attempt.time_taken % 60}s`
            : null;

          return (
            <Card key={attempt.id} className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                passed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
              }`}>
                {passed
                  ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  : <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${source.color}`}>
                    {source.label}
                  </span>
                  {attempt.subjects?.slice(0, 2).map((s) => (
                    <span key={s} className="text-[10px] text-muted-foreground">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-semibold">{attempt.score}/{attempt.total_questions}</span>
                  <span className={`text-xs font-medium ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    ({percentage}%)
                  </span>
                  {timeStr && <span className="text-[10px] text-muted-foreground">• {timeStr}</span>}
                </div>
              </div>

              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(attempt.completed_at || attempt.created_at), { addSuffix: true })}
              </span>
            </Card>
          );
        })}
      </div>

      {attempts.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-xs"
          onClick={() => setShowAll(!showAll)}
        >
          <ChevronDown className={`w-3 h-3 mr-1 transition-transform ${showAll ? "rotate-180" : ""}`} />
          {showAll ? "Show less" : `Show all ${attempts.length} attempts`}
        </Button>
      )}
    </div>
  );
};

export default TestHistorySection;
