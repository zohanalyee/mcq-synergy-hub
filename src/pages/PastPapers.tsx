
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, GraduationCap, Search } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getContentByCategory } from "@/services/contentService";
import { ContentItem } from "@/interfaces/content";

const PastPapers = () => {
  const [pastPapers, setPastPapers] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPastPapers = async () => {
      try {
        setIsLoading(true);
        const papersData = await getContentByCategory("past_paper");
        setPastPapers(papersData);
      } catch (error) {
        console.error("Error loading past papers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPastPapers();
  }, []);

  const filteredPapers = pastPapers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.examType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).getFullYear().toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-3xl font-bold flex items-center mb-4">
            <FileText className="mr-3 h-8 w-8 text-primary" />
            Past Papers
          </h1>
          <p className="text-muted-foreground">
            Access previous examination papers for effective preparation
          </p>
        </motion.div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search past papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{paper.title}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {paper.examType && (
                        <Badge variant="outline" className="text-xs">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {paper.examType}
                        </Badge>
                      )}
                      {paper.examYear && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {paper.examYear}
                        </Badge>
                      )}
                      {paper.subject && (
                        <Badge variant="secondary" className="text-xs">
                          {paper.subject}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {paper.description}
                    </p>
                    <Button 
                      className="w-full" 
                      disabled={!paper.fileUrl}
                      onClick={() => paper.fileUrl && window.open(paper.fileUrl, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Paper
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredPapers.length === 0 && (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">No past papers found</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? "No past papers match your search criteria. Try adjusting your search."
                : "No past papers available at the moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastPapers;
