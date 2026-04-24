
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, BookOpen } from "lucide-react";

interface TopicQuizzesTabProps {
  quizzes: any[];
  isLoaded: boolean;
  searchQuery: string;
}

export const TopicQuizzesTab = ({ quizzes, isLoaded, searchQuery }: TopicQuizzesTabProps) => {
  
  // Filter quizzes based on search query
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (!isLoaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-1/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  if (filteredQuizzes.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No quizzes found</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery 
            ? "No quizzes match your search criteria. Try another search."
            : "No topic quizzes available yet. Check back soon!"}
        </p>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {filteredQuizzes.map((quiz, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <Badge className="w-fit mb-2">{quiz.topic}</Badge>
              <CardTitle className="text-lg">{quiz.title}</CardTitle>
            </CardHeader>
            
            <CardContent className="py-2 flex-grow">
              <p className="text-muted-foreground text-sm">{quiz.description}</p>
              
              <div className="flex items-center gap-2 mt-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {quiz.timeLimit} min • {quiz.questionCount} questions
                </span>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button asChild className="w-full">
                <Link to={`/quiz/${quiz.id}`}>Start Quiz</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};
