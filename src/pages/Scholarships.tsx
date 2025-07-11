
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Award, Calendar, ExternalLink, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentItem } from "@/interfaces/content";
import { getContentByCategory } from "@/services/contentService";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import QuickSubmissionDialog from "@/components/admin/QuickSubmissionDialog";

const Scholarships = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        setIsLoading(true);
        const items = await getContentByCategory('scholarship');
        console.log("Fetched scholarships from Supabase:", items);
        setScholarships(items);
      } catch (error) {
        console.error("Error fetching scholarships:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load scholarships. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScholarships();
  }, []);
  
  const filteredScholarships = scholarships.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.institution && item.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.scholarshipType && item.scholarshipType.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Scholarships", href: "/scholarships", isCurrent: true },
  ];

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
      <Header />
      
      <div className="container px-4 mx-auto pt-28 pb-16">
        <PageBreadcrumb items={breadcrumbItems} />
        
        <div className="mt-6 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold flex items-center"
          >
            <Award className="mr-2 h-8 w-8 text-primary" /> Scholarships
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Discover scholarship opportunities to fund your education
          </motion.p>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            {user && isAdmin && (
              <div className="flex gap-2">
                <QuickSubmissionDialog 
                  category="scholarship" 
                  buttonText="Add Scholarship"
                />
              </div>
            )}
            {!user && (
              <Button onClick={() => navigate("/auth")} variant="outline" className="flex gap-2">
                Sign In to Submit
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
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
          ) : filteredScholarships.length > 0 ? (
            filteredScholarships.map((scholarship, index) => (
              <motion.div
                key={scholarship.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-1">{scholarship.title}</h2>
                    
                    <div className="flex flex-wrap items-center text-muted-foreground text-sm mb-3 gap-3">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Deadline: {formatDate(scholarship.deadline)}
                      </span>
                      
                      {scholarship.institution && (
                        <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs">
                          {scholarship.institution}
                        </span>
                      )}
                      
                      {scholarship.scholarshipType && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                          {scholarship.scholarshipType}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-5 whitespace-pre-wrap line-clamp-3">
                      {scholarship.description}
                    </p>
                    
                    {scholarship.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {scholarship.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="px-2 py-1 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 justify-between">
                      {scholarship.imageUrl && (
                        <img 
                          src={scholarship.imageUrl} 
                          alt="Scholarship" 
                          className="max-h-32 rounded-md object-cover" 
                        />
                      )}
                      
                      <div className="flex-1 flex justify-end">
                        {scholarship.fileUrl ? (
                          <Button asChild>
                            <a href={scholarship.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              View Details
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline">View Details</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No scholarships found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery 
                  ? "No scholarships match your search criteria. Try adjusting your search."
                  : "Be the first to submit a scholarship!"}
              </p>
              {user ? (
                <Button onClick={() => navigate("/submit-content")} className="mt-6">
                  Submit a Scholarship
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")} className="mt-6">
                  Sign In to Submit
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scholarships;
