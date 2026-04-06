
import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash } from "lucide-react";
import { JobTest } from "@/data/jobTestsData";

interface JobTestTableProps {
  jobTests: JobTest[];
  onRemove: (id: string) => void;
}

const JobTestTable = ({ jobTests, onRemove }: JobTestTableProps) => {
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobTests.map((test) => (
            <TableRow key={test.id}>
              <TableCell>
                <span className="font-medium">{test.title}</span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {test.organization}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {test.duration} mins
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {test.questions}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onRemove(test.id)}
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

export default JobTestTable;
