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
      className="mt-4"
    >
      <Card className="border-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Focus Areas (Weaknesses)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Click "Fix It" to generate a practice test.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {weaknesses.map((weakness) => (
              <WeaknessCard
                key={weakness.subject}
                subject={weakness.subject}
                averageScore={Number(weakness.average_score)}
                testsCount={Number(weakness.tests_count)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeaknessSection;
