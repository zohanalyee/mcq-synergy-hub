
import { v4 as uuidv4 } from 'uuid';
import { ContentItem } from '@/interfaces/content';

export const getSampleContent = (): ContentItem[] => {
  return [
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
};
