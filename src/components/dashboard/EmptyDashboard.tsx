import { BookOpen, Target, TrendingUp, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const EmptyDashboard = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Start Your Learning Journey</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Take your first test to unlock personalized insights, track your progress, 
            and get AI-powered recommendations for improvement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate("/boards")} className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Browse Boards
            </Button>
            <Button variant="outline" onClick={() => navigate("/custom-syllabus")} className="gap-2">
              <BookOpen className="h-4 w-4" />
              Create Custom Quiz
            </Button>
            <Button variant="outline" onClick={() => navigate("/mock-tests")} className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Browse Mock Tests
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmptyDashboard;
