
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface PastPaperFieldsProps {
  form: any;
}

const PastPaperFields = ({ form }: PastPaperFieldsProps) => {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="examType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Exam Type</FormLabel>
            <FormControl>
              <Input placeholder="Enter exam type" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="examYear"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Exam Year</FormLabel>
            <FormControl>
              <Input placeholder="Enter exam year" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default PastPaperFields;
