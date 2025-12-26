
import { useState, useMemo } from "react";
import { ContentItem, ContentStatus, ContentCategory } from "@/interfaces/content";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  FileEdit, Check, X, Edit, Trash, Search, Filter, 
  Download, ChevronUp, ChevronDown, Calendar,
  CheckSquare, Square, Loader2
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import CategoryBadge from "./CategoryBadge";
import ContentDetails from "./ContentDetails";

interface EnhancedContentTableProps {
  content: ContentItem[];
  onEditClick: (item: ContentItem) => void;
  onUpdateStatus: (id: string, status: ContentStatus) => void;
  onDelete: (id: string) => void;
  onBulkAction?: (action: string, selectedIds: string[]) => void;
}

type SortField = 'title' | 'createdAt' | 'status' | 'category';
type SortDirection = 'asc' | 'desc';

const EnhancedContentTable = ({ 
  content, 
  onEditClick, 
  onUpdateStatus, 
  onDelete,
  onBulkAction 
}: EnhancedContentTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Advanced filtering and searching
  const filteredAndSortedContent = useMemo(() => {
    let filtered = content.filter(item => {
      // Search in multiple fields
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (item.department && item.department.toLowerCase().includes(searchLower)) ||
        (item.institution && item.institution.toLowerCase().includes(searchLower)) ||
        (item.subject && item.subject.toLowerCase().includes(searchLower)) ||
        (item.topic && item.topic.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      
      // Date range filter
      const matchesDate = dateRange === "all" || (() => {
        const itemDate = new Date(item.createdAt);
        const now = new Date();
        switch (dateRange) {
          case "today":
            return itemDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return itemDate >= monthAgo;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [content, searchTerm, statusFilter, categoryFilter, dateRange, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedContent.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedContent.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedItems.size > 0) {
      onBulkAction(action, Array.from(selectedItems));
      setSelectedItems(new Set());
    }
  };

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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Advanced Filters */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in title, description, tags, department, subject..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="scholarship">Scholarships</SelectItem>
            <SelectItem value="job">Jobs</SelectItem>
            <SelectItem value="mcq">MCQs</SelectItem>
            <SelectItem value="quiz">Quizzes</SelectItem>
            <SelectItem value="past_paper">Past Papers</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.size} item(s) selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('approve')}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('reject')}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkAction('export')}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Showing {filteredAndSortedContent.length} of {content.length} items
        </span>
        <span>
          {selectedItems.size > 0 && `${selectedItems.size} selected`}
        </span>
      </div>

      {/* Enhanced Table */}
      {filteredAndSortedContent.length > 0 ? (
        <div className="rounded-md border">
          <Table className="[&_td]:py-2 [&_th]:py-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.size === filteredAndSortedContent.length && filteredAndSortedContent.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-1">
                    Title {getSortIcon('title')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell cursor-pointer select-none"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Category {getSortIcon('category')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Date {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell cursor-pointer select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedContent.map((item) => (
                <TableRow key={item.id} className={selectedItems.has(item.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground hidden md:block">
                        {item.description.length > 40 
                          ? `${item.description.substring(0, 40)}...` 
                          : item.description}
                      </div>
                      <ContentDetails item={item} />
                      <div className="md:hidden mt-2">
                        <div className="flex gap-2 items-center">
                          <CategoryBadge category={item.category} />
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(item.createdAt)}
                        </div>
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
                    <div className="flex justify-end gap-1.5">
                      {item.status === "pending" && (
                        <>
                          <Button 
                            size="icon" 
                            variant="default" 
                            className="bg-green-600 hover:bg-green-700 h-7 w-7"
                            onClick={() => onUpdateStatus(item.id, "approved")}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="destructive"
                            className="h-7 w-7"
                            onClick={() => onUpdateStatus(item.id, "rejected")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <Button 
                        size="icon" 
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onEditClick(item)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash className="h-3.5 w-3.5" />
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
            {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || dateRange !== "all"
              ? "No content items match your current filters. Try adjusting your search criteria."
              : "There are no content items to display."}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedContentTable;
