
import { useState, useMemo } from 'react';
import { ContentItem } from '@/interfaces/content';
import { getAllContent } from '@/services/contentService';

export const useAdminContent = (defaultTab: string = 'pending') => {
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
    };
  };

  return {
    activeTab,
    setActiveTab,
    getCurrentContent,
    getContentStatistics,
  };
};
