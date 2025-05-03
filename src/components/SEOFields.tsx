
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SEOFieldsProps {
  form: any; // Using any to make it work with react-hook-form
}

const SEOFields = ({ form }: SEOFieldsProps) => {
  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
      <h3 className="text-lg font-medium">SEO Options</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Optimize your content for search engines (optional)
      </p>

      <FormField
        control={form.control}
        name="metaTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meta Title</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter meta title (recommended: 50-60 characters)" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              {field.value?.length || 0}/60 characters
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="metaDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meta Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter meta description (recommended: 150-160 characters)" 
                {...field} 
                className="resize-none h-20"
              />
            </FormControl>
            <FormDescription>
              {field.value?.length || 0}/160 characters
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="metaKeywords"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meta Keywords</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter keywords separated by commas" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Example: scholarship, education, university
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

export default SEOFields;
