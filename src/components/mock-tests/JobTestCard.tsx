
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SyllabusItem } from "@/data/jobTestsData";
import { testCustomizationSchema } from "./TestCard";
import { JobTestDetails } from "./JobTestDetails";
import { JobTestControls } from "./JobTestControls";
import { JobTestSyllabus } from "./JobTestSyllabus";
import { JobTestCustomizeForm } from "./JobTestCustomizeForm";
import * as z from "zod";

export type JobTestCardProps = {
  test: {
    id: number;
    title: string;
    description: string;
    organization: string;
    duration: number;
    questions: number;
    syllabus: SyllabusItem[];
  };
  expandedJobTest: number | null;
  customizeJobTest: number | null;
  toggleExpandJobTest: (testId: number) => void;
  toggleCustomizeJobTest: (testId: number, event: React.MouseEvent) => void;
  handleStartJobTest: (test: any, settings?: any) => void;
};

export const JobTestCard = ({
  test,
  expandedJobTest,
  customizeJobTest,
  toggleExpandJobTest,
  toggleCustomizeJobTest,
  handleStartJobTest
}: JobTestCardProps) => {
  const handleSubmitJobCustomization = (data: z.infer<typeof testCustomizationSchema>) => {
    handleStartJobTest(test, data);
  };

  const handleStartTest = () => {
    handleStartJobTest(test);
  };

  const isExpanded = expandedJobTest === test.id;
  const isCustomizing = customizeJobTest === test.id;

  return (
    <Card className={`min-h-[140px] hover:shadow-md transition-all duration-300 ${(isExpanded || isCustomizing) ? 'h-auto' : 'h-[140px]'}`}>
      <CardContent className="p-4">
        <JobTestDetails 
          title={test.title}
          description={test.description}
          organization={test.organization}
          duration={test.duration}
          questions={test.questions}
        />
        
        <JobTestControls
          testId={test.id}
          isSyllabusExpanded={isExpanded}
          isCustomizeExpanded={isCustomizing}
          onToggleSyllabus={toggleExpandJobTest}
          onToggleCustomize={toggleCustomizeJobTest}
          onStartTest={handleStartTest}
          showStartButton={!isCustomizing}
        />
        
        <JobTestSyllabus 
          isVisible={isExpanded}
          syllabus={test.syllabus}
        />
        
        <JobTestCustomizeForm
          testId={test.id}
          isVisible={isCustomizing}
          defaultQuestions={test.questions}
          defaultDuration={test.duration}
          onSubmit={handleSubmitJobCustomization}
        />
      </CardContent>
    </Card>
  );
};
