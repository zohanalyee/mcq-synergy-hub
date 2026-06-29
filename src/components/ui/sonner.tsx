import { Toaster as Sonner } from "sonner"
import useTheme from "@/components/ThemeSwitcher"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Single, brand-aligned toast system for the whole app.
 * Colors come exclusively from design tokens (no `richColors`, no hardcoded hex).
 * - success  -> primary (brand blue)
 * - error    -> destructive
 * - info     -> accent
 * - warning  -> accent (no dedicated warning token defined)
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-brand group-[.toaster]:rounded-xl",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
          closeButton:
            "group-[.toast]:bg-card group-[.toast]:text-muted-foreground group-[.toast]:border-border",
          success:
            "group-[.toaster]:border-primary/40 [&_[data-icon]]:text-primary",
          error:
            "group-[.toaster]:border-destructive/40 [&_[data-icon]]:text-destructive",
          info:
            "group-[.toaster]:border-accent/40 [&_[data-icon]]:text-accent",
          warning:
            "group-[.toaster]:border-accent/40 [&_[data-icon]]:text-accent",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
