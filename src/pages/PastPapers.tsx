
import { useState } from 'react';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { FileText, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const PastPapers = () => {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sample past papers data - replace with your actual data
  const pastPapers = [
    {
      id: 1,
      title: "PPSC Mathematics Past Paper 2024",
      date: "March 15, 2024",
      category: "PPSC",
      subject: "Mathematics",
      downloadUrl: "#"
    },
    {
      id: 2,
      title: "CSS Physics Past Paper 2024",
      date: "February 20, 2024",
      category: "CSS",
      subject: "Physics",
      downloadUrl: "#"
    },
    {
      id: 3,
      title: "FPSC General Knowledge Past Paper 2024",
      date: "January 10, 2024",
      category: "FPSC",
      subject: "General Knowledge",
      downloadUrl: "#"
    },
    {
      id: 4,
      title: "NTS English Past Paper 2023",
      date: "December 5, 2023",
      category: "NTS",
      subject: "English",
      downloadUrl: "#"
    },
    {
      id: 5,
      title: "MDCAT Biology Past Paper 2023",
      date: "November 18, 2023",
      category: "MDCAT",
      subject: "Biology",
      downloadUrl: "#"
    }
  ];

  // Filter papers based on search query
  const filteredPapers = pastPapers.filter(paper => 
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header theme={theme} setTheme={setTheme} />
      
      <div className="container px-4 mx-auto pt-28 pb-16">
        <PageBreadcrumb 
          items={[
            { label: 'Home', path: '/' },
            { label: 'Past Papers', path: '/past-papers' },
          ]} 
        />
        
        <div className="mt-6 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold"
          >
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
          
          <div className="mt-8 flex gap-4 max-w-xl">
            <div className="flex-1">
              <Input
                placeholder="Search papers by title, category, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-8">
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
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
                          <span>{paper.date}</span>
                          <span className="mx-2">•</span>
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                            {paper.category}
                          </span>
                          <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs">
                            {paper.subject}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={paper.downloadUrl} download>
                          <FileText className="h-4 w-4 mr-2" />
                          Download PDF
                        </a>
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
                Try adjusting your search query or check back later for more papers
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PastPapers;
