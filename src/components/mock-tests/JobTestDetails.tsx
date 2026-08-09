
import { Clock, Building, BookOpen, Briefcase, GraduationCap } from "lucide-react";
import { SyllabusItem } from "@/data/jobTestsData";
import { markdownExcerpt } from "@/lib/markdownText";


interface JobTestDetailsProps {
  title: string;
  description: string;
  organization: string;
  duration: number;
  questions: number;
}

export const JobTestDetails = ({ 
  title, 
  description, 
  organization, 
  duration, 
  questions 
}: JobTestDetailsProps) => {
  return (
    <>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Building className="h-4 w-4" />
        <span>{organization}</span>
      </div>
      
      <p className="text-muted-foreground text-sm mb-6">{markdownExcerpt(description, 260)}</p>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{duration} mins</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span>{questions} questions</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span>Official Syllabus</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span>Job Preparation</span>
        </div>
      </div>
    </>
  );
};
