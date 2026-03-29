import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Eye, Sparkles, Bot, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

const EmptyTopicAnalytics = () => {
  const [generatingTopics, setGeneratingTopics] = useState<Set<string>>(new Set());
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["empty-topic-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empty_topic_analytics")
        .select("*")
        .order("view_count", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const triggerAutoFillForTopic = async (row: any) => {
    const topicKey = row.id;
    setGeneratingTopics((prev) => new Set(prev).add(topicKey));

    try {
      const response = await supabase.functions.invoke("generate-test", {
        body: {
          mode: "bank_only",
          subject: row.subject_name,
          topic: row.topic_name,
          count: 20,
          difficulty: "mixed",
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      const saved = result?.savedCount || result?.questions_saved || 0;

      setCompletedTopics((prev) => new Set(prev).add(topicKey));
      toast.success(`Generated ${saved} MCQs for "${row.topic_name}"`, {
        description: `Subject: ${row.subject_name} | Board: ${row.board_name}`,
      });
    } catch (err: any) {
      console.error("MCQ generation failed:", err);
      toast.error(`Failed to generate MCQs for "${row.topic_name}"`, {
        description: err.message || "Check AI quota and try again.",
      });
    } finally {
      setGeneratingTopics((prev) => {
        const next = new Set(prev);
        next.delete(topicKey);
        return next;
      });
    }
  };

  return (
    <Card className="border-amber-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          Empty Topic Traffic — Content Gaps
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Topics with 0 MCQs that are getting visitor traffic. Prioritize these for content creation.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No empty topic views recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Topic</th>
                  <th className="pb-2 font-medium">Subject</th>
                  <th className="pb-2 font-medium">Board</th>
                  <th className="pb-2 font-medium text-center">
                    <Eye className="h-3.5 w-3.5 inline" /> Views
                  </th>
                  <th className="pb-2 font-medium">Last Viewed</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => {
                  const isGenerating = generatingTopics.has(row.id);
                  const isCompleted = completedTopics.has(row.id);

                  return (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 font-medium">{row.topic_name}</td>
                      <td className="py-2 text-muted-foreground">{row.subject_name}</td>
                      <td className="py-2 text-muted-foreground">{row.board_name}</td>
                      <td className="py-2 text-center font-semibold text-amber-400">{row.view_count}</td>
                      <td className="py-2 text-muted-foreground text-xs">
                        {format(new Date(row.last_viewed_at), "MMM d, yyyy")}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          <Link to={row.page_path}>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <Sparkles className="h-3 w-3" /> View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant={isCompleted ? "default" : "outline"}
                            className={`h-7 text-xs gap-1 ${isCompleted ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-violet-500/30 text-violet-400 hover:bg-violet-500/10"}`}
                            onClick={() => triggerAutoFillForTopic(row)}
                            disabled={isGenerating || isCompleted}
                          >
                            {isGenerating ? (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                            ) : isCompleted ? (
                              <><CheckCircle className="h-3 w-3" /> Done</>
                            ) : (
                              <><Bot className="h-3 w-3" /> Generate 20 MCQs</>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyTopicAnalytics;
