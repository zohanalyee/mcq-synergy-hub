import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, AlertTriangle, ShieldCheck } from "lucide-react";

const CorruptedDataCleaner = () => {
  const queryClient = useQueryClient();

  const { data: corrupted = [], isLoading } = useQuery({
    queryKey: ["corrupted-mcqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_items")
        .select("id, title, subject, topic, difficulty, options, correct_option, created_at")
        .eq("category", "mcq")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      return (data || []).filter((item) => {
        const opts = item.options as any;
        if (!opts) return true;
        if (Array.isArray(opts)) return opts.length < 4 || opts.some((o: any) => !o);
        if (typeof opts === "object") {
          return !opts.A || !opts.B || !opts.C || !opts.D;
        }
        return true;
      });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      toast.success(`Deleted ${ids.length} corrupted questions`);
      queryClient.invalidateQueries({ queryKey: ["corrupted-mcqs"] });
    },
    onError: (err: any) => {
      toast.error("Cleanup failed: " + err.message);
    },
  });

  return (
    <Card className="border-border/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Corrupted MCQ Cleanup
          </CardTitle>
          {corrupted.length > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm(`Delete ${corrupted.length} corrupted questions?`)) {
                  cleanupMutation.mutate(corrupted.map((q) => q.id));
                }
              }}
              disabled={cleanupMutation.isPending}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clean All ({corrupted.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Scanning...</p>
        ) : corrupted.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400 py-4 justify-center">
            <ShieldCheck className="h-4 w-4" />
            No corrupted questions found
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {corrupted.map((item) => {
              const opts = item.options as any;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.title || "No title"}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {item.subject || "?"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          opts?.A ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"
                        }`}
                      >
                        A:{opts?.A ? "✓" : "✗"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          opts?.B ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"
                        }`}
                      >
                        B:{opts?.B ? "✓" : "✗"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          opts?.C ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"
                        }`}
                      >
                        C:{opts?.C ? "✓" : "✗"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          opts?.D ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"
                        }`}
                      >
                        D:{opts?.D ? "✓" : "✗"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 text-red-400 hover:text-red-300"
                    onClick={() => cleanupMutation.mutate([item.id])}
                    disabled={cleanupMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CorruptedDataCleaner;
