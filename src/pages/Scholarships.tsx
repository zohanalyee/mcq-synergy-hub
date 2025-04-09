
import { useState } from 'react';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { GraduationCap, Search, CalendarDays } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const Scholarships = () => {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sample scholarships data - replace with your actual data
  const scholarships = [
    {
      id: 1,
      title: "Fully Funded International Scholarship",
      organization: "HEC Pakistan",
      location: "Worldwide",
      deadline: "May 15, 2025",
      degree: "MS/PhD",
      eligibility: "16 years of education with 3.0 CGPA",
      amount: "Full tuition + stipend",
      featured: true
    },
    {
      id: 2,
      title: "National Merit Scholarship",
      organization: "Ministry of Education",
      location: "Pakistan",
      deadline: "April 30, 2025",
      degree: "Undergraduate",
      eligibility: "80% or above in intermediate",
      amount: "Rs. 25,000/month",
      featured: false
    },
    {
      id: 3,
      title: "Engineering Excellence Scholarship",
      organization: "Pakistan Engineering Council",
      location: "Pakistan",
      deadline: "June 10, 2025",
      degree: "BE/BSc Engineering",
      eligibility: "First division in FSc",
      amount: "Rs. 15,000/month",
      featured: true
    },
    {
      id: 4,
      title: "Commonwealth Scholarship",
      organization: "Commonwealth Scholarship Commission",
      location: "United Kingdom",
      deadline: "September 15, 2025",
      degree: "Masters/PhD",
      eligibility: "First class degree with relevant experience",
      amount: "Full funding",
      featured: false
    }
  ];

  // Filter scholarships based on search query
  const filteredScholarships = scholarships.filter(scholarship => 
    scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scholarship.degree.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header theme={theme} setTheme={setTheme} />
      
      <div className="container px-4 mx-auto pt-28 pb-16">
        <PageBreadcrumb 
          items={[
            { title: 'Home', href: '/' },
            { title: 'Scholarships', href: '/scholarships', isCurrent: true },
          ]} 
        />
        
        <div className="mt-6 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold flex items-center"
          >
            <GraduationCap className="mr-2 h-8 w-8 text-primary" /> Scholarship Opportunities
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Discover scholarships to fund your education and academic pursuits
          </motion.p>
          
          <div className="mt-8 flex gap-4 max-w-xl">
            <div className="flex-1">
              <Input
                placeholder="Search scholarships by title, organization, location..."
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
                            <h3 className="font-semibold text-lg">{scholarship.title}</h3>
                            <p className="text-primary">{scholarship.organization}</p>
                          </div>
                          {scholarship.featured && (
                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>{scholarship.location}</span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            Deadline: {scholarship.deadline}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                            {scholarship.degree}
                          </span>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm"><span className="font-medium">Eligibility:</span> {scholarship.eligibility}</p>
                          <p className="text-sm"><span className="font-medium">Amount:</span> {scholarship.amount}</p>
                        </div>
                      </div>
                      <Button size="sm">
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/40" />
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
