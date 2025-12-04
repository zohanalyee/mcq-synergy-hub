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
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{subject}</h4>
                <p className="text-sm text-muted-foreground">
                  Average: <span className="text-destructive font-medium">{averageScore}%</span>
                  <span className="mx-1">•</span>
                  {testsCount} test{testsCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={handleGeneratePractice}
              className="shrink-0 gap-1.5"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Fix It</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeaknessCard;
