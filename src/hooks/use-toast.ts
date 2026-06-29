import * as React from "react";
import { toast as sonnerToast } from "sonner";

/**
 * Compatibility adapter over `sonner`.
 *
 * The app previously had TWO toast systems (Radix `useToast` + `sonner`).
 * They are now consolidated onto a single rendering system: `sonner`.
 * This module preserves the legacy `useToast()` / `toast({ title, description, variant })`
 * API so existing call sites keep working, while everything renders through sonner.
 */

type ToastVariant = "default" | "destructive";

export interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function toast({ title, description, variant, duration, action }: ToastOptions) {
  const message = (title ?? description ?? "") as string;
  const opts: Record<string, unknown> = {};
  if (title && description) opts.description = description;
  if (duration) opts.duration = duration;
  if (action) opts.action = action;

  const id =
    variant === "destructive"
      ? sonnerToast.error(message, opts)
      : sonnerToast(message, opts);

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: () => {
      /* no-op: sonner updates are handled via toast id if needed */
    },
  };
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
    toasts: [] as unknown[],
  };
}

export { useToast, toast };
