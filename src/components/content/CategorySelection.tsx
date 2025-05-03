
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ContentCategory } from "@/interfaces/content";
import { Briefcase, FileText, FileUp, GraduationCap, List } from "lucide-react";

interface CategorySelectionProps {
  form: any; // Using any to make it work with react-hook-form
}

const CategorySelection = ({ form }: CategorySelectionProps) => {
  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Content Type</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={(value) => {
                field.onChange(value);
                // Reset form fields when changing category
                form.reset({
                  ...form.getValues(),
                  category: value as ContentCategory
                });
              }}
              defaultValue={field.value}
              className="flex flex-wrap gap-4"
            >
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="scholarship" />
                </FormControl>
                <FormLabel className="font-normal flex items-center">
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Scholarship
                </FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="job" />
                </FormControl>
                <FormLabel className="font-normal flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" />
                  Job
                </FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="mcq" />
                </FormControl>
                <FormLabel className="font-normal flex items-center">
                  <List className="h-4 w-4 mr-1" />
                  MCQs
                </FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="quiz" />
                </FormControl>
                <FormLabel className="font-normal flex items-center">
                  <FileUp className="h-4 w-4 mr-1" />
                  Quiz
                </FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="past_paper" />
                </FormControl>
                <FormLabel className="font-normal flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Past Paper
                </FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CategorySelection;
