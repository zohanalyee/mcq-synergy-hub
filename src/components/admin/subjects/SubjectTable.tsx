
import { Subject } from "@/types/subject.types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

interface SubjectTableProps {
  subjects: Subject[];
  onRemove: (title: string) => void;
}

const SubjectTable: React.FC<SubjectTableProps> = ({ subjects, onRemove }) => {
  if (subjects.length === 0) {
    return (
      <div className="text-center p-10 border rounded-md bg-muted/10">
        <p className="text-muted-foreground">No subjects added yet. Create your first subject.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="hidden md:table-cell">Topics</TableHead>
            <TableHead className="hidden md:table-cell">Purpose</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((subject) => (
            <TableRow key={subject.title}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: subject.color }} 
                  />
                  <span className="font-medium">{subject.title}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {subject.category}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {subject.topicCount}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {subject.purpose === 'mcqs' ? 'MCQs' : 'Reading'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onRemove(subject.title)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubjectTable;
