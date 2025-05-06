
import { ContentItem, ContentStatus } from "@/interfaces/content";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileEdit, Check, X, Edit, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import CategoryBadge from "./CategoryBadge";
import ContentDetails from "./ContentDetails";

interface ContentTableProps {
  content: ContentItem[];
  onEditClick: (item: ContentItem) => void;
  onUpdateStatus: (id: string, status: ContentStatus) => void;
  onDelete: (id: string) => void;
}

const ContentTable = ({ content, onEditClick, onUpdateStatus, onDelete }: ContentTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredContent = content.filter(item => {
    if (!searchTerm) return true;
    return (
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="flex justify-between items-center pb-4">
        <Input
          placeholder="Search content..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredContent.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground hidden md:block">
                        {item.description.length > 50 
                          ? `${item.description.substring(0, 50)}...` 
                          : item.description}
                      </div>
                      <ContentDetails item={item} />
                      <div className="md:hidden">
                        <CategoryBadge category={item.category} />
                        <div className="mt-1"><StatusBadge status={item.status} /></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <CategoryBadge category={item.category} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === "pending" && (
                        <>
                          <Button 
                            size="icon" 
                            variant="default" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => onUpdateStatus(item.id, "approved")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="destructive"
                            onClick={() => onUpdateStatus(item.id, "rejected")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => onEditClick(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileEdit className="h-16 w-16 mx-auto text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-medium">No content found</h3>
          <p className="mt-2 text-muted-foreground">
            There are no content items matching your search criteria.
          </p>
        </div>
      )}
    </>
  );
};

export default ContentTable;
