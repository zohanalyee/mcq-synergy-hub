import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Brain,
} from "lucide-react";

interface LMSApproval {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  ai_metadata: Record<string, unknown> | null;
  status: string;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export function LMSApprovalDashboard() {
  const [approvals, setApprovals] = useState<LMSApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("lms_approvals" as any)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }) as any);

    if (error) {
      console.error("Error loading approvals:", error);
      toast.error("Failed to load pending approvals");
    } else {
      setApprovals((data || []) as LMSApproval[]);
    }
    setLoading(false);
  };

  const getTableName = (entityType: string) => {
    switch (entityType) {
      case "system": return "educational_systems";
      case "level": return "levels";
      case "subject": return "subjects";
      case "topic": return "topics";
      default: return entityType;
    }
  };

  const handleApprove = async (approval: LMSApproval) => {
    setProcessing((prev) => new Set(prev).add(approval.id));
    try {
      const tableName = getTableName(approval.entity_type);

      const { error: updateError } = await (supabase
        .from(tableName as any)
        .update({
          approved: true,
          admin_reviewed_at: new Date().toISOString(),
        })
        .eq("id", approval.entity_id) as any);

      if (updateError) throw updateError;

      const { error: approvalError } = await (supabase
        .from("lms_approvals" as any)
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", approval.id) as any);

      if (approvalError) throw approvalError;

      toast.success(`${approval.entity_type} "${approval.entity_name}" approved!`);
      setApprovals((prev) => prev.filter((a) => a.id !== approval.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(approval.id);
        return next;
      });
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve");
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(approval.id);
        return next;
      });
    }
  };

  const handleReject = async (approval: LMSApproval) => {
    setProcessing((prev) => new Set(prev).add(approval.id));
    try {
      const { error } = await (supabase
        .from("lms_approvals" as any)
        .update({
          status: "rejected",
          approved_at: new Date().toISOString(),
        })
        .eq("id", approval.id) as any);

      if (error) throw error;

      toast.info(`${approval.entity_type} "${approval.entity_name}" rejected`);
      setApprovals((prev) => prev.filter((a) => a.id !== approval.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(approval.id);
        return next;
      });
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("Failed to reject");
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(approval.id);
        return next;
      });
    }
  };

  const handleBulkApprove = async () => {
    const items = approvals.filter((a) => selected.has(a.id));
    for (const item of items) {
      await handleApprove(item);
    }
    setSelected(new Set());
  };

  const handleBulkReject = async () => {
    const items = approvals.filter((a) => selected.has(a.id));
    for (const item of items) {
      await handleReject(item);
    }
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === approvals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(approvals.map((a) => a.id)));
    }
  };

  const getEntityBadgeColor = (type: string) => {
    switch (type) {
      case "system": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "level": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "subject": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "topic": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            LMS Category Approvals
          </h2>
          <p className="text-muted-foreground">
            Review AI-created categories before they become visible to students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {approvals.length} Pending
          </Badge>
          <Button variant="outline" size="sm" onClick={loadApprovals}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-sm font-medium">
              {selected.size} item{selected.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-muted-foreground text-sm">
              No pending approvals. All AI-created categories have been reviewed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={selected.size === approvals.length && approvals.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Select all</span>
          </div>

          {approvals.map((approval) => {
            const meta = approval.ai_metadata || {};
            const conf = (meta.confidence as number) || 0;
            const isLowConfidence = conf < 0.7;

            return (
              <Card key={approval.id} className="border-border/50">
                <CardContent className="flex items-start gap-4 py-4">
                  <Checkbox
                    checked={selected.has(approval.id)}
                    onCheckedChange={() => toggleSelect(approval.id)}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getEntityBadgeColor(approval.entity_type)}>
                        {approval.entity_type.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-lg">{approval.entity_name}</span>
                      {isLowConfidence && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Confidence
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {meta.system && <span>System: <strong>{meta.system as string}</strong></span>}
                      {meta.level && <span>Level: <strong>{meta.level as string}</strong></span>}
                      {meta.subject && <span>Subject: <strong>{meta.subject as string}</strong></span>}
                      {conf > 0 && (
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          Confidence: <strong>{(conf * 100).toFixed(0)}%</strong>
                        </span>
                      )}
                    </div>

                    {meta.reasoning && (
                      <p className="text-xs text-muted-foreground italic">
                        "{meta.reasoning as string}"
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(approval.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(approval)}
                      disabled={processing.has(approval.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing.has(approval.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(approval)}
                      disabled={processing.has(approval.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default LMSApprovalDashboard;
