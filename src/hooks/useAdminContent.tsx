
import { useState, useMemo } from 'react';
import { ContentItem } from '@/interfaces/content';
import { getAllContent } from '@/services/contentService';

export const useAdminContent = (defaultTab: string = 'submit-content') => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const getAllContentItems = (): ContentItem[] => {
    try {
      return getAllContent();
    } catch (error) {
      console.error('Error fetching content:', error);
      return [];
    }
  };

  const getCurrentContent = (): ContentItem[] => {
    const allContent = getAllContentItems();
    
    switch (activeTab) {
      case 'pending':
        return allContent.filter(item => item.status === 'pending');
      case 'approved':
        return allContent.filter(item => item.status === 'approved');
      case 'rejected':
        return allContent.filter(item => item.status === 'rejected');
      case 'scholarship':
        return allContent.filter(item => item.category === 'scholarship');
      case 'mcq':
        return allContent.filter(item => item.category === 'mcq');
      case 'quiz':
        return allContent.filter(item => item.category === 'quiz');
      case 'job':
        return allContent.filter(item => item.category === 'job');
      case 'past_paper':
        return allContent.filter(item => item.category === 'past_paper');
      default:
        return [];
    }
  };

  const getContentStatistics = () => {
    const allContent = getAllContentItems();
    
    return {
      totalCount: allContent.length,
      pendingCount: allContent.filter(item => item.status === 'pending').length,
      scholarshipCount: allContent.filter(item => item.category === 'scholarship').length,
      mcqCount: allContent.filter(item => item.category === 'mcq').length,
      quizCount: allContent.filter(item => item.category === 'quiz').length,
      jobCount: allContent.filter(item => item.category === 'job').length,
      pastPaperCount: allContent.filter(item => item.category === 'past_paper').length,
    };
  };

  const getBulkActionStatistics = () => {
    const allContent = getAllContentItems();
    const recentContent = allContent.filter(item => {
      const createdAt = new Date(item.createdAt);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      return createdAt > dayAgo;
    });

    return {
      recentUploads: recentContent.length,
      pendingReview: allContent.filter(item => item.status === 'pending').length,
      autoApprovalCandidate: allContent.filter(item => 
        item.status === 'pending' && 
        item.metaTitle && 
        item.metaDescription &&
        item.tags && 
        item.tags.length > 0
      ).length
    };
  };

  return {
    activeTab,
    setActiveTab,
    getCurrentContent,
    getContentStatistics,
    getBulkActionStatistics,
  };
};
