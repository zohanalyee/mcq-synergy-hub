
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { X } from "lucide-react";
import { useEffect } from "react";

interface ToastOptions {
  title?: string;
  description: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
  autoClose?: boolean;
}

export const useEnhancedToast = () => {
  const { toast: hookToast } = useToast();

  const showToast = (options: ToastOptions) => {
    const {
      title,
      description,
      variant = "default",
      duration = 2000,
      autoClose = true
    } = options;

    // Use sonner for better UX with auto-close and manual close
    if (variant === "success") {
      sonnerToast.success(title || "Success", {
        description,
        duration: autoClose ? duration : Infinity,
        action: autoClose ? undefined : {
          label: <X className="w-4 h-4" />,
          onClick: () => sonnerToast.dismiss(),
        },
        dismissible: true,
      });
    } else if (variant === "destructive") {
      sonnerToast.error(title || "Error", {
        description,
        duration: autoClose ? duration : Infinity,
        action: autoClose ? undefined : {
          label: <X className="w-4 h-4" />,
          onClick: () => sonnerToast.dismiss(),
        },
        dismissible: true,
      });
    } else {
      sonnerToast(title || "Notification", {
        description,
        duration: autoClose ? duration : Infinity,
        action: autoClose ? undefined : {
          label: <X className="w-4 h-4" />,
          onClick: () => sonnerToast.dismiss(),
        },
        dismissible: true,
      });
    }
  };

  return { showToast };
};
