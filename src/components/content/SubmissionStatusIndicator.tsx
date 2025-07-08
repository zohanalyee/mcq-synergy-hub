import { CheckCircle2, AlertCircle, Clock, FileUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SubmissionStatusIndicatorProps {
  isSubmitting: boolean;
  isUploading?: boolean;
  hasErrors?: boolean;
  errorMessage?: string;
  successMessage?: string;
}

const SubmissionStatusIndicator = ({
  isSubmitting,
  isUploading = false,
  hasErrors = false,
  errorMessage,
  successMessage
}: SubmissionStatusIndicatorProps) => {
  if (isUploading) {
    return (
      <Alert>
        <FileUp className="h-4 w-4 animate-pulse" />
        <AlertDescription>
          Uploading files... Please wait while we process your attachments.
        </AlertDescription>
      </Alert>
    );
  }

  if (isSubmitting) {
    return (
      <Alert>
        <Clock className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Submitting your content... Please wait while we process your submission.
        </AlertDescription>
      </Alert>
    );
  }

  if (hasErrors && errorMessage) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  if (successMessage) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>{successMessage}</AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default SubmissionStatusIndicator;