
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

  const isExpanded = expandedTest === test.id || customizeTest === test.id;

  return (
    <Card className="min-h-[140px] hover:shadow-md transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold line-clamp-1">{test.title}</h3>
        </div>
        
        <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{test.description}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{test.duration}m</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <BookOpen className="h-3 w-3 text-muted-foreground" />
            <span>{test.questions}q</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Award className="h-3 w-3 text-muted-foreground" />
            <span>Cert</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <BarChart2 className="h-3 w-3 text-muted-foreground" />
            <span>Analysis</span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" className="flex items-center flex-1 text-xs" onClick={() => toggleExpandTest(test.id)}>
              {expandedTest === test.id ? (
                <>Topics <ArrowUp className="ml-1 h-3 w-3" /></>
              ) : (
                <>Topics <ArrowDown className="ml-1 h-3 w-3" /></>
              )}
            </Button>
            <Button variant="outline" size="sm" className="flex items-center flex-1 text-xs" onClick={e => toggleCustomizeTest(test.id, e)}>
              <SlidersHorizontal className="mr-1 h-3 w-3" /> Custom
            </Button>
          </div>
          
          {expandedTest === test.id && test.topics && (
            <motion.div 
              className="border rounded-lg p-3 bg-secondary/20 mt-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h4 className="text-sm font-medium mb-2">Select topics to include:</h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
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
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">At least one topic must be selected.</p>
              </div>
            </motion.div>
          )}
          
          {customizeTest === test.id && (
            <motion.div 
              className="border rounded-lg p-3 mt-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
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
          
          {customizeTest !== test.id && (
            <Button className="w-full" size="sm" onClick={() => handleStartTest(test)}>
              Start Test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
