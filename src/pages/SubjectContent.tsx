
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Book, FileText } from "lucide-react";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

// Mock topic content for demonstration
const mockTopics = {
  "mathematics": [
    {
      title: "Algebra Fundamentals",
      content: "Algebra is a branch of mathematics dealing with symbols and the rules for manipulating these symbols. In elementary algebra, those symbols (today written as Latin and Greek letters) represent quantities without fixed values, known as variables. The study of algebra encompasses everything from solving elementary equations to the study of abstractions such as groups, rings, and fields."
    },
    {
      title: "Calculus Basics",
      content: "Calculus is the mathematical study of continuous change, in the same way that geometry is the study of shape and algebra is the study of generalizations of arithmetic operations. It has two major branches: differential calculus and integral calculus."
    },
    {
      title: "Geometry Principles",
      content: "Geometry is a branch of mathematics concerned with questions of shape, size, relative position of figures, and the properties of space. It arose independently in many early cultures as a practical way of dealing with lengths, areas, and volumes."
    }
  ],
  "physics": [
    {
      title: "Classical Mechanics",
      content: "Classical mechanics describes the motion of macroscopic objects, from projectiles to parts of machinery, and astronomical objects, such as spacecraft, planets, stars, and galaxies."
    },
    {
      title: "Electromagnetism",
      content: "Electromagnetism is a branch of physics involving the study of the electromagnetic force, a type of physical interaction that occurs between electrically charged particles."
    }
  ],
  // Add more subjects and topics as needed
};

const SubjectContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { title, purpose, color, icon, topicCount } = location.state || {};
  
  // Normalize the title for lookup in our mock data
  const normalizedTitle = title ? title.toLowerCase() : "";
  
  // Get topics for this subject or use empty array if not found
  const topics = mockTopics[normalizedTitle] || [];
  
  useEffect(() => {
    // If no title was passed in state, redirect to subjects page
    if (!title) {
      navigate("/subjects");
      return;
    }
    
    setIsLoaded(true);
  }, [title, navigate]);
  
  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Subjects", href: "/subjects" },
    { title: title || "Subject Content", href: "#", isCurrent: true },
  ];

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <PageBreadcrumb items={breadcrumbItems} />
        
        <div className="mb-8 flex items-center">
          <Button 
            variant="ghost" 
            className="mr-4" 
            onClick={() => navigate("/subjects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg" style={{ backgroundColor: color ? `${color}20` : '#3b82f620' }}>
              {icon || <Book className="h-6 w-6" style={{ color: color || '#3b82f6' }} />}
            </div>
            <div>
              <h1 className="text-4xl font-bold">{title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <FileText className="h-4 w-4" />
                <span>{purpose === "reading" ? "Reading Material" : "Practice Material"}</span>
                <span>•</span>
                <span>{topicCount || topics.length} Topics</span>
              </div>
            </div>
          </div>
          
          {topics.length > 0 ? (
            <div className="space-y-6">
              {topics.map((topic, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-3">{topic.title}</h3>
                      <p className="text-muted-foreground">{topic.content}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground py-8">
                  Content for this subject is coming soon! Check back later for {purpose === "reading" ? "reading" : "practice"} materials.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default SubjectContent;
