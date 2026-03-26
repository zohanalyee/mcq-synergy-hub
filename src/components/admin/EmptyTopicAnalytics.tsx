import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Eye, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const EmptyTopicAnalytics = () => {
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
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 font-medium">{row.topic_name}</td>
                    <td className="py-2 text-muted-foreground">{row.subject_name}</td>
                    <td className="py-2 text-muted-foreground">{row.board_name}</td>
                    <td className="py-2 text-center font-semibold text-amber-400">{row.view_count}</td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {format(new Date(row.last_viewed_at), "MMM d, yyyy")}
                    </td>
                    <td className="py-2">
                      <Link to={row.page_path}>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <Sparkles className="h-3 w-3" /> Generate
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyTopicAnalytics;
