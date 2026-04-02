import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, ExternalLink, MapPin, Building2, Loader2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const categories = ["All", "Construction", "IT", "Consultancy", "Supply", "Services", "Equipment", "General"];

const placeholderImage = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400";

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
        .in("status", ["approved", "pending"])
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
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">🏛️ Government Tenders</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Live tenders from PPRA, WAPDA, Railways, and all major procurement authorities across Pakistan
            </p>
          </div>

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
                key={cat} size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(cat)}
                className="text-xs"
              >
                {cat}
              </Button>
            ))}
          </div>

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tenders.map((tender: any) => (
                <Card key={tender.id} className="border-border/30 hover:border-primary/30 transition-colors overflow-hidden group">
                  {/* Image */}
                  <div className="relative h-36 bg-muted">
                    <img
                      src={tender.image_url || placeholderImage}
                      alt={tender.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }}
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      {tender.tender_category && (
                        <Badge className="text-[10px] bg-primary/80 text-primary-foreground">
                          {tender.tender_category}
                        </Badge>
                      )}
                      {tender.status === "pending" && (
                        <Badge className="text-[10px] bg-amber-500/80 text-white">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    {tender.tender_number && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {tender.tender_number}
                      </Badge>
                    )}

                    <h2 className="text-sm font-semibold leading-tight line-clamp-2">
                      {tender.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                    </div>

                    {tender.tender_value && (
                      <span className="text-xs font-medium text-emerald-500">💰 {tender.tender_value}</span>
                    )}

                    {tender.deadline_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Deadline: {new Date(tender.deadline_date).toLocaleDateString()}
                      </div>
                    )}

                    <div className="pt-2">
                      <Link to={`/opportunity/${tender.id}`} className="block">
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs">
                          <Eye className="h-3 w-3 mr-1" /> View Details
                        </Button>
                      </Link>
                    </div>

                    {tender.created_at && (
                      <span className="text-[10px] text-muted-foreground block">
                        Posted {formatDistanceToNow(new Date(tender.created_at), { addSuffix: true })}
                      </span>
                    )}
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
