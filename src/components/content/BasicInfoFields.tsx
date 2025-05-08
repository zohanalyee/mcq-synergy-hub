
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ContentSubmission } from "@/interfaces/content";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserRole } from "@/contexts/UserRoleContext";

interface BasicInfoFieldsProps {
  form: UseFormReturn<ContentSubmission>;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
}

const BasicInfoFields = ({ form, tags, setTags }: BasicInfoFieldsProps) => {
  const [tagInput, setTagInput] = useState("");
  const { isAdmin } = useUserRole();
  const selectedCategory = form.watch("category");

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        const newTags = [...tags, tagInput.trim()];
        setTags(newTags);
        form.setValue('tags', newTags);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  // Only show visibility options for subjects, mcqs, and quizzes
  const showVisibilityOptions = isAdmin && 
    (selectedCategory === 'mcq' || selectedCategory === 'quiz' || selectedCategory === 'past_paper');

  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter a descriptive title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Provide details about this content" 
                className="min-h-[120px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <FormLabel>Tags</FormLabel>
        <Input
          placeholder="Add tags and press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                {tag}
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Visibility Options for Admin */}
      {showVisibilityOptions && (
        <div className="space-y-4 border rounded-md p-4 bg-muted/20">
          <h3 className="font-medium">Visibility Settings</h3>
          <p className="text-sm text-muted-foreground">Select where this content should appear:</p>
          
          <FormField
            control={form.control}
            name="showInSubjects"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Subject-wise Practice
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Show in the subjects page for regular practice
                  </p>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="showInSyllabus"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Custom Syllabus Builder
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Include in the custom syllabus builder page
                  </p>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="showInMockTests"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Timed Mock Tests
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Make available in the mock tests section
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>
      )}
    </>
  );
};

export default BasicInfoFields;
