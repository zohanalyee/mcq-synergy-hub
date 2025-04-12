
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Building, BookOpen, Briefcase, GraduationCap, ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SyllabusItem } from "@/data/jobTestsData";
import { testCustomizationSchema } from "./TestCard";

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
  const jobTestForm = useForm({
    resolver: zodResolver(testCustomizationSchema),
    defaultValues: {
      difficulty: "Medium" as const,
      questionCount: test.questions,
      duration: test.duration
    }
  });

  const handleSubmitJobCustomization = (data: z.infer<typeof testCustomizationSchema>) => {
    handleStartJobTest(test, data);
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{test.title}</h3>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Building className="h-4 w-4" />
          <span>{test.organization}</span>
        </div>
        
        <p className="text-muted-foreground text-sm mb-6">{test.description}</p>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{test.duration} mins</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>{test.questions} questions</span>
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
        
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" className="flex items-center w-1/2 justify-center" onClick={() => toggleExpandJobTest(test.id)}>
              {expandedJobTest === test.id ? (
                <>Hide Syllabus <ArrowUp className="ml-2 h-4 w-4" /></>
              ) : (
                <>Show Syllabus <ArrowDown className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <Button variant="outline" className="flex items-center w-1/2 ml-2 justify-center" onClick={e => toggleCustomizeJobTest(test.id, e)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Customize
            </Button>
          </div>
          
          {expandedJobTest === test.id && (
            <motion.div 
              className="border rounded-lg p-3 bg-secondary/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="text-sm font-medium mb-2">Official Test Syllabus:</h4>
              <div className="space-y-2">
                {test.syllabus.map((item: SyllabusItem, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{item.topic}</span>
                    <span className="font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Percentages indicate exam weightage.</p>
              </div>
            </motion.div>
          )}
          
          {customizeJobTest === test.id && (
            <motion.div 
              className="border rounded-lg p-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Form {...jobTestForm}>
                <form onSubmit={jobTestForm.handleSubmit(handleSubmitJobCustomization)} className="space-y-3">
                  <FormField
                    control={jobTestForm.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-sm">Difficulty</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Easy" id={`job-easy-${test.id}`} />
                              <FormLabel htmlFor={`job-easy-${test.id}`} className="text-green-500 text-sm">Easy</FormLabel>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Medium" id={`job-medium-${test.id}`} />
                              <FormLabel htmlFor={`job-medium-${test.id}`} className="text-amber-500 text-sm">Medium</FormLabel>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Hard" id={`job-hard-${test.id}`} />
                              <FormLabel htmlFor={`job-hard-${test.id}`} className="text-red-500 text-sm">Hard</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={jobTestForm.control}
                      name="questionCount"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-sm">Questions</FormLabel>
                          <FormControl>
                            <Input type="number" min={5} max={200} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobTestForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-sm">Duration (mins)</FormLabel>
                          <FormControl>
                            <Input type="number" min={5} max={240} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full">
                    Start Custom Test
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}
          
          {!customizeJobTest && (
            <Button className="w-full" onClick={() => handleStartJobTest(test)}>
              Start Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
