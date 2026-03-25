import { useState, useEffect } from "react";
import SEOHead from '@/components/SEOHead';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Calendar, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentItem } from "@/interfaces/content";
import { getContentByCategory } from "@/services/contentService";
import { getApprovedOpportunities } from "@/services/externalOpportunitiesService";
import { ExternalOpportunity, ExternalOpportunityFilters } from "@/types/externalOpportunities";
import { useAuth } from "@/contexts/AuthContext";
import ExternalOpportunitiesSection from "@/components/external/ExternalOpportunitiesSection";
import GlassScholarshipsFilters from "@/components/scholarships/GlassScholarshipsFilters";

const Scholarships = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState<ContentItem[]>([]);
  const [externalScholarships, setExternalScholarships] = useState<ExternalOpportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [externalFilters, setExternalFilters] = useState<ExternalOpportunityFilters>({
    scholarship_scope: 'all',
    region: 'all'
  });
  
  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        setIsLoading(true);
        const [items, externalData] = await Promise.all([
          getContentByCategory('scholarship'),
          getApprovedOpportunities('scholarship', externalFilters)
        ]);
        console.log("Fetched scholarships from Supabase:", items);
        setScholarships(items);
        setExternalScholarships(externalData);
      } catch (error) {
        console.error("Error fetching scholarships:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load scholarships. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScholarships();
  }, [externalFilters]);
  
  const filteredScholarships = scholarships.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.institution && item.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.scholarshipType && item.scholarshipType.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredExternalScholarships = externalScholarships.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.organization && item.organization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Header>
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-16">
        {/* Header Section */}
        <div className="mb-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold flex items-center justify-center text-foreground"
          >
            <Award className="mr-2 h-7 w-7 text-primary" /> Scholarships
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground mt-1 text-sm"
          >
            Discover scholarship opportunities to fund your education
          </motion.p>
        </div>

        {/* Glass Search & Filter Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <GlassScholarshipsFilters 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={externalFilters}
            onFiltersChange={setExternalFilters}
          />
        </div>

        {/* Full-width Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {isLoading ? (
            // Loading skeleton - compact
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse rounded-2xl">
                <CardContent className="p-3">
                  <div className="h-4 bg-muted rounded-md w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded-md w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded-md w-full mb-1"></div>
                  <div className="h-3 bg-muted rounded-md w-2/3 mb-3"></div>
                  <div className="flex gap-1.5 mb-3">
                    <div className="h-5 bg-muted rounded-full w-14"></div>
                    <div className="h-5 bg-muted rounded-full w-16"></div>
                  </div>
                  <div className="flex justify-end">
                    <div className="h-8 bg-muted rounded-lg w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredScholarships.length > 0 ? (
            filteredScholarships.map((scholarship, index) => (
              <motion.div
                key={scholarship.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="rounded-2xl border-primary/20 shadow-sm hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-3 flex flex-col h-full">
                    <h2 className="text-sm font-semibold mb-1 line-clamp-2">{scholarship.title}</h2>
                    
                    <div className="flex flex-wrap items-center text-muted-foreground text-[10px] mb-2 gap-2">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-0.5" />
                        {formatDate(scholarship.deadline)}
                      </span>
                      
                      {scholarship.institution && (
                        <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                          {scholarship.institution}
                        </span>
                      )}
                      
                      {scholarship.scholarshipType && (
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          {scholarship.scholarshipType}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2 flex-1">
                      {scholarship.description}
                    </p>
                    
                    {scholarship.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {scholarship.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[9px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-auto pt-2 border-t border-border/50">
                      {scholarship.fileUrl ? (
                        <Button size="sm" asChild className="h-7 text-xs">
                          <a href={scholarship.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Apply
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs">View</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <h3 className="mt-3 text-sm font-medium">No scholarships found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search."
                  : "Be the first to submit a scholarship!"}
              </p>
              {user ? (
                <Button onClick={() => navigate("/submit-content")} size="sm" className="mt-4">
                  Submit a Scholarship
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")} size="sm" className="mt-4">
                  Sign In to Submit
                </Button>
              )}
            </div>
          )}
        </div>

        {/* External Scholarships Section */}
        <ExternalOpportunitiesSection 
          opportunities={filteredExternalScholarships}
          isLoading={isLoading}
          type="scholarship"
        />
      </div>
    </Header>
  );
};

export default Scholarships;
