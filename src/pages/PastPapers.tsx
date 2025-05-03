
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { FileText, Search, Upload, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ContentItem } from "@/interfaces/content";
import { getContentByCategory } from "@/services/contentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';

const PastPapers = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pastPapers, setPastPapers] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPastPapers = () => {
      try {
        const items = getContentByCategory('past_paper');
        console.log("Fetched past papers:", items);
        setPastPapers(items);
      } catch (error) {
        console.error("Error fetching past papers:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load past papers. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPastPapers();
  }, []);

  const examTypes = pastPapers.length > 0 
    ? [...new Set(pastPapers.map(paper => paper.examType).filter(Boolean))] 
    : [];

  const filteredPapers = pastPapers.filter(paper => 
    (paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (paper.examType && paper.examType.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (paper.examYear && paper.examYear.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (paper.description && paper.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    paper.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    (categoryFilter === "all" || paper.examType === categoryFilter)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header theme={theme} setTheme={setTheme} />
      
      <div className="container px-4 mx-auto pt-28 pb-16">
        <PageBreadcrumb 
          items={[
            { title: 'Home', href: '/' },
            { title: 'Past Papers', href: '/past-papers', isCurrent: true },
          ]} 
        />
        
        <div className="mt-6 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold"
          >
            <FileText className="inline-block h-8 w-8 mr-2 text-primary" />
            Past Papers
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Download past papers from various examinations to boost your preparation
          </motion.p>
          
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search papers by title, type, or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            {examTypes.length > 0 && (
              <div className="w-full md:w-[200px]">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {examTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {user && (
              <Button onClick={() => navigate("/submit-content")} className="flex gap-2">
                <Upload className="h-4 w-4" />
                Submit Paper
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-8">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="h-6 bg-muted rounded-md w-3/4 mb-3"></div>
                    <div className="h-4 bg-muted rounded-md w-1/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded-md w-full mb-2"></div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="h-4 bg-muted rounded-md w-1/3"></div>
                      <div className="h-10 bg-muted rounded-md w-24"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredPapers.length > 0 ? (
            filteredPapers.map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-0">
                    <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{paper.title}</h3>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          {paper.createdAt && (
                            <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                          )}
                          {paper.examType && (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                              {paper.examType}
                            </span>
                          )}
                          {paper.examYear && (
                            <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs">
                              {paper.examYear}
                            </span>
                          )}
                        </div>
                        {paper.description && (
                          <p className="mt-2 text-muted-foreground line-clamp-2">{paper.description}</p>
                        )}
                        {paper.metaTitle && (
                          <div className="mt-2 text-xs text-muted-foreground/70">
                            <span className="font-medium">SEO:</span> {paper.metaTitle}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild disabled={!paper.fileUrl}>
                        {paper.fileUrl ? (
                          <a href={paper.fileUrl} download>
                            <FileText className="h-4 w-4 mr-2" />
                            Download PDF
                          </a>
                        ) : (
                          <span>No File Available</span>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No past papers found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery || categoryFilter !== "all"
                  ? "Try adjusting your search query or filter"
                  : user ? "Be the first to submit a past paper" : "Sign in to submit past papers"
                }
              </p>
              {user && (
                <Button onClick={() => navigate('/submit-content')} className="mt-4">
                  Submit Paper
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PastPapers;
