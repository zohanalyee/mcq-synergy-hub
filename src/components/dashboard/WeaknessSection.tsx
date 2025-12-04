import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WeaknessCard from "./WeaknessCard";
import { motion } from "framer-motion";

interface Weakness {
  subject: string;
  average_score: number;
  tests_count: number;
}

interface WeaknessSectionProps {
  weaknesses: Weakness[];
}

const WeaknessSection = ({ weaknesses }: WeaknessSectionProps) => {
  if (weaknesses.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mt-6"
    >
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Focus Areas (Weaknesses Detected)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These subjects need extra attention. Click "Fix It" to generate a personalized practice test.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {weaknesses.map((weakness) => (
            <WeaknessCard
              key={weakness.subject}
              subject={weakness.subject}
              averageScore={Number(weakness.average_score)}
              testsCount={Number(weakness.tests_count)}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeaknessSection;
