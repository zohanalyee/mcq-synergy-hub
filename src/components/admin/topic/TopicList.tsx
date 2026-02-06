import { FileText, Trash, FileCheck, FileX } from "lucide-react";
import { Topic } from "@/services/supabaseTopicService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import GenerateFromRAGDialog from "./GenerateFromRAGDialog";

export interface TopicWithRAGStatus extends Topic {
  documentCount?: number;
  chunkCount?: number;
  subjectName?: string;
}

interface TopicListProps {
  topics: TopicWithRAGStatus[];
  onRemoveTopic: (topicName: string) => void;
  onRefresh?: () => void;
}

const TopicList: React.FC<TopicListProps> = ({ topics, onRemoveTopic, onRefresh }) => {
  if (topics.length === 0) {
    return (
      <div className="text-center p-10 border rounded-md bg-muted/10">
        <p className="text-muted-foreground">No topics added yet. Create your first topic.</p>
      </div>
    );
  }

  const getRAGStatus = (topic: TopicWithRAGStatus) => {
    const docCount = topic.documentCount || 0;
    const chunkCount = topic.chunkCount || 0;
    
    if (docCount > 0) {
      return {
        hasDocuments: true,
        label: 'RAG Ready',
        tooltip: `${docCount} PDF${docCount > 1 ? 's' : ''} · ${chunkCount} chunks indexed`,
        icon: FileCheck,
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      };
    }
    return {
      hasDocuments: false,
      label: 'No Documents',
      tooltip: 'Upload PDFs to enable RAG-based MCQ generation',
      icon: FileX,
      className: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400'
    };
  };
  
  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Content Preview</TableHead>
              <TableHead>RAG Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((topic) => {
              const ragStatus = getRAGStatus(topic);
              const RAGIcon = ragStatus.icon;
              
              return (
                <TableRow key={topic.name || topic.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{topic.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {topic.description && topic.description.length > 80 
                      ? `${topic.description.substring(0, 80)}...`
                      : topic.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={`${ragStatus.className} flex items-center gap-1 w-fit cursor-help`}>
                          <RAGIcon className="h-3 w-3" />
                          {ragStatus.label}
                          {ragStatus.hasDocuments && topic.documentCount && (
                            <span className="ml-1 opacity-70">({topic.documentCount})</span>
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{ragStatus.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <GenerateFromRAGDialog
                        topicId={topic.id}
                        topicName={topic.name}
                        subjectName={topic.subjectName || ''}
                        hasDocuments={ragStatus.hasDocuments}
                        onSuccess={onRefresh}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => onRemoveTopic(topic.name || '')}
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
    </TooltipProvider>
  );
};

export default TopicList;
