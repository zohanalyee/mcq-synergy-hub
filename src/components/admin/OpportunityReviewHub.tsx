import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Globe, Inbox, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { syncMockExternalData, syncAIExternalData } from "@/services/externalOpportunitiesService";
import ManualOpportunityCreator from "./ManualOpportunityCreator";
import OpportunityReviewQueue from "./OpportunityReviewQueue";
import PublishedOpportunitiesManager from "./PublishedOpportunitiesManager";
import CorruptedDataCleaner from "./CorruptedDataCleaner";

/**
 * OpportunityReviewHub — single queue for reviewing opportunities from BOTH
 * the AI Agent pipeline and External Curation. All items land in the same
 * `external_opportunities` table (status = pending), so OpportunityReviewQueue
 * surfaces every source together. Sync tools from External Curation are folded
 * in here so nothing lives on a separate page.
 */
const OpportunityReviewHub = () => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAISyncing, setIsAISyncing] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-opportunities"] });
    queryClient.invalidateQueries({ queryKey: ["pending-opportunities-count"] });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncMockExternalData();
      if (result.added > 0) {
        toast.success(`Added ${result.added} new opportunities for review`);
        invalidate();
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

  const handleAISync = async (searchType: "jobs" | "scholarships") => {
    setIsAISyncing(true);
    try {
      const result = await syncAIExternalData(searchType);
      if (result.success) {
        if (result.added > 0) {
          toast.success(`AI found ${result.added} new ${searchType} for review`);
          invalidate();
        } else if (result.duplicates > 0) {
          toast.info(`No new ${searchType} (${result.duplicates} duplicates skipped)`);
        } else {
          toast.info(`AI couldn't find new ${searchType}`);
        }
      } else if (result.error === "RATE_LIMIT_EXCEEDED") {
        toast.error("AI is Busy (Quota Full). Please wait 15 minutes.");
      } else if (result.error === "AUTH_ERROR") {
        toast.error("Configuration Error. Check API Key.");
      } else if (result.error === "NETWORK_ERROR") {
        toast.error("Network Error. Please check your connection.");
      } else {
        toast.error(result.error || "AI sync failed");
      }
    } catch (error) {
      console.error("Error AI syncing:", error);
      toast.error("Connection failed. Please try again.");
    } finally {
      setIsAISyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Opportunity Review</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <ManualOpportunityCreator onSuccess={invalidate} />
          <Button variant="outline" size="sm" onClick={() => handleAISync("jobs")} disabled={isAISyncing} className="gap-1.5">
            <Sparkles className={`h-3.5 w-3.5 ${isAISyncing ? "animate-pulse" : ""}`} /> AI Find Jobs
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAISync("scholarships")} disabled={isAISyncing} className="gap-1.5">
            <Sparkles className={`h-3.5 w-3.5 ${isAISyncing ? "animate-pulse" : ""}`} /> AI Find Scholarships
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} /> Sync Mock
          </Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <Globe className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Unified queue.</span> Items from the AI Agent pipeline and
              External Curation (webhook: <code className="bg-muted px-1 rounded text-[10px]">/functions/v1/external-agent-webhook</code>)
              are reviewed here together before publishing.
            </div>
          </div>
        </CardContent>
      </Card>

      <OpportunityReviewQueue />

      <div className="mt-2">
        <h3 className="text-sm font-semibold mb-3">Published Content Management</h3>
        <PublishedOpportunitiesManager />
      </div>

      <div className="mt-2">
        <CorruptedDataCleaner />
      </div>
    </div>
  );
};

export default OpportunityReviewHub;
