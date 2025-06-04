
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentCategory } from "@/interfaces/content";

interface CategorySelectionProps {
  form: any;
}

const CategorySelection = ({ form }: CategorySelectionProps) => {
  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Content Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="scholarship">Scholarship</SelectItem>
              <SelectItem value="job">Job</SelectItem>
              <SelectItem value="mcq">MCQs</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="past_paper">Past Paper</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Choose the type of content you want to submit
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CategorySelection;
