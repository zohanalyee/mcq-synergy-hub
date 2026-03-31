import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Download, ExternalLink, MapPin, Building2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const categories = ["All", "Construction", "IT", "Consultancy", "Supply", "Services", "Equipment", "General"];

const Tenders = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const { data: tenders = [], isLoading } = useQuery({
    queryKey: ["tenders", search, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("external_opportunities")
        .select("*")
        .eq("type", "tender")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);

      if (search) {
        query = query.or(`title.ilike.%${search}%,organization.ilike.%${search}%,tender_number.ilike.%${search}%`);
      }

      if (categoryFilter !== "All") {
        query = query.eq("tender_category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <>
      <SEOHead
        title="Government Tenders Pakistan 2026 | PPRA, WAPDA, Railways"
        description="Latest government tenders from PPRA, WAPDA, Pakistan Railways and all major procurement authorities. Find construction, IT, supply and service tenders."
        keywords="Pakistan tenders, PPRA tenders, government tenders, procurement, bid opportunities"
        url="https://mcq-synergy-hub.lovable.app/tenders"
      />
      <Header>
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-8">
          {/* Hero */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              🏛️ Government Tenders
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Live tenders from PPRA, WAPDA, Railways, and all major procurement authorities across Pakistan
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Input
              placeholder="Search by title, organization, or tender number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(cat)}
                className="text-xs"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Tenders List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tenders.length === 0 ? (
            <Card className="border-border/30">
              <CardContent className="py-12 text-center text-muted-foreground">
                No tenders found. Try adjusting your search or filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tenders.map((tender: any) => (
                <Card key={tender.id} className="border-border/30 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {tender.tender_number && (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {tender.tender_number}
                            </Badge>
                          )}
                          {tender.tender_category && (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                              {tender.tender_category}
                            </Badge>
                          )}
                        </div>

                        <h2 className="text-sm sm:text-base font-semibold leading-tight">
                          {tender.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {tender.organization || tender.source_name}
                          </span>
                          {tender.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {tender.location}
                            </span>
                          )}
                          {tender.tender_value && (
                            <span className="font-medium text-emerald-500">
                              💰 {tender.tender_value}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 text-xs">
                        {tender.deadline_date && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Deadline: {new Date(tender.deadline_date).toLocaleDateString()}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {tender.document_url && (
                            <a href={tender.document_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <Download className="h-3 w-3 mr-1" /> Document
                              </Button>
                            </a>
                          )}
                          <a href={tender.apply_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="h-7 text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" /> View
                            </Button>
                          </a>
                        </div>

                        {tender.created_at && (
                          <span className="text-[10px] text-muted-foreground">
                            Posted {formatDistanceToNow(new Date(tender.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
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

export default Tenders;
