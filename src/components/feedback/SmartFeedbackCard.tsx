import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, Target, Zap, RefreshCcw, RotateCcw, Sparkles } from "lucide-react";
import { Loader2 } from "lucide-react";

interface SmartFeedbackCardProps {
  score: number;
  totalQuestions: number;
  timeTaken?: number;
  subjects?: string[];
  testType?: string;
  onRetry?: () => void;
  onGenerateNew?: () => void;
  onImprove?: () => void; // NEW: For smart remedial - triggers new test with wrong answers
  isImproving?: boolean; // Loading state for improve button
}

const SmartFeedbackCard = ({ 
  score, 
  totalQuestions, 
  timeTaken,
  subjects = [],
  testType = "quiz",
  onRetry,
  onGenerateNew,
  onImprove,
  isImproving = false
}: SmartFeedbackCardProps) => {
  const percentage = Math.round((score / totalQuestions) * 100);

  // Determine feedback type based on score
  const getFeedbackConfig = () => {
    if (percentage >= 90) {
      return {
        icon: Zap,
        title: "Outstanding Performance!",
        message: "You've mastered this topic. Consider trying harder questions or exploring new subjects.",
        variant: "success" as const,
        showImprove: false
      };
    } else if (percentage >= 70) {
      return {
        icon: TrendingUp,
        title: "Great Progress!",
        message: "You're doing well. A bit more practice will help you achieve mastery.",
        variant: "info" as const,
        showImprove: true
      };
    } else if (percentage >= 50) {
      return {
        icon: Target,
        title: "Keep Going!",
        message: "You're on the right track. Focus on the topics you missed to improve your score.",
        variant: "warning" as const,
        showImprove: true
      };
    } else {
      return {
        icon: AlertCircle,
        title: "Needs Improvement",
        message: subjects.length > 0 
          ? `Focus on ${subjects.slice(0, 2).join(" and ")}. Let's create a targeted practice test.`
          : "Don't worry! Practice makes perfect. Let's focus on what you missed.",
        variant: "destructive" as const,
        showImprove: true
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

  // Get improve button label based on subject
  const getImproveLabel = () => {
    if (subjects.length > 0) {
      return `Improve ${subjects[0]}`;
    }
    return "Practice Weak Areas";
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
            <div className="flex flex-wrap gap-2">
              {/* Smart Improve Button - Triggers new test with wrong answers (No Redirect) */}
              {onImprove && config.showImprove && (
                <Button
                  size="sm"
                  variant={config.variant === "destructive" ? "destructive" : "default"}
                  onClick={onImprove}
                  disabled={isImproving}
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      {getImproveLabel()}
                    </>
                  )}
                </Button>
              )}
              
              {/* Retry button - only show if score < 100% */}
              {onRetry && percentage < 100 && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                  Retry These Questions
                </Button>
              )}
              
              {/* Retake (Same Settings) button - renamed from "Practice New Questions" */}
              {onGenerateNew && (
                <Button size="sm" variant="secondary" onClick={onGenerateNew}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Retake (Same Settings)
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartFeedbackCard;
