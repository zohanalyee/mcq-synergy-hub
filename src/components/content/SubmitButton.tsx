
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface SubmitButtonProps {
  isSubmitting: boolean;
}

const SubmitButton = ({ isSubmitting }: SubmitButtonProps) => {
  return (
    <Button 
      type="submit" 
      className="min-w-[150px]" 
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <div className="flex items-center gap-2">
          <span className="animate-spin">◌</span>
          <span>Submitting...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>Submit for Review</span>
        </div>
      )}
    </Button>
  );
};

export default SubmitButton;
