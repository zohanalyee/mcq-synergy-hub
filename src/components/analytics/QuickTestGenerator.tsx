import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AnalyticsData } from "@/hooks/useAnalyticsData";
import { useNavigate } from "react-router-dom";

interface Props {
  data: AnalyticsData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickTestGenerator = ({ data, open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const weakSubjects = data.subjects.filter((s) => s.accuracy < 70);
  const focusAreas = weakSubjects.length > 0
    ? weakSubjects.slice(0, 2).map((s) => s.name).join(", ")
    : data.subjects.slice(0, 2).map((s) => s.name).join(", ") || "All Subjects";

  const recommendation = weakSubjects.length === 0
    ? "You're doing great! This test will help maintain your performance across all subjects."
    : weakSubjects.length === 1
    ? `Focus on ${weakSubjects[0].name} where you're at ${weakSubjects[0].accuracy}%. This test targets your specific weak topics.`
    : `This test focuses on ${weakSubjects.slice(0, 2).map((s) => s.name).join(" and ")}, your weakest areas.`;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onOpenChange(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-13 h-13 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white z-50"
      >
        <Zap className="w-6 h-6" />
      </motion.button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI-Recommended Practice Test</DialogTitle>
            <DialogDescription>Based on your analytics, here's what we recommend</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                AI Recommendation
              </p>
              <p className="text-sm text-muted-foreground">{recommendation}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Focus Areas:</span>
                <span className="font-medium">{focusAreas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Questions:</span>
                <span className="font-medium">20 (mixed difficulty)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">20 minutes</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { onOpenChange(false); navigate("/custom-syllabus"); }}>
                Customize
              </Button>
              <Button className="flex-1" onClick={() => { onOpenChange(false); navigate("/mock-tests"); }}>
                <PlayCircle className="w-4 h-4 mr-1.5" />
                Start Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickTestGenerator;
