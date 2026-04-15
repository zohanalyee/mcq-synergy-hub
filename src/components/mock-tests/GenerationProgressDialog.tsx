import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export interface GenerationProgress {
  subject: string;
  requested: number;
  generated: number;
  status: "pending" | "generating" | "complete" | "error";
  error?: string;
}

interface GenerationProgressDialogProps {
  isOpen: boolean;
  progress: GenerationProgress[];
  onClose: () => void;
}

export const GenerationProgressDialog = ({ isOpen, progress, onClose }: GenerationProgressDialogProps) => {
  const totalRequested = progress.reduce((s, p) => s + p.requested, 0);
  const totalGenerated = progress.reduce((s, p) => s + p.generated, 0);
  const overallPercent = totalRequested > 0 ? Math.round((totalGenerated / totalRequested) * 100) : 0;
  const allDone = progress.length > 0 && progress.every((p) => p.status === "complete" || p.status === "error");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && allDone) onClose(); }}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-base">Generating Test Questions</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Progress value={overallPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {totalGenerated}/{totalRequested} questions ({overallPercent}%)
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {progress.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-secondary/20">
                <div className="shrink-0">
                  {item.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                  {item.status === "generating" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {item.status === "complete" && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {item.status === "error" && <AlertCircle className="w-4 h-4 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{item.subject}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {item.generated}/{item.requested}
                    </span>
                  </div>
                  {item.status === "generating" && (
                    <Progress value={0} className="h-1 mt-1" indicatorClassName="animate-pulse bg-primary/60" />
                  )}
                  {item.status === "complete" && (
                    <Progress value={100} className="h-1 mt-1" indicatorClassName="bg-green-500" />
                  )}
                  {item.error && <p className="text-[10px] text-destructive mt-0.5 truncate">{item.error}</p>}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            This may take 30–60 seconds. Please wait...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
