
import React from 'react';
import { useQuizManagement } from "@/hooks/useQuizManagement";
import QuizForm from './quiz/QuizForm';
import QuizList from './quiz/QuizList';

const QuizManager = () => {
  const {
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
  } = useQuizManagement();

  return (
    <div className="space-y-6">
      <QuizForm
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        subject={subject}
        setSubject={setSubject}
        topic={topic}
        setTopic={setTopic}
        timeLimit={timeLimit}
        setTimeLimit={setTimeLimit}
        subjects={subjects}
        topics={topics}
        csvFile={csvFile}
        setCsvFile={setCsvFile}
        questions={questions}
        onSaveQuiz={handleSaveQuiz}
      />
      
      <QuizList 
        quizzes={quizzes} 
        onDeleteQuiz={handleDeleteQuiz} 
      />
    </div>
  );
};

export default QuizManager;
