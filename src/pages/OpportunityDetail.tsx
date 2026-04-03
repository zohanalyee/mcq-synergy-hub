import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, MapPin, Building2, ExternalLink, FileText,
  ArrowLeft, Briefcase, GraduationCap, Award, Loader2, Download,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, React.ElementType> = {
  scholarship: GraduationCap,
  job: Briefcase,
  tender: FileText,
  board_result: Award,
};

const typeColors: Record<string, string> = {
  scholarship: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  job: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  tender: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  board_result: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const placeholderImages: Record<string, string> = {
  scholarship: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
  job: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800",
  tender: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
  board_result: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
};

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_opportunities")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Header>
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-8 flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Header>
    );
  }

  if (!opportunity) {
    return (
      <Header>
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-8 text-center py-20">
          <h2 className="text-xl font-semibold mb-4">Opportunity not found</h2>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </Header>
    );
  }

  const TypeIcon = typeIcons[opportunity.type] || FileText;
  const imageUrl = opportunity.image_url || placeholderImages[opportunity.type] || placeholderImages.job;

  return (
    <>
      <SEOHead
        title={`${opportunity.title} | MCQSAI`}
        description={opportunity.description?.substring(0, 160) || `${opportunity.type} opportunity from ${opportunity.organization || opportunity.source_name}`}
      />
      <Header>
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
          <Button
            variant="ghost" size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <Card className="border-border/30 overflow-hidden">
            {/* Hero Image */}
            <div className="relative h-48 sm:h-64 bg-muted">
              <img
                src={imageUrl}
                alt={opportunity.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderImages[opportunity.type] || placeholderImages.job;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-3 left-4 flex gap-2">
                <Badge className={typeColors[opportunity.type] || ""}>
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {opportunity.type}
                </Badge>
                {opportunity.status === "pending" && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Pending Review
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                {opportunity.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {opportunity.organization && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" /> {opportunity.organization}
                  </span>
                )}
                {opportunity.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {opportunity.location}
                  </span>
                )}
                {opportunity.deadline_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Deadline: {new Date(opportunity.deadline_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Description */}
              {opportunity.description && (
                <div>
                  <h2 className="text-sm font-semibold mb-2">Description</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {opportunity.description}
                  </p>
                </div>
              )}

              {/* Job specific */}
              {opportunity.type === "job" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {opportunity.qualification && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Qualification</p>
                      <p className="text-sm font-medium">{opportunity.qualification}</p>
                    </div>
                  )}
                  {opportunity.salary && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Salary</p>
                      <p className="text-sm font-medium text-emerald-500">{opportunity.salary}</p>
                    </div>
                  )}
                  {opportunity.experience && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Experience</p>
                      <p className="text-sm font-medium">{opportunity.experience}</p>
                    </div>
                  )}
                  {opportunity.positions && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Positions</p>
                      <p className="text-sm font-medium">{opportunity.positions}</p>
                    </div>
                  )}
                  {opportunity.department && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{opportunity.department}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tender specific */}
              {opportunity.type === "tender" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {opportunity.tender_number && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Tender Number</p>
                      <p className="text-sm font-mono font-medium">{opportunity.tender_number}</p>
                    </div>
                  )}
                  {opportunity.tender_value && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Tender Value</p>
                      <p className="text-sm font-medium text-emerald-500">💰 {opportunity.tender_value}</p>
                    </div>
                  )}
                  {opportunity.tender_category && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Category</p>
                      <p className="text-sm font-medium">{opportunity.tender_category}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Scholarship specific */}
              {opportunity.type === "scholarship" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {opportunity.scholarship_scope && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Scope</p>
                      <p className="text-sm font-medium">{opportunity.scholarship_scope}</p>
                    </div>
                  )}
                  {opportunity.eligibility && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Eligibility</p>
                      <p className="text-sm font-medium">{opportunity.eligibility}</p>
                    </div>
                  )}
                  {opportunity.amount && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Amount</p>
                      <p className="text-sm font-medium text-emerald-500">{opportunity.amount}</p>
                    </div>
                  )}
                  {opportunity.field_of_study && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Field of Study</p>
                      <p className="text-sm font-medium">{opportunity.field_of_study}</p>
                    </div>
                  )}
                  {opportunity.education_level && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Education Level</p>
                      <p className="text-sm font-medium">{opportunity.education_level}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a href={opportunity.apply_url} target="_blank" rel="noopener noreferrer">
                  <Button>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {opportunity.type === "tender" ? "View Tender" : "Apply Now"}
                  </Button>
                </a>
                {opportunity.document_url && (
                  <a href={opportunity.document_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" /> Download Document
                    </Button>
                  </a>
                )}
              </div>

              {/* Footer meta */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/20">
                <span>Source: {opportunity.source_name}</span>
                {opportunity.created_at && (
                  <span>
                    Posted {formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Header>
    </>
  );
};

export default OpportunityDetail;
