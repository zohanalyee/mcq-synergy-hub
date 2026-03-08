import { motion } from "framer-motion";
import { Sparkles, AlertCircle, CheckCircle, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsData } from "@/hooks/useAnalyticsData";
import { analyzePerformance } from "@/lib/aiCoach";

interface Props {
  data: AnalyticsData;
  onViewRecommendations: () => void;
  onGenerateTest: () => void;
}

const AIInsightsPanel = ({ data, onViewRecommendations, onGenerateTest }: Props) => {
  const insights = analyzePerformance(data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-blue-200/50 dark:border-blue-800/30"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold mb-1.5 flex items-center gap-2">
            AI Coach Analysis
            <Badge variant="secondary" className="text-xs">Updated just now</Badge>
          </h3>

          <p className="text-sm text-muted-foreground mb-4">{insights.mainInsight}</p>

          <div className="grid md:grid-cols-2 gap-2 mb-4">
            {insights.keyFindings.map((finding, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {finding.type === "concern" ? (
                  <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                )}
                <span>{finding.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onViewRecommendations}>
              <Target className="w-4 h-4 mr-1.5" />
              View Recommendations
            </Button>
            <Button size="sm" variant="outline" onClick={onGenerateTest}>
              <Zap className="w-4 h-4 mr-1.5" />
              Generate Practice Test
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIInsightsPanel;
