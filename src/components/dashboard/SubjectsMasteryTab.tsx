import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface SubjectMastery {
  id: string;
  name: string;
  category: string;
  testsCompleted: number;
  averageScore: number;
}

const SubjectsMasteryTab = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectMastery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjectsWithMastery = async () => {
      try {
        // Fetch all subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("id, name, category")
          .order("name");

        if (subjectsError) throw subjectsError;

        if (!user) {
          // No user - show subjects with 0 progress
          setSubjects(
            (subjectsData || []).map((s) => ({
              id: s.id,
              name: s.name,
              category: s.category || "General",
              testsCompleted: 0,
              averageScore: 0,
            }))
          );
          setLoading(false);
          return;
        }

        // Fetch user's test attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from("test_attempts")
          .select("subjects, score, total_questions")
          .eq("user_id", user.id);

        if (attemptsError) throw attemptsError;

        // Calculate mastery per subject
        const masteryMap: Record<string, { totalScore: number; totalQuestions: number; count: number }> = {};

        (attemptsData || []).forEach((attempt) => {
          const subjectList = attempt.subjects || [];
          subjectList.forEach((subjectName: string) => {
            if (!masteryMap[subjectName]) {
              masteryMap[subjectName] = { totalScore: 0, totalQuestions: 0, count: 0 };
            }
            masteryMap[subjectName].totalScore += attempt.score || 0;
            masteryMap[subjectName].totalQuestions += attempt.total_questions || 0;
            masteryMap[subjectName].count += 1;
          });
        });

        // Merge subjects with mastery data
        const subjectsWithMastery = (subjectsData || []).map((s) => {
          const mastery = masteryMap[s.name];
          const averageScore = mastery && mastery.totalQuestions > 0
            ? Math.round((mastery.totalScore / mastery.totalQuestions) * 100)
            : 0;

          return {
            id: s.id,
            name: s.name,
            category: s.category || "General",
            testsCompleted: mastery?.count || 0,
            averageScore,
          };
        });

        // Sort: subjects with progress first, then alphabetically
        subjectsWithMastery.sort((a, b) => {
          if (a.testsCompleted > 0 && b.testsCompleted === 0) return -1;
          if (a.testsCompleted === 0 && b.testsCompleted > 0) return 1;
          return a.name.localeCompare(b.name);
        });

        setSubjects(subjectsWithMastery);
      } catch (error) {
        console.error("Error fetching subjects mastery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectsWithMastery();
  }, [user]);

  const getMasteryColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-primary";
    if (score >= 40) return "bg-yellow-500";
    if (score > 0) return "bg-orange-500";
    return "bg-muted";
  };

  const getMasteryLabel = (score: number, tests: number) => {
    if (tests === 0) return "Not Started";
    if (score >= 80) return "Mastered";
    if (score >= 60) return "Proficient";
    if (score >= 40) return "Learning";
    return "Needs Practice";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No subjects available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      {subjects.map((subject, index) => (
        <motion.div
          key={subject.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link to={`/subject/${subject.id}`}>
            <Card className="hover:shadow-md transition-all cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {subject.name}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {subject.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${subject.testsCompleted > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {getMasteryLabel(subject.averageScore, subject.testsCompleted)}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    {subject.testsCompleted > 0 && (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        {subject.averageScore}%
                      </>
                    )}
                  </span>
                </div>
                <Progress 
                  value={subject.averageScore} 
                  className="h-2"
                  indicatorClassName={getMasteryColor(subject.averageScore)}
                />
                <p className="text-xs text-muted-foreground">
                  {subject.testsCompleted} {subject.testsCompleted === 1 ? "test" : "tests"} completed
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SubjectsMasteryTab;
