import { BookOpen, Target, TrendingUp, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const EmptyDashboard = () => {
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
            <Button asChild className="gap-2">
              <Link to="/boards">
                <LayoutGrid className="h-4 w-4" />
                Browse Boards
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/custom-syllabus">
                <BookOpen className="h-4 w-4" />
                Create Custom Quiz
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/mock-tests">
                <TrendingUp className="h-4 w-4" />
                Browse Mock Tests
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmptyDashboard;
