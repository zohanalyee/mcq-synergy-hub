
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MCQItem } from "@/interfaces/content";
import { Quiz, addQuiz, getQuizzes, removeQuiz } from "@/services/quizService";
import { getSubjects, getTopics } from "@/services/adminService";

export const useQuizManagement = () => {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [subjects, setSubjects] = useState<{ title: string }[]>([]);
  const [topics, setTopics] = useState<{ title: string }[]>([]);
  const [csvFile, setCsvFile] = useState<File | undefined>(undefined);
  const [questions, setQuestions] = useState<MCQItem[]>([]);

  // Load subjects and quizzes on component mount
  useEffect(() => {
    const loadedSubjects = getSubjects();
    setSubjects(loadedSubjects);
    
    // Load quizzes from localStorage
    const loadedQuizzes = getQuizzes();
    setQuizzes(loadedQuizzes);
  }, []);

  // Update topics when subject changes
  useEffect(() => {
    if (subject) {
      const topicsData = getTopics();
      const subjectTopics = topicsData[subject] || [];
      setTopics(subjectTopics);
      
      // Reset topic when subject changes
      setTopic("");
    }
  }, [subject]);

  const handleSaveQuiz = () => {
    if (!title || !subject) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide a title and select a subject.",
      });
      return;
    }

    const newQuiz = {
      title,
      description,
      subject,
      topic,
      questions: questions,
      timeLimit: timeLimit,
    };

    const savedQuiz = addQuiz(newQuiz);
    if (savedQuiz) {
      setQuizzes([...quizzes, savedQuiz]);

      // Reset form
      resetForm();

      toast({
        title: "Quiz saved",
        description: "The quiz has been saved successfully.",
      });
    }
  };

  const handleDeleteQuiz = (id: string) => {
    if (removeQuiz(id)) {
      setQuizzes(quizzes.filter(quiz => quiz.id !== id));
      
      toast({
        title: "Quiz deleted",
        description: "The quiz has been removed.",
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSubject("");
    setTopic("");
    setTimeLimit(30);
    setQuestions([]);
    setCsvFile(undefined);
  };

  return {
    quizzes,
    title,
    setTitle,
    description,
    setDescription,
    subject,
    setSubject,
    topic,
    setTopic,
    timeLimit,
    setTimeLimit,
    subjects,
    topics,
    csvFile,
    setCsvFile,
    questions,
    handleSaveQuiz,
    handleDeleteQuiz,
    resetForm,
  };
};
