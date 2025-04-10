
import React from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CustomSubject } from "./interfaces";
import SubjectCard from "@/components/custom-syllabus/SubjectCard";

interface SubjectListProps {
  customSubjects: CustomSubject[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  toggleSubjectSelection: (subjectTitle: string) => void;
  toggleTopicSelection: (subjectTitle: string, topicId: string) => void;
  toggleSubjectExpansion: (subjectTitle: string) => void;
}

const SubjectList: React.FC<SubjectListProps> = ({
  customSubjects,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  toggleSubjectSelection,
  toggleTopicSelection,
  toggleSubjectExpansion
}) => {
  const filteredSubjects = customSubjects.filter(subject => {
    const categoryMatch = selectedCategory === "All" || subject.category === selectedCategory;
    const searchMatch = subject.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        subject.topics.some(topic => topic.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search subjects and topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer ${
                selectedCategory === category ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject) => (
            <motion.div key={subject.title} variants={item}>
              <SubjectCard
                subject={subject}
                toggleSubjectSelection={toggleSubjectSelection}
                toggleTopicSelection={toggleTopicSelection}
                toggleSubjectExpansion={toggleSubjectExpansion}
              />
            </motion.div>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No subjects or topics match your search criteria.</p>
            <Button onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}>Clear Filters</Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default SubjectList;
