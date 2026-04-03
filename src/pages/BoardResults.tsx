import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp, Loader2, CheckCircle, BookOpen, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const BoardResults = () => {
  const navigate = useNavigate();

  // Query from board_result_announcements
  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ["board-results-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_result_announcements")
        .select("*")
        .order("announced_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  // Also query external_opportunities with type=board_result
  const { data: opportunities = [], isLoading: loadingOpportunities } = useQuery({
    queryKey: ["board-results-opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_opportunities")
        .select("*")
        .eq("type", "board_result")
        .in("status", ["approved", "pending"])
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = loadingAnnouncements || loadingOpportunities;
  const hasResults = announcements.length > 0 || opportunities.length > 0;

  return (
    <>
      <SEOHead
        title="Board Results 2026 Pakistan | SSC HSC Results - All Boards"
        description="Latest board examination results from BISE Karachi, Lahore, FBISE and all Pakistani education boards. Check SSC and HSC results instantly."
        keywords="board results 2026, BISE results, SSC result, HSC result, matric result, inter result, Pakistan board results"
        url="https://mcq-synergy-hub.lovable.app/board-results"
      />
      <Header>
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">🔥 Board Results 2026</h1>
            </div>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Latest updates from all Pakistani education boards. Check your SSC &amp; HSC results here.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !hasResults ? (
            <Card className="border-border/30">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">No Results Announced Yet</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We&apos;re monitoring all major boards. Results will appear here as soon as they are announced.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {/* Official announcements */}
              {announcements.map((result: any) => (
                <Card key={`ann-${result.id}`} className="border-border/30 hover:border-emerald-500/30 transition-colors">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <h2 className="text-sm sm:text-base font-semibold">
                            {result.board_name} {result.exam_type} Result {result.year}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              ✅ ANNOUNCED
                            </Badge>
                            {result.announced_at && (
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(result.announced_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <a href={result.result_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 border-0">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Check Result Now
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Scraped board result opportunities */}
              {opportunities.map((opp: any) => (
                <Card
                  key={`opp-${opp.id}`}
                  className="border-border/30 hover:border-purple-500/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/opportunity/${opp.id}`)}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {opp.image_url && (
                          <img
                            src={opp.image_url} alt=""
                            className="h-10 w-10 rounded object-cover flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div>
                          <h2 className="text-sm sm:text-base font-semibold">{opp.title}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                              Board Result
                            </Badge>
                            {opp.status === "pending" && (
                              <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                                Pending Review
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {opp.source_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400">
                        <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Header>
    </>
  );
};

export default BoardResults;
