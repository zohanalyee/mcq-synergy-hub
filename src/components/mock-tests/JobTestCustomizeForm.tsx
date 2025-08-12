
import { motion } from "framer-motion";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { testCustomizationSchema } from "./TestCard";

interface JobTestCustomizeFormProps {
  testId: number;
  isVisible: boolean;
  defaultQuestions: number;
  defaultDuration: number;
  onSubmit: (data: z.infer<typeof testCustomizationSchema>) => void;
}

export const JobTestCustomizeForm = ({ 
  testId,
  isVisible,
  defaultQuestions,
  defaultDuration,
  onSubmit
}: JobTestCustomizeFormProps) => {
  const form = useForm({
    resolver: zodResolver(testCustomizationSchema),
    defaultValues: {
      difficulty: "medium" as const,
      questionCount: defaultQuestions,
      duration: defaultDuration
    }
  });

  if (!isVisible) return null;

  return (
    <motion.div 
      className="border rounded-lg p-3 mt-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm">Difficulty</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="easy" id={`job-easy-${testId}`} />
                      <FormLabel htmlFor={`job-easy-${testId}`} className="text-green-500 text-sm">Easy</FormLabel>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="medium" id={`job-medium-${testId}`} />
                      <FormLabel htmlFor={`job-medium-${testId}`} className="text-amber-500 text-sm">Medium</FormLabel>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="hard" id={`job-hard-${testId}`} />
                      <FormLabel htmlFor={`job-hard-${testId}`} className="text-red-500 text-sm">Hard</FormLabel>
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
                    <Input type="number" min={5} max={200} {...field} />
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
  );
};
