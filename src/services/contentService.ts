import { ContentItem, ContentStatus, ContentSubmission, MCQItem } from "@/interfaces/content";
import { v4 as uuidv4 } from 'uuid';

// Mock storage - in a real app, this would be a database
let contentItems: ContentItem[] = [];

// Load initial data from localStorage if available
const initializeData = () => {
  try {
    const savedContent = localStorage.getItem('contentItems');
    if (savedContent) {
      contentItems = JSON.parse(savedContent);
    }
    
    // If no content exists, add some example items
    if (contentItems.length === 0) {
      contentItems = [
        {
          id: uuidv4(),
          title: "Sample Scholarship",
          description: "This is a sample scholarship description.",
          category: "scholarship",
          tags: ["education", "undergraduate"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "approved",
          createdBy: "system",
          scholarshipType: "undergraduate",
          institution: "Sample University",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          id: uuidv4(),
          title: "Sample Job Posting",
          description: "This is a sample job posting description.",
          category: "job",
          tags: ["IT", "remote"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "approved",
          createdBy: "system",
          cadre: "grade-3",
          department: "Information Technology",
          governmentLevel: "federal",
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          id: uuidv4(),
          title: "General Knowledge MCQ",
          description: "Test your general knowledge with these MCQs",
          category: "mcq",
          tags: ["general knowledge", "quiz"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "approved",
          createdBy: "system",
          subject: "General Knowledge",
          topic: "Pakistan Affairs",
          questions: [
            {
              question: "What is the capital of Pakistan?",
              optionA: "Karachi",
              optionB: "Lahore",
              optionC: "Islamabad",
              optionD: "Peshawar",
              correctOption: "C",
              subject: "General Knowledge",
              topic: "Pakistan Affairs",
              difficulty: "Easy",
              explanation: "Islamabad became the capital in 1967."
            },
            {
              question: "Who wrote Pakistan's national anthem?",
              optionA: "Hafeez Jullundri",
              optionB: "Faiz Ahmad Faiz",
              optionC: "Allama Iqbal", 
              optionD: "Josh Malihabadi",
              correctOption: "A",
              subject: "General Knowledge",
              topic: "History",
              difficulty: "Medium",
              explanation: "Written by Hafeez Jullundri in 1952."
            }
          ]
        },
        {
          id: uuidv4(),
          title: "Science Quiz",
          description: "Test your knowledge of basic science concepts",
          category: "quiz",
          tags: ["science", "education"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "approved",
          createdBy: "system",
          subject: "Science",
          topic: "General Science",
          questions: [
            {
              question: "H2O is the chemical formula for?",
              optionA: "Hydrogen",
              optionB: "Water",
              optionC: "Oxygen",
              optionD: "Salt",
              correctOption: "B",
              subject: "Science",
              topic: "Chemistry",
              difficulty: "Easy",
              explanation: "H2O means 2 Hydrogen atoms and 1 Oxygen atom."
            }
          ],
          timeLimit: 30,
          marks: 10
        }
      ];
      saveToStorage();
    }
  } catch (error) {
    console.error("Error initializing content data:", error);
    contentItems = [];
  }
};

// Save current state to localStorage
const saveToStorage = () => {
  try {
    localStorage.setItem('contentItems', JSON.stringify(contentItems));
  } catch (error) {
    console.error("Error saving content to localStorage:", error);
  }
};

// Initialize data when module loads
initializeData();

export const getAllContent = () => {
  return [...contentItems];
};

export const getApprovedContent = () => {
  return contentItems.filter(item => item.status === 'approved');
};

export const getContentByCategory = (category: string) => {
  return contentItems.filter(item => 
    item.status === 'approved' && 
    item.category === category
  );
};

// Get content by subject and topic
export const getContentBySubjectAndTopic = (category: string, subject?: string, topic?: string) => {
  return contentItems.filter(item => {
    const categoryMatch = item.status === 'approved' && item.category === category;
    const subjectMatch = !subject || item.subject === subject;
    const topicMatch = !topic || item.topic === topic;
    return categoryMatch && subjectMatch && topicMatch;
  });
};

export const getPendingContent = () => {
  return contentItems.filter(item => item.status === 'pending');
};

// Parse CSV data for MCQs
export const parseCSVForMCQs = (csvContent: string): MCQItem[] => {
  const rows = csvContent.split('\n');
  if (rows.length <= 1) {
    throw new Error("CSV file is empty or invalid");
  }
  
  // Remove the header row and process data rows
  const dataRows = rows.slice(1).filter(row => row.trim().length > 0);
  
  return dataRows.map(row => {
    const columns = row.split(',').map(col => col.trim());
    
    if (columns.length < 9) {
      throw new Error("CSV row has insufficient columns");
    }
    
    return {
      question: columns[0],
      optionA: columns[1],
      optionB: columns[2],
      optionC: columns[3],
      optionD: columns[4],
      correctOption: columns[5] as 'A' | 'B' | 'C' | 'D',
      subject: columns[6],
      topic: columns[7],
      difficulty: columns[8] as 'Easy' | 'Medium' | 'Hard',
      explanation: columns.length > 9 ? columns[9] : ''
    };
  });
};

// Parse CSV data for Quizzes
export const parseCSVForQuizzes = (csvContent: string): MCQItem[] => {
  const rows = csvContent.split('\n');
  if (rows.length <= 1) {
    throw new Error("CSV file is empty or invalid");
  }
  
  // Remove the header row and process data rows
  const dataRows = rows.slice(1).filter(row => row.trim().length > 0);
  
  return dataRows.map(row => {
    const columns = row.split(',').map(col => col.trim());
    
    if (columns.length < 10) {
      throw new Error("CSV row has insufficient columns");
    }
    
    return {
      question: columns[1],
      optionA: columns[2],
      optionB: columns[3],
      optionC: columns[4],
      optionD: columns[5],
      correctOption: columns[6] as 'A' | 'B' | 'C' | 'D',
      subject: columns[7],
      topic: columns[8],
      difficulty: 'Medium', // Default difficulty
      explanation: columns.length > 10 ? columns[11] : ''
    };
  });
};

export const submitContent = (submission: ContentSubmission, userId: string = 'anonymous'): ContentItem => {
  // In a real app, you'd upload the files to storage and get URLs back
  // For this demo, we'll just store the file names
  const imageUrl = submission.imageFile ? URL.createObjectURL(submission.imageFile) : undefined;
  const fileUrl = submission.documentFile ? URL.createObjectURL(submission.documentFile) : undefined;

  let questions: MCQItem[] = [];
  
  // Process CSV file for MCQs or Quizzes if present
  if (submission.csvFile && (submission.category === 'mcq' || submission.category === 'quiz')) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvContent = event.target?.result as string;
      try {
        if (submission.category === 'mcq') {
          questions = parseCSVForMCQs(csvContent);
        } else if (submission.category === 'quiz') {
          questions = parseCSVForQuizzes(csvContent);
        }
        // Update the item with questions
        const itemIndex = contentItems.findIndex(item => item.id === newItem.id);
        if (itemIndex !== -1) {
          contentItems[itemIndex].questions = questions;
          saveToStorage();
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
      }
    };
    reader.readAsText(submission.csvFile);
  }

  const newItem: ContentItem = {
    id: uuidv4(),
    ...submission,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending',
    createdBy: userId,
    imageUrl,
    fileUrl,
    questions
  };

  contentItems.push(newItem);
  saveToStorage();
  return newItem;
};

export const updateContentStatus = (
  id: string, 
  status: ContentStatus, 
  updates: Partial<ContentItem> = {}
): ContentItem | null => {
  const index = contentItems.findIndex(item => item.id === id);
  if (index === -1) return null;

  contentItems[index] = {
    ...contentItems[index],
    ...updates,
    status,
    updatedAt: new Date().toISOString()
  };

  saveToStorage();
  return contentItems[index];
};

export const deleteContent = (id: string): boolean => {
  const initialLength = contentItems.length;
  contentItems = contentItems.filter(item => item.id !== id);
  saveToStorage();
  return contentItems.length !== initialLength;
};

// Get all subjects and topics from content items
export const getSubjectsAndTopics = () => {
  const subjects = new Set<string>();
  const topicsBySubject: Record<string, Set<string>> = {};
  
  contentItems
    .filter(item => item.status === 'approved' && (item.category === 'mcq' || item.category === 'quiz'))
    .forEach(item => {
      if (item.subject) {
        subjects.add(item.subject);
        if (!topicsBySubject[item.subject]) {
          topicsBySubject[item.subject] = new Set<string>();
        }
        if (item.topic) {
          topicsBySubject[item.subject].add(item.topic);
        }
      }
    });
  
  return {
    subjects: Array.from(subjects),
    topicsBySubject: Object.fromEntries(
      Object.entries(topicsBySubject).map(([subject, topics]) => [subject, Array.from(topics)])
    )
  };
};
