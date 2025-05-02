
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Briefcase, Search, CalendarDays, Upload, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ContentItem } from "@/interfaces/content";
import { getContentByCategory } from "@/services/contentService";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

const Jobs = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchJobs = () => {
      try {
        const items = getContentByCategory('job');
        setJobs(items);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load jobs. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobs();
  }, []);

  // Filter jobs based on search query
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.department && job.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (job.governmentLevel && job.governmentLevel.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (job.cadre && job.cadre.toLowerCase().includes(searchQuery.toLowerCase())) ||
    job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, organization, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <Button onClick={() => navigate("/submit-content")} className="flex gap-2">
              <Upload className="h-4 w-4" />
              Submit Job
            </Button>
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
                    <div className="h-4 bg-muted rounded-md w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded-md w-2/3 mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-muted rounded-full w-16"></div>
                      <div className="h-6 bg-muted rounded-full w-20"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-muted rounded-md w-1/3"></div>
                      <div className="h-10 bg-muted rounded-md w-24"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <p className="text-primary">{job.department || 'Department not specified'}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          {job.governmentLevel && (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                              {job.governmentLevel}
                            </span>
                          )}
                          {job.cadre && (
                            <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs">
                              {job.cadre}
                            </span>
                          )}
                          <span className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            Deadline: {formatDate(job.deadline)}
                          </span>
                        </div>
                        
                        {job.description && (
                          <p className="mt-3 text-muted-foreground line-clamp-2">{job.description}</p>
                        )}
                        
                        {job.tags && job.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {job.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 self-end">
                        {job.fileUrl ? (
                          <Button size="sm" asChild>
                            <a href={job.fileUrl} target="_blank" rel="noopener noreferrer">
                              View Details
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled={!job.description}>
                            {job.description ? "See Above" : "No Details"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No job announcements found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search query or check back later for more opportunities"
                  : "Be the first to submit a job announcement"}
              </p>
              <Button onClick={() => navigate('/submit-content')} className="mt-4">
                Submit Job
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
