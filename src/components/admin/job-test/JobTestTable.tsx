
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash, Sparkles, Loader2, Check, Pencil, Link2 } from "lucide-react";
import { JobTest } from "@/data/jobTestsData";

interface JobTestTableProps {
  jobTests: JobTest[];
  onRemove: (id: string) => void;
  onEnhance?: (test: JobTest) => void;
  onEdit?: (test: JobTest) => void;
  enhancingId?: string | null;
}

const JobTestTable = ({ jobTests, onRemove, onEnhance, onEdit, enhancingId }: JobTestTableProps) => {
  if (jobTests.length === 0) {
    return (
      <div className="text-center p-10 border rounded-md bg-muted/10">
        <p className="text-muted-foreground">No job tests added yet. Create your first job test.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Organization</TableHead>
            <TableHead className="hidden md:table-cell">Duration</TableHead>
            <TableHead className="hidden md:table-cell">Questions</TableHead>
            <TableHead className="hidden md:table-cell">SEO</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobTests.map((test) => {
            const isEnhancing = enhancingId === test.id;
            const enhanced = !!(test as JobTest).seo_enhanced_at;
            return (
              <TableRow key={test.id}>
                <TableCell>
                  <span className="font-medium">{test.title}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">{test.organization}</TableCell>
                <TableCell className="hidden md:table-cell">{test.duration} mins</TableCell>
                <TableCell className="hidden md:table-cell">{test.questions}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {enhanced ? (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" /> Optimized
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Needs SEO</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEnhance && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={isEnhancing}
                        onClick={() => onEnhance(test as JobTest)}
                      >
                        {isEnhancing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-primary" />
                        )}
                        <span className="hidden sm:inline">{isEnhancing ? "Working…" : "AI Magic"}</span>
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(test as JobTest)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => onRemove(test.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobTestTable;
