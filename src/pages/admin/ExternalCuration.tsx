import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { RefreshCw, Check, X, ExternalLink, Calendar, Building2, MapPin, Briefcase, GraduationCap, Sparkles, Globe, Building } from "lucide-react";
import Header from "@/components/Header";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getExternalOpportunities,
  updateOpportunityStatus,
  syncMockExternalData,
  syncAIExternalData,
  getOpportunityCounts
} from "@/services/externalOpportunitiesService";
import { ExternalOpportunity, OpportunityStatus } from "@/types/externalOpportunities";

const ExternalCuration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState<OpportunityStatus>("pending");
  const [opportunities, setOpportunities] = useState<ExternalOpportunity[]>([]);
  const [counts, setCounts] = useState<Record<OpportunityStatus, number>>({ pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAISyncing, setIsAISyncing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Security check
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to access this page");
      navigate("/sign-in");
      return;
    }
    if (!isAdmin) {
      toast.error("Admin access required");
      navigate("/");
    }
  }, [user, isAdmin, navigate]);

  // Load data
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [opps, countsData] = await Promise.all([
        getExternalOpportunities(activeTab),
        getOpportunityCounts()
      ]);
      setOpportunities(opps);
      setCounts(countsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load opportunities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncMockExternalData();
      if (result.added > 0) {
        toast.success(`Added ${result.added} new opportunities for review`);
        loadData();
      } else if (result.duplicates > 0) {
        toast.info(`No new opportunities (${result.duplicates} duplicates skipped)`);
      } else {
        toast.info("No new opportunities to sync");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error("Failed to sync external data");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAISync = async (searchType: 'jobs' | 'scholarships') => {
    setIsAISyncing(true);
    try {
      const result = await syncAIExternalData(searchType);
      if (result.success) {
        if (result.added > 0) {
          toast.success(`AI found ${result.added} new ${searchType} for review`);
          loadData();
        } else if (result.duplicates > 0) {
          toast.info(`No new ${searchType} (${result.duplicates} duplicates skipped)`);
        } else {
          toast.info(`AI couldn't find new ${searchType}`);
        }
      } else {
        // Handle specific error codes
        if (result.error === "RATE_LIMIT_EXCEEDED") {
          toast.error("AI is Busy (Quota Full). Please wait 15 minutes.");
        } else if (result.error === "AUTH_ERROR") {
          toast.error("Configuration Error. Check API Key.");
        } else if (result.error === "NETWORK_ERROR") {
          toast.error("Network Error. Please check your connection.");
        } else {
          toast.error(result.error || "AI sync failed");
        }
      }
    } catch (error) {
      console.error("Error AI syncing:", error);
      toast.error("Connection failed. Please try again.");
    } finally {
      setIsAISyncing(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!user) return;
    try {
      await updateOpportunityStatus(id, "approved", user.id);
      toast.success("Opportunity approved and published");
      loadData();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve opportunity");
    }
  };

  const handleReject = async (id: string) => {
    if (!user) return;
    try {
      await updateOpportunityStatus(id, "rejected", user.id);
      toast.success("Opportunity rejected");
      loadData();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject opportunity");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (!isAdmin || !user) {
    return null;
  }

  return (
    <Header>
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">External Opportunities</h1>
              <p className="text-muted-foreground mt-1">
                Review and curate jobs & scholarships from external sources
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing..." : "Sync Mock Data"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Webhook Info Banner */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">External Agent Integration</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Opportunities can be synced automatically via webhook from external agents (OpenClaw, Moltbolt, etc).
                  Configure <code className="bg-muted px-1 rounded">EXTERNAL_AGENT_API_KEY</code> in Supabase secrets.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Endpoint:</strong>{' '}
                  <code className="bg-muted px-1 rounded text-[10px]">/functions/v1/external-agent-webhook</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OpportunityStatus)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-2">
              Pending Review
              {counts.pending > 0 && (
                <Badge variant="secondary" className="ml-1">{counts.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              Published
              {counts.approved > 0 && (
                <Badge variant="secondary" className="ml-1">{counts.approved}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              Rejected
              {counts.rejected > 0 && (
                <Badge variant="secondary" className="ml-1">{counts.rejected}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : opportunities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No {activeTab} opportunities found.
                    {activeTab === "pending" && " Click 'Sync External Data' to import new opportunities."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {opportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onApprove={activeTab === "pending" ? () => handleApprove(opp.id) : undefined}
                    onReject={activeTab === "pending" ? () => handleReject(opp.id) : undefined}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Header>
  );
};

interface OpportunityCardProps {
  opportunity: ExternalOpportunity;
  onApprove?: () => void;
  onReject?: () => void;
  formatDate: (date: string | null) => string;
}

const OpportunityCard = ({ opportunity, onApprove, onReject, formatDate }: OpportunityCardProps) => {
  const TypeIcon = opportunity.type === "job" ? Briefcase : GraduationCap;

  const getSectorBadge = () => {
    if (!opportunity.sector) return null;
    return (
      <Badge variant={opportunity.sector === 'government' ? 'default' : 'secondary'} className="gap-1 text-xs">
        <Building className="h-3 w-3" />
        {opportunity.sector === 'government' ? 'Govt' : 'Private'}
      </Badge>
    );
  };

  const getRegionBadge = () => {
    if (!opportunity.region || opportunity.region === 'other') return null;
    const regionLabels: Record<string, string> = {
      sindh: 'Sindh', punjab: 'Punjab', kpk: 'KPK', 
      balochistan: 'Balochistan', federal: 'Federal', international: 'International'
    };
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <MapPin className="h-3 w-3" />
        {regionLabels[opportunity.region] || opportunity.region}
      </Badge>
    );
  };

  const getScopeBadge = () => {
    if (!opportunity.scholarship_scope) return null;
    return (
      <Badge variant={opportunity.scholarship_scope === 'international' ? 'default' : 'secondary'} className="gap-1 text-xs">
        <Globe className="h-3 w-3" />
        {opportunity.scholarship_scope === 'international' ? 'International' : 'National'}
      </Badge>
    );
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <img
              src={opportunity.image_url || '/placeholder.svg'}
              alt={opportunity.title}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-muted"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <Badge variant={opportunity.type === "job" ? "default" : "secondary"} className="gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {opportunity.type === "job" ? "Job" : "Scholarship"}
                </Badge>
                <Badge variant="outline">{opportunity.source_name}</Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">{opportunity.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="line-clamp-2 mb-3">
            {opportunity.description || "No description available"}
          </CardDescription>

          {/* Tags Section */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {opportunity.type === 'job' && getSectorBadge()}
            {opportunity.type === 'scholarship' && getScopeBadge()}
            {getRegionBadge()}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            {opportunity.organization && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{opportunity.organization}</span>
              </div>
            )}
            {opportunity.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{opportunity.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Deadline: {formatDate(opportunity.deadline_date)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onApprove && onReject ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 gap-1"
                  onClick={onApprove}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 gap-1"
                  onClick={onReject}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1"
                asChild
              >
                <a href={opportunity.apply_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View Application
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExternalCuration;
