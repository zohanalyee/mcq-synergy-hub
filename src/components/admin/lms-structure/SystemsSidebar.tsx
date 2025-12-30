import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EducationalSystem } from "@/types/lms.types";
import { removeEducationalSystem } from "@/services/lmsStructureService";
import { AddSystemDialog } from "./AddSystemDialog";
import { Plus, GraduationCap, Briefcase, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SystemsSidebarProps {
  systems: EducationalSystem[];
  selectedSystem: EducationalSystem | null;
  onSelectSystem: (system: EducationalSystem | null) => void;
  onSystemsChange: () => void;
  loading: boolean;
}

export function SystemsSidebar({
  systems,
  selectedSystem,
  onSelectSystem,
  onSystemsChange,
  loading
}: SystemsSidebarProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleRemoveSystem = async (system: EducationalSystem) => {
    const success = await removeEducationalSystem(system.id);
    if (success) {
      toast.success(`System "${system.name}" removed`);
      if (selectedSystem?.id === system.id) {
        onSelectSystem(null);
      }
      onSystemsChange();
    } else {
      toast.error("Failed to remove system");
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Systems
          </h3>
          <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Educational systems and boards
        </p>
      </div>

      {/* Systems List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : systems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>No systems yet.</p>
              <p>Create one to get started.</p>
            </div>
          ) : (
            systems.map((system) => (
              <div
                key={system.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSystem?.id === system.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted border border-transparent"
                }`}
                onClick={() => onSelectSystem(system)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md ${
                    system.type === 'academic' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                  }`}>
                    {system.type === 'academic' ? (
                      <GraduationCap className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Briefcase className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{system.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {system.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {system.levelCount} levels
                      </span>
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete System?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{system.name}" and all its levels.
                          Subjects will be unlinked but not deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleRemoveSystem(system)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <AddSystemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={onSystemsChange}
      />
    </div>
  );
}
