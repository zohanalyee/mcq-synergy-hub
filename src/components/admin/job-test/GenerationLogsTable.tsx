import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGenerationLogs, JobTestGenerationLog } from "@/services/jobTestService";

interface Props {
  jobTestId: string;
}

export const GenerationLogsTable: React.FC<Props> = ({ jobTestId }) => {
  const [logs, setLogs] = useState<JobTestGenerationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    setLogs(await getGenerationLogs(jobTestId));
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [jobTestId]);

  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" onClick={reload}>
        Reload
      </Button>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No generation logs yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <Card key={l.id} className="p-3 text-sm">
              <div className="flex justify-between items-start mb-1">
                <div className="flex gap-2 items-center">
                  <Badge
                    variant={
                      l.status === "success"
                        ? "default"
                        : l.status === "partial"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {l.status}
                  </Badge>
                  <span className="font-medium">{l.subject}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Requested: {l.requested_count} • Generated: {l.generated_count} • Accepted:{" "}
                {l.accepted_count} • Rejected: {l.rejected_count} • API calls: {l.api_calls_made} •{" "}
                {l.generation_time_seconds}s
              </p>
              {l.rejection_reasons && Object.keys(l.rejection_reasons).length > 0 && (
                <details className="mt-1">
                  <summary className="text-xs cursor-pointer text-muted-foreground">
                    Rejection reasons
                  </summary>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(l.rejection_reasons, null, 2)}
                  </pre>
                </details>
              )}
              {l.error_message && (
                <p className="text-xs text-destructive mt-1">{l.error_message}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerationLogsTable;
