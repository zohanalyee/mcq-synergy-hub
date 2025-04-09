import { useState } from 'react';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { FileText, Search } from 'lucide-react';
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

const PastPapers = () => {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
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
    },
    {
      id: 6,
      title: "SPSC Civil Service Past Paper 2023",
      date: "October 10, 2023",
      category: "SPSC",
      subject: "Civil Service",
      downloadUrl: "#"
    },
    {
      id: 7,
      title: "KPPSC Assistant Director Past Paper",
      date: "November 5, 2023",
      category: "KPPSC",
      subject: "Administration",
      downloadUrl: "#"
    },
    {
      id: 8,
      title: "BPPSC Lecturer Past Paper",
      date: "September 20, 2023",
      category: "BPPSC",
      subject: "Education",
      downloadUrl: "#"
    },
    {
      id: 9,
      title: "Motorway Police Inspector Past Paper",
      date: "August 15, 2023",
      category: "Motorway Police",
      subject: "Law Enforcement",
      downloadUrl: "#"
    },
    {
      id: 10,
      title: "AJKPSC Assistant Commissioner Past Paper",
      date: "July 12, 2023",
      category: "AJKPSC",
      subject: "Administration",
      downloadUrl: "#"
    },
    {
      id: 11,
      title: "Pakistan Rangers Recruitment Test",
      date: "August 28, 2023",
      category: "Pakistan Rangers",
      subject: "General Ability",
      downloadUrl: "#"
    },
    {
      id: 12,
      title: "Intelligence Bureau (IB) Assistant Director Test",
      date: "June 18, 2023",
      category: "IB",
      subject: "Intelligence Services",
      downloadUrl: "#"
    },
    {
      id: 13,
      title: "GHQ Civilian Staff Recruitment Paper",
      date: "July 25, 2023",
      category: "GHQ",
      subject: "Military Administration",
      downloadUrl: "#"
    },
    {
      id: 14,
      title: "NTDC Assistant Engineer Paper",
      date: "May 10, 2023",
      category: "NTDC",
      subject: "Electrical Engineering",
      downloadUrl: "#"
    },
    {
      id: 15,
      title: "ETEA Engineering College Test",
      date: "April 30, 2023",
      category: "ETEA",
      subject: "Engineering",
      downloadUrl: "#"
    },
    {
      id: 16,
      title: "Airport Security Force (ASF) Constable Test",
      date: "June 5, 2023",
      category: "ASF",
      subject: "Security Services",
      downloadUrl: "#"
    },
    {
      id: 17,
      title: "Federal Investigation Agency (FIA) Inspector Test",
      date: "March 22, 2023",
      category: "FIA",
      subject: "Criminal Investigation",
      downloadUrl: "#"
    },
    {
      id: 18,
      title: "Islamabad Police Sub-Inspector Test",
      date: "February 15, 2023",
      category: "Islamabad Police",
      subject: "Law Enforcement",
      downloadUrl: "#"
    },
    {
      id: 19,
      title: "HEC Scholarship Aptitude Test",
      date: "April 12, 2023",
      category: "HEC",
      subject: "Aptitude Test",
      downloadUrl: "#"
    },
    {
      id: 20,
      title: "Pakistan Army Captain Commission Test",
      date: "May 18, 2023",
      category: "Pakistan Army",
      subject: "Military Selection",
      downloadUrl: "#"
    },
    {
      id: 21,
      title: "Pakistan Navy Officer Test",
      date: "June 20, 2023",
      category: "Pakistan Navy",
      subject: "Naval Selection",
      downloadUrl: "#"
    },
    {
      id: 22,
      title: "Pakistan Air Force Pilot Aptitude Test",
      date: "July 5, 2023",
      category: "Pakistan Air Force",
      subject: "Aviation Aptitude",
      downloadUrl: "#"
    },
    {
      id: 23,
      title: "Lecturer in Economics Test Paper",
      date: "August 10, 2023",
      category: "Lecturers",
      subject: "Economics",
      downloadUrl: "#"
    },
    {
      id: 24,
      title: "CSS Compulsory Subjects MCQs Collection",
      date: "January 15, 2023",
      category: "CSS",
      subject: "Compulsory Subjects",
      downloadUrl: "#"
    },
    {
      id: 25,
      title: "STS (Siba Testing Service) General Knowledge",
      date: "March 25, 2023",
      category: "STS",
      subject: "General Knowledge",
      downloadUrl: "#"
    }
  ];

  const categories = [...new Set(pastPapers.map(paper => paper.category))].sort();

  const filteredPapers = pastPapers.filter(paper => 
    (paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.subject.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (categoryFilter === "all" || paper.category === categoryFilter)
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
            <div className="flex-1">
              <Input
                placeholder="Search papers by title, category, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="md:w-auto whitespace-nowrap">
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
