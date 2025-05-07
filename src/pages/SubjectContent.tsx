
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Book } from "lucide-react";
import { useEffect, useState, ReactNode } from "react";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import SubjectHeader from "@/components/subject-content/SubjectHeader";
import TopicsList from "@/components/subject-content/TopicsList";
import BackButton from "@/components/subject-content/BackButton";
import { mockTopics } from "@/data/topicsData";

const SubjectContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { title, purpose, color, topicCount } = location.state || {};
  
  // Normalize the title for lookup in our mock data
  const normalizedTitle = title ? title.toLowerCase() : "";
  
  // Get topics for this subject or use empty array if not found
  const topics = mockTopics[normalizedTitle] || [];
  
  // Create a default icon or generic icon for the subject
  const defaultIcon = <Book className="h-6 w-6" style={{ color: color || '#3b82f6' }} />;
  
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
        
        <BackButton />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SubjectHeader 
            title={title || ""}
            purpose={purpose || "reading"}
            color={color || "#3b82f6"}
            icon={defaultIcon}
            topicCount={topicCount || topics.length}
          />
          
          {isLoaded && (
            <TopicsList topics={topics} purpose={purpose || "reading"} />
          )}
        </motion.div>
      </div>
    </>
  );
};

export default SubjectContent;
