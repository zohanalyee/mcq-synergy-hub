import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Standardized card sizing utilities
export const cardSizes = {
  sm: "min-h-[180px] max-h-[220px]",
  md: "min-h-[220px] max-h-[280px]",
  lg: "min-h-[280px] max-h-[380px]",
  auto: "min-h-[180px]", // grows with content
} as const;

// Standardized dialog sizing utilities
export const dialogSizes = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

// Standard max height for dialogs with scrollable content
export const dialogMaxHeight = "max-h-[85vh] overflow-y-auto" as const;
