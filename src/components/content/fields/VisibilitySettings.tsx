
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

interface VisibilitySettingsProps {
  form: any;
}

const VisibilitySettings = ({ form }: VisibilitySettingsProps) => {
  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
      <h4 className="font-medium">Content Visibility</h4>
      <p className="text-sm text-muted-foreground">
        Choose where this content should appear in the application
      </p>
      
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="showInSubjects"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Show in Subjects</FormLabel>
                <FormDescription>
                  Display this content in the subjects page and subject-wise practice
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="showInSyllabus"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Show in Custom Syllabus</FormLabel>
                <FormDescription>
                  Include this content in the custom syllabus builder
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="showInMockTests"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Show in Mock Tests</FormLabel>
                <FormDescription>
                  Make this content available in timed mock tests
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default VisibilitySettings;
