
import { FileText, Trash } from "lucide-react";
import { Topic } from "@/services/supabaseTopicService";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TopicListProps {
  topics: Topic[];
  onRemoveTopic: (topicName: string) => void;
}

const TopicList: React.FC<TopicListProps> = ({ topics, onRemoveTopic }) => {
  if (topics.length === 0) {
    return (
      <div className="text-center p-10 border rounded-md bg-muted/10">
        <p className="text-muted-foreground">No topics added yet. Create your first topic.</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Content Preview</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((topic) => (
            <TableRow key={topic.name || topic.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">{topic.name}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {topic.description && topic.description.length > 100 
                  ? `${topic.description.substring(0, 100)}...`
                  : topic.description || 'No description'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveTopic(topic.name || '')}
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

export default TopicList;
