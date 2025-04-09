import { useState } from 'react';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Briefcase, Search, CalendarDays } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const Jobs = () => {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sample jobs data - replace with your actual data
  const jobs = [
    {
      id: 1,
      title: "Subject Specialist (Mathematics)",
      organization: "PPSC",
      location: "Punjab",
      deadline: "April 15, 2025",
      postedDate: "March 10, 2025",
      type: "Government",
      url: "#",
      featured: true
    },
    {
      id: 2,
      title: "Assistant Professor (Physics)",
      organization: "University of Punjab",
      location: "Lahore",
      deadline: "April 20, 2025",
      postedDate: "March 18, 2025",
      type: "Education",
      url: "#",
      featured: false
    },
    {
      id: 3,
      title: "Data Scientist",
      organization: "Tech Solutions Inc.",
      location: "Islamabad",
      deadline: "April 30, 2025",
      postedDate: "March 15, 2025",
      type: "Private",
      url: "#",
      featured: true
    },
    {
      id: 4,
      title: "Medical Officer",
      organization: "Health Department",
      location: "Karachi",
      deadline: "May 10, 2025",
      postedDate: "March 20, 2025",
      type: "Government",
      url: "#",
      featured: false
    }
  ];

  // Filter jobs based on search query
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header theme={theme} setTheme={setTheme} />
      
      <div className="container px-4 mx-auto pt-28 pb-16">
        <PageBreadcrumb 
          items={[
            { title: 'Home', href: '/' },
            { title: 'Jobs', href: '/jobs', isCurrent: true },
          ]} 
        />
        
        <div className="mt-6 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold flex items-center"
          >
            <Briefcase className="mr-2 h-8 w-8 text-primary" /> Job Announcements
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Browse latest job opportunities from various organizations across the country
          </motion.p>
          
          <div className="mt-8 flex gap-4 max-w-xl">
            <div className="flex-1">
              <Input
                placeholder="Search jobs by title, organization, location..."
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
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={job.featured ? "border-primary/50 shadow-md" : ""}>
                  <CardContent className="p-0">
                    <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <p className="text-primary">{job.organization}</p>
                          </div>
                          {job.featured && (
                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>{job.location}</span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            Deadline: {job.deadline}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                            {job.type}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
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
              <Briefcase className="h-16 w-16 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No job announcements found</h3>
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

export default Jobs;
