import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EducationalSystem, Level } from "@/types/lms.types";
import { removeLevel, getSubjectsByLevel } from "@/services/lmsStructureService";
import { AddLevelDialog } from "./AddLevelDialog";
import { BulkSyllabusImport } from "./BulkSyllabusImport";
import { 
  Plus, Trash2, ChevronDown, ChevronRight, GraduationCap, Briefcase,
  BookOpen, FileUp, Layers
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LevelManagerProps {
  system: EducationalSystem;
  levels: Level[];
  onLevelsChange: () => void;
  loading: boolean;
}

interface SubjectWithTopics {
  id: string;
  name: string;
  description?: string;
  topicCount: number;
}

export function LevelManager({ system, levels, onLevelsChange, loading }: LevelManagerProps) {
  const [addLevelOpen, setAddLevelOpen] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [levelSubjects, setLevelSubjects] = useState<Record<string, SubjectWithTopics[]>>({});
  const [loadingSubjects, setLoadingSubjects] = useState<Set<string>>(new Set());
  const [bulkImportLevel, setBulkImportLevel] = useState<Level | null>(null);

  const toggleLevel = async (levelId: string) => {
    const newExpanded = new Set(expandedLevels);
    
    if (newExpanded.has(levelId)) {
      newExpanded.delete(levelId);
    } else {
      newExpanded.add(levelId);
      
      // Load subjects if not already loaded
      if (!levelSubjects[levelId]) {
        setLoadingSubjects(prev => new Set(prev).add(levelId));
        const subjects = await getSubjectsByLevel(levelId);
        setLevelSubjects(prev => ({ ...prev, [levelId]: subjects }));
        setLoadingSubjects(prev => {
          const next = new Set(prev);
          next.delete(levelId);
          return next;
        });
      }
    }
    
    setExpandedLevels(newExpanded);
  };

  const handleRemoveLevel = async (level: Level) => {
    const success = await removeLevel(level.id);
    if (success) {
      toast.success(`Level "${level.name}" removed`);
      onLevelsChange();
    } else {
      toast.error("Failed to remove level");
    }
  };

  const handleBulkImportSuccess = (levelId: string) => {
    // Refresh subjects for this level
    setLevelSubjects(prev => {
      const next = { ...prev };
      delete next[levelId];
      return next;
    });
    
    // Reload if expanded
    if (expandedLevels.has(levelId)) {
      toggleLevel(levelId); // Close
      setTimeout(() => toggleLevel(levelId), 100); // Reopen to reload
    }
    
    onLevelsChange();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${
              system.type === 'academic' ? 'bg-blue-500/10' : 'bg-amber-500/10'
            }`}>
              {system.type === 'academic' ? (
                <GraduationCap className="h-5 w-5 text-blue-500" />
              ) : (
                <Briefcase className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{system.name}</h2>
              <p className="text-sm text-muted-foreground">
                {system.description || `${system.type === 'academic' ? 'Academic' : 'Job Prep'} system`}
              </p>
            </div>
          </div>
          <Button onClick={() => setAddLevelOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Level
          </Button>
        </div>
      </div>

      {/* Levels List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))
          ) : levels.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Layers className="h-10 w-10 mb-3" />
                <p className="font-medium">No levels yet</p>
                <p className="text-sm">Add a level to start organizing subjects</p>
              </CardContent>
            </Card>
          ) : (
            levels.map((level) => (
              <Card key={level.id} className="overflow-hidden">
                <Collapsible open={expandedLevels.has(level.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                      onClick={() => toggleLevel(level.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedLevels.has(level.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div>
                            <CardTitle className="text-base">{level.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {level.subjectCount} subjects • Order: {level.order_index}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setBulkImportLevel(level)}
                          >
                            <FileUp className="h-4 w-4 mr-1" />
                            Bulk Import
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Level?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove "{level.name}" and unlink all its subjects.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => handleRemoveLevel(level)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      {loadingSubjects.has(level.id) ? (
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : levelSubjects[level.id]?.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border rounded-md border-dashed">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No subjects in this level</p>
                          <p className="text-xs mt-1">Use "Bulk Import" to add subjects and topics</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Topics</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {levelSubjects[level.id]?.map((subject) => (
                              <TableRow key={subject.id}>
                                <TableCell className="font-medium">{subject.name}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {subject.description || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary">{subject.topicCount}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <AddLevelDialog
        open={addLevelOpen}
        onOpenChange={setAddLevelOpen}
        systemId={system.id}
        onSuccess={onLevelsChange}
      />

      {bulkImportLevel && (
        <BulkSyllabusImport
          open={!!bulkImportLevel}
          onOpenChange={(open) => !open && setBulkImportLevel(null)}
          level={bulkImportLevel}
          onSuccess={() => handleBulkImportSuccess(bulkImportLevel.id)}
        />
      )}
    </div>
  );
}
