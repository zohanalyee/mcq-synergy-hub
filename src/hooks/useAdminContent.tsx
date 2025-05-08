
import { useState, useEffect } from "react";
import { ContentItem } from "@/interfaces/content";
import { getAllContent } from "@/services/baseContentService";

export const useAdminContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState("pending");

  // Load content
  useEffect(() => {
    const loadContent = () => {
      try {
        const allContent = getAllContent();
        setContent(allContent);
        console.log("Loaded content items:", allContent.length);
      } catch (error) {
        console.error("Error loading content:", error);
      }
    };

    loadContent();
  }, []);

  // Get content for the current active tab
  const getCurrentContent = () => {
    if (activeTab === 'pending' || activeTab === 'approved' || activeTab === 'rejected') {
      return filterContentByStatus(activeTab);
    } else if (['scholarship', 'job', 'mcq', 'past_paper', 'quiz'].includes(activeTab)) {
      return filterContentByCategory(activeTab);
    }
    
    return content; // Default to all content
  };

  // Filter content based on status
  const filterContentByStatus = (status: string) => {
    if (status === 'all') return content;
    return content.filter(item => item.status === status);
  };

  // Filter content based on category
  const filterContentByCategory = (category: string) => {
    return content.filter(item => item.category === category);
  };

  // Calculate statistics
  const getContentStatistics = () => {
    const pendingCount = content.filter(item => item.status === 'pending').length;
    const scholarshipCount = content.filter(item => item.category === 'scholarship').length;
    const mcqCount = content.filter(item => item.category === 'mcq').length;
    const quizCount = content.filter(item => item.category === 'quiz').length;
    
    return {
      pendingCount,
      scholarshipCount,
      mcqCount,
      quizCount,
      totalCount: content.length
    };
  };

  return {
    content,
    setContent,
    activeTab,
    setActiveTab,
    getCurrentContent,
    getContentStatistics
  };
};
