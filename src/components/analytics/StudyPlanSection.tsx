import { Calendar, FileText, Target, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import type { AnalyticsData } from "@/hooks/useAnalyticsData";
import { generateStudyPlan } from "@/lib/aiCoach";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Props {
  data: AnalyticsData;
}

const StudyPlanSection = ({ data }: Props) => {
  const navigate = useNavigate();
  const [plan] = useState(() => generateStudyPlan(data));
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Your Personalized Study Plan</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            This Week
          </h3>
          <div className="space-y-3">
            {plan.thisWeek.map((task, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Checkbox
                  id={`task-${idx}`}
                  checked={!!checked[idx]}
                  onCheckedChange={(v) => setChecked((p) => ({ ...p, [idx]: !!v }))}
                />
                <label htmlFor={`task-${idx}`} className="text-sm cursor-pointer leading-tight">
                  {task.description}
                  <p className="text-xs text-muted-foreground mt-0.5">{task.duration}</p>
                </label>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" />
            Recommended Tests
          </h3>
          <div className="space-y-3">
            {plan.recommendedTests.map((test, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="text-sm min-w-0 flex-1 mr-2">
                  <p className="font-medium truncate">{test.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {test.questions} questions • {test.duration}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/mock-tests")}>
                  Start
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            Weekly Goals
          </h3>
          <div className="space-y-3">
            {plan.goals.map((goal, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{goal.name}</span>
                  <span className="font-medium text-xs">
                    {goal.current}/{goal.target}
                  </span>
                </div>
                <Progress value={Math.min(100, (goal.current / goal.target) * 100)} className="h-2" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudyPlanSection;
