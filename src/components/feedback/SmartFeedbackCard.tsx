import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, Target, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SmartFeedbackCardProps {
  score: number;
  totalQuestions: number;
  timeTaken?: number;
  subjects?: string[];
  testType?: string;
}

const SmartFeedbackCard = ({ 
  score, 
  totalQuestions, 
  timeTaken,
  subjects = [],
  testType = "quiz"
}: SmartFeedbackCardProps) => {
  const navigate = useNavigate();
  const percentage = Math.round((score / totalQuestions) * 100);

  // Determine feedback type based on score
  const getFeedbackConfig = () => {
    if (percentage >= 90) {
      return {
        icon: Zap,
        title: "Outstanding Performance!",
        message: "You've mastered this topic. Consider trying harder questions or exploring new subjects.",
        variant: "success" as const,
        actionLabel: "Try Advanced Topics",
        actionPath: "/custom-syllabus"
      };
    } else if (percentage >= 70) {
      return {
        icon: TrendingUp,
        title: "Great Progress!",
        message: "You're doing well. A bit more practice will help you achieve mastery.",
        variant: "info" as const,
        actionLabel: "Practice More",
        actionPath: "/custom-syllabus"
      };
    } else if (percentage >= 50) {
      return {
        icon: Target,
        title: "Keep Going!",
        message: "You're on the right track. Focus on the topics you missed to improve your score.",
        variant: "warning" as const,
        actionLabel: "Review Weak Areas",
        actionPath: "/custom-syllabus"
      };
    } else {
      return {
        icon: AlertCircle,
        title: "Needs Improvement",
        message: subjects.length > 0 
          ? `Focus on ${subjects.slice(0, 2).join(" and ")}. Our AI can create a specialized practice test.`
          : "Don't worry! Practice makes perfect. Try a focused quiz to improve.",
        variant: "destructive" as const,
        actionLabel: subjects.length > 0 ? `Improve ${subjects[0]}` : "Practice Now",
        actionPath: "/custom-syllabus"
      };
    }
  };

  const config = getFeedbackConfig();
  const Icon = config.icon;

  const variantStyles = {
    success: "border-green-500/50 bg-green-500/5",
    info: "border-blue-500/50 bg-blue-500/5",
    warning: "border-yellow-500/50 bg-yellow-500/5",
    destructive: "border-destructive/50 bg-destructive/5"
  };

  const iconStyles = {
    success: "text-green-600",
    info: "text-blue-600",
    warning: "text-yellow-600",
    destructive: "text-destructive"
  };

  const handleAction = () => {
    const state = subjects.length > 0 ? {
      prefilledSubject: subjects[0],
      autoGenerate: percentage < 50
    } : undefined;
    
    navigate(config.actionPath, { state });
  };

  return (
    <Card className={`${variantStyles[config.variant]} mb-6`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconStyles[config.variant]}`} />
          <div className="text-left flex-1">
            <h3 className={`font-semibold mb-1 ${iconStyles[config.variant]}`}>
              {config.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {config.message}
            </p>
            {timeTaken && (
              <p className="text-xs text-muted-foreground mb-3">
                Time taken: {Math.floor(timeTaken / 60)}m {timeTaken % 60}s
              </p>
            )}
            <Button
              size="sm"
              variant={config.variant === "destructive" ? "destructive" : "default"}
              onClick={handleAction}
            >
              {config.actionLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartFeedbackCard;
