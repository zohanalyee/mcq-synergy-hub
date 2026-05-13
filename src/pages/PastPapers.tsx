
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, GraduationCap, Search } from "lucide-react";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import PageBreadcrumb from "@/components/PageBreadcrumb";
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
    <Header>
      <SEOHead
        title="Past Papers MCQs Online | Matric FSc FPSC NTS | MCQsAI"
        description="Solve past papers MCQs online for Matric, FSc, FPSC, NTS, PPSC, MDCAT, ECAT. Free practice with AI-powered feedback on MCQsAI Pakistan."
        keywords="past papers MCQs, FPSC past papers, NTS past papers, matric past papers, FSc past papers Pakistan"
      />
      <div className="container mx-auto px-4 pt-4 pb-10">
        <PageBreadcrumb items={[{ title: 'Past Papers', href: '/past-papers', isCurrent: true }]} showHomeButton={true} />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-center"
        >
          <h1 className="text-xl font-bold flex items-center justify-center mb-1 text-foreground">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Past Papers
          </h1>
          <p className="text-sm text-muted-foreground">
            Access previous examination papers for preparation
          </p>
        </motion.div>

        <div className="mb-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search past papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 h-9 text-sm glass-card"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="animate-pulse glass-card">
                <CardHeader className="p-3 pb-2">
                  <div className="h-5 bg-muted rounded w-3/4 mb-1.5"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="h-3 bg-muted rounded w-full mb-1.5"></div>
                  <div className="h-3 bg-muted rounded w-2/3 mb-3"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredPapers.map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow glass-card">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm font-semibold line-clamp-1">{paper.title}</CardTitle>
                    <div className="flex flex-wrap gap-1">
                      {paper.examType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <GraduationCap className="w-2.5 h-2.5 mr-0.5" />
                          {paper.examType}
                        </Badge>
                      )}
                      {paper.examYear && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <Calendar className="w-2.5 h-2.5 mr-0.5" />
                          {paper.examYear}
                        </Badge>
                      )}
                      {paper.subject && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {paper.subject}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                      {paper.description}
                    </p>
                    <Button 
                      className="w-full h-8 text-xs" 
                      size="sm"
                      disabled={!paper.fileUrl}
                      onClick={() => paper.fileUrl && window.open(paper.fileUrl, '_blank')}
                    >
                      <Download className="w-3 h-3 mr-1.5" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredPapers.length === 0 && (
          <div className="text-center py-10">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-medium mb-1">No past papers found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery 
                ? "No past papers match your search. Try adjusting your search."
                : "No past papers available at the moment."}
            </p>
          </div>
        )}
      </div>
    </Header>
  );
};

export default PastPapers;
