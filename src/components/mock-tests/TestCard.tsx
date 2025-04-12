
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Award, BarChart2, BookOpen, ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const testCustomizationSchema = z.object({
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  questionCount: z.coerce.number().min(5).max(100),
  duration: z.coerce.number().min(5).max(180)
});

export type TestCardProps = {
  test: {
    id: number;
    title: string;
    description: string;
    category?: string;
    difficulty: string;
    duration: number;
    questions: number;
    topics?: string[];
  };
  expandedTest: number | null;
  customizeTest: number | null;
  selectedTopics: Record<number, string[]>;
  toggleExpandTest: (testId: number) => void;
  toggleCustomizeTest: (testId: number, event: React.MouseEvent) => void;
  handleTopicToggle: (testId: number, topic: string) => void;
  isTopicSelected: (testId: number, topic: string) => boolean;
  handleStartTest: (test: any, settings?: any) => void;
};

export const TestCard = ({
  test,
  expandedTest,
  customizeTest,
  selectedTopics,
  toggleExpandTest,
  toggleCustomizeTest,
  handleTopicToggle,
  isTopicSelected,
  handleStartTest
}: TestCardProps) => {
  const form = useForm({
    resolver: zodResolver(testCustomizationSchema),
    defaultValues: {
      difficulty: test.difficulty as "Easy" | "Medium" | "Hard",
      questionCount: test.questions,
      duration: test.duration
    }
  });

  const handleSubmitCustomization = (data: z.infer<typeof testCustomizationSchema>) => {
    handleStartTest(test, data);
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">{test.title}</h3>
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
            <Award className="h-4 w-4 text-muted-foreground" />
            <span>Certification</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <span>Detailed analysis</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" className="flex items-center w-1/2 justify-center" onClick={() => toggleExpandTest(test.id)}>
              {expandedTest === test.id ? (
                <>Hide Topics <ArrowUp className="ml-2 h-4 w-4" /></>
              ) : (
                <>Show Topics <ArrowDown className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <Button variant="outline" className="flex items-center w-1/2 ml-2 justify-center" onClick={e => toggleCustomizeTest(test.id, e)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Customize
            </Button>
          </div>
          
          {expandedTest === test.id && test.topics && (
            <motion.div 
              className="border rounded-lg p-3 bg-secondary/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="text-sm font-medium mb-2">Select topics to include:</h4>
              <div className="space-y-2">
                {test.topics.map((topic: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`topic-${test.id}-${index}`}
                      checked={isTopicSelected(test.id, topic)}
                      onCheckedChange={() => handleTopicToggle(test.id, topic)}
                      disabled={isTopicSelected(test.id, topic) && (selectedTopics[test.id]?.length || 0) <= 1}
                    />
                    <label htmlFor={`topic-${test.id}-${index}`} className="text-sm cursor-pointer">
                      {topic}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">At least one topic must be selected.</p>
              </div>
            </motion.div>
          )}
          
          {customizeTest === test.id && (
            <motion.div 
              className="border rounded-lg p-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitCustomization)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-sm">Difficulty</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Easy" id={`easy-${test.id}`} />
                              <FormLabel htmlFor={`easy-${test.id}`} className="text-green-500 text-sm">Easy</FormLabel>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Medium" id={`medium-${test.id}`} />
                              <FormLabel htmlFor={`medium-${test.id}`} className="text-amber-500 text-sm">Medium</FormLabel>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="Hard" id={`hard-${test.id}`} />
                              <FormLabel htmlFor={`hard-${test.id}`} className="text-red-500 text-sm">Hard</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="questionCount"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-sm">Questions</FormLabel>
                          <FormControl>
                            <Input type="number" min={5} max={100} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-sm">Duration (mins)</FormLabel>
                          <FormControl>
                            <Input type="number" min={5} max={180} {...field} />
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
          
          {!customizeTest && (
            <Button className="w-full" onClick={() => handleStartTest(test)}>
              Start Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
