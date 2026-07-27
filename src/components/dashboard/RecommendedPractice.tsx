import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const RecommendedPractice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startingId, setStartingId] = useState<string | null>(null);

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ["recommended-tests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("recommended_tests" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching recommendations:", error);
        return [];
      }
      return data as any[];
    },
    enabled: !!user,
  });

  const handleStartPractice = async (rec: any) => {
    if (!user) return;
    setStartingId(rec.id);

    try {
      // Create a test session for this recommendation
      const { data: session, error } = await supabase
        .from("custom_test_sessions")
        .insert({
          user_id: user.id,
          session_name: `Practice: ${rec.topic_name}`,
          question_count: rec.question_count || 20,
          time_limit: 30,
          subjects: [rec.subject_name].filter(Boolean),
          topics: [],
          difficulty_levels: ["Easy", "Medium", "Hard"],
          questions: [],
          is_active: true,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Mark recommendation as started
      await supabase
        .from("recommended_tests" as any)
        .update({ status: "started", session_id: session.id } as any)
        .eq("id", rec.id);

      navigate(`/test-session/${session.id}`);
    } catch (err) {
      console.error("Error starting practice:", err);
      toast({
        title: "Error",
        description: "Failed to start practice test. Try again.",
        variant: "destructive",
      });
    } finally {
      setStartingId(null);
    }
  };

  const handleSkip = async (recId: string) => {
    await supabase
      .from("recommended_tests" as any)
      .update({ status: "skipped" } as any)
      .eq("id", recId);
    refetch();
  };

  if (!user || isLoading || !recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="mt-4"
    >
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-primary" />
            Recommended Practice
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Auto-generated tests for your weak areas
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {recommendations.map((rec: any) => (
              <Card
                key={rec.id}
                className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Weak
                        </Badge>
                        <span className="text-xs text-destructive font-medium">
                          {rec.weakness_percentage}%
                        </span>
                      </div>
                      <h4 className="font-medium text-sm truncate">
                        {rec.topic_name}
                      </h4>
                      {rec.subject_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {rec.subject_name} • {rec.question_count} questions
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleStartPractice(rec)}
                        disabled={startingId === rec.id}
                      >
                        {startingId === rec.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Practice"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleSkip(rec.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecommendedPractice;
