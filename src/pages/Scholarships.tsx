
import { useState } from 'react';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Award, Search, Globe, CalendarClock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const Scholarships = () => {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Sample scholarships data - replace with your actual data
  const scholarships = [
    {
      id: 1,
      title: "Fulbright Scholarship Program 2025-2026",
      organization: "USEFP",
      country: "United States",
      deadline: "May 15, 2025",
      level: "Masters/PhD",
      type: "International",
      url: "#",
      featured: true
    },
    {
      id: 2,
      title: "HEC Need-Based Scholarships",
      organization: "Higher Education Commission",
      country: "Pakistan",
      deadline: "June 30, 2025",
      level: "Undergraduate",
      type: "National",
      url: "#",
      featured: true
    },
    {
      id: 3,
      title: "Erasmus Mundus Scholarship",
      organization: "European Union",
      country: "Multiple EU Countries",
      deadline: "April 28, 2025",
      level: "Masters",
      type: "International",
      url: "#",
      featured: false
    },
    {
      id: 4,
      title: "University Merit Scholarship",
      organization: "Punjab University",
      country: "Pakistan",
      deadline: "July 15, 2025",
      level: "Undergraduate/Graduate",
      type: "National",
      url: "#",
      featured: false
    },
    {
      id: 5,
      title: "DAAD Scholarship",
      organization: "German Academic Exchange Service",
      country: "Germany",
      deadline: "September 1, 2025",
      level: "Masters/PhD",
      type: "International",
      url: "#",
      featured: false
    }
  ];

  // Filter scholarships based on search query and active tab
  const filteredScholarships = scholarships.filter(scholarship => 
    (scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.country.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (activeTab === "all" || scholarship.type.toLowerCase() === activeTab)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header theme={theme} setTheme={setTheme} />
      
      <div className="container px-4 mx-auto pt-28 pb-16">
        <PageBreadcrumb 
          items={[
            { label: 'Home', path: '/' },
            { label: 'Scholarships', path: '/scholarships' },
          ]} 
        />
        
        <div className="mt-6 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold flex items-center"
          >
            <Award className="mr-2 h-8 w-8 text-primary" /> Scholarship Announcements
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Explore educational funding opportunities available for students at all levels
          </motion.p>
          
          <div className="mt-8 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex-1">
                <Input
                  placeholder="Search scholarships by title, organization, country..."
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
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 md:mt-0">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="international">International</TabsTrigger>
                <TabsTrigger value="national">National</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-8">
          {filteredScholarships.length > 0 ? (
            filteredScholarships.map((scholarship, index) => (
              <motion.div
                key={scholarship.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={scholarship.featured ? "border-primary/50 shadow-md" : ""}>
                  <CardContent className="p-0">
                    <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-semibold text-lg">{scholarship.title}</h3>
                              {scholarship.featured && (
                                <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-700">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-primary">{scholarship.organization}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {scholarship.country}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <CalendarClock className="h-3 w-3 mr-1" />
                            Deadline: {scholarship.deadline}
                          </span>
                          <span className="mx-2">•</span>
                          <Badge variant="outline" className="text-xs">
                            {scholarship.level}
                          </Badge>
                          <Badge variant={scholarship.type === "International" ? "default" : "secondary"} className="text-xs">
                            {scholarship.type}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <a href={scholarship.url} target="_blank" rel="noopener noreferrer">
                          View Details
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Award className="h-16 w-16 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No scholarships found</h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your search query or check back later for more opportunities
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scholarships;
