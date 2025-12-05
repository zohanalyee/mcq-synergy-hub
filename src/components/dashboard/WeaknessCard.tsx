import { AlertTriangle, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface WeaknessCardProps {
  subject: string;
  averageScore: number;
  testsCount: number;
}

const WeaknessCard = ({ subject, averageScore, testsCount }: WeaknessCardProps) => {
  const navigate = useNavigate();

  const handleGeneratePractice = () => {
    // Navigate to Custom Syllabus with pre-filled subject
    navigate("/custom-syllabus", { 
      state: { 
        prefilledSubject: subject,
        autoGenerate: true 
      } 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-destructive/50 bg-destructive/5 hover:bg-destructive/10 transition-colors">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-md bg-destructive/10 shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-sm text-foreground truncate">{subject}</h4>
                <p className="text-xs text-muted-foreground">
                  <span className="text-destructive font-medium">{averageScore}%</span>
                  <span className="mx-1">•</span>
                  {testsCount} test{testsCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={handleGeneratePractice}
              className="shrink-0 h-7 px-2 text-xs gap-1"
            >
              <Zap className="h-3.5 w-3.5" />
              Fix
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeaknessCard;
