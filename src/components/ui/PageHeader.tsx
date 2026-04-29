import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type PageHeaderTheme =
  | "primary"
  | "violet"
  | "amber"
  | "emerald"
  | "rose"
  | "cyan"
  | "indigo";

interface ThemeTokens {
  surface: string;       // outer container bg gradient
  iconBg: string;        // squircle gradient
  iconRing: string;      // ring around icon
  titleGradient: string; // gradient for title text
  glowA: string;         // top-right blob
  glowB: string;         // bottom-left blob
  accent: string;        // small sparkle accent
}

const THEMES: Record<PageHeaderTheme, ThemeTokens> = {
  primary: {
    surface:
      "from-cyan-50/60 via-background to-blue-50/60 dark:from-cyan-950/30 dark:via-background dark:to-blue-950/30",
    iconBg: "from-primary to-blue-600",
    iconRing: "ring-white/30",
    titleGradient: "from-primary via-blue-600 to-cyan-500",
    glowA: "bg-primary/10",
    glowB: "bg-blue-500/10",
    accent: "text-cyan-500",
  },
  violet: {
    surface:
      "from-violet-50/60 via-background to-fuchsia-50/60 dark:from-violet-950/30 dark:via-background dark:to-fuchsia-950/30",
    iconBg: "from-violet-500 to-fuchsia-600",
    iconRing: "ring-white/30",
    titleGradient: "from-violet-600 via-fuchsia-500 to-rose-500",
    glowA: "bg-violet-500/10",
    glowB: "bg-fuchsia-500/10",
    accent: "text-violet-500",
  },
  amber: {
    surface:
      "from-amber-50/60 via-background to-orange-50/60 dark:from-amber-950/30 dark:via-background dark:to-orange-950/30",
    iconBg: "from-amber-500 to-orange-500",
    iconRing: "ring-white/30",
    titleGradient: "from-amber-600 via-orange-500 to-rose-500",
    glowA: "bg-amber-500/10",
    glowB: "bg-orange-500/10",
    accent: "text-amber-500",
  },
  emerald: {
    surface:
      "from-emerald-50/60 via-background to-teal-50/60 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/30",
    iconBg: "from-emerald-500 to-teal-600",
    iconRing: "ring-white/30",
    titleGradient: "from-emerald-600 via-teal-500 to-cyan-500",
    glowA: "bg-emerald-500/10",
    glowB: "bg-teal-500/10",
    accent: "text-emerald-500",
  },
  rose: {
    surface:
      "from-rose-50/60 via-background to-pink-50/60 dark:from-rose-950/30 dark:via-background dark:to-pink-950/30",
    iconBg: "from-rose-500 to-pink-600",
    iconRing: "ring-white/30",
    titleGradient: "from-rose-600 via-pink-500 to-fuchsia-500",
    glowA: "bg-rose-500/10",
    glowB: "bg-pink-500/10",
    accent: "text-rose-500",
  },
  cyan: {
    surface:
      "from-cyan-50/60 via-background to-sky-50/60 dark:from-cyan-950/30 dark:via-background dark:to-sky-950/30",
    iconBg: "from-cyan-500 to-sky-600",
    iconRing: "ring-white/30",
    titleGradient: "from-cyan-600 via-sky-500 to-blue-500",
    glowA: "bg-cyan-500/10",
    glowB: "bg-sky-500/10",
    accent: "text-cyan-500",
  },
  indigo: {
    surface:
      "from-indigo-50/60 via-background to-violet-50/60 dark:from-indigo-950/30 dark:via-background dark:to-violet-950/30",
    iconBg: "from-indigo-500 to-violet-600",
    iconRing: "ring-white/30",
    titleGradient: "from-indigo-600 via-violet-500 to-fuchsia-500",
    glowA: "bg-indigo-500/10",
    glowB: "bg-violet-500/10",
    accent: "text-indigo-500",
  },
};

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Optional short tagline shown above description with a sparkle accent. */
  tagline?: string;
  icon: LucideIcon;
  colorTheme?: PageHeaderTheme;
  className?: string;
}

const PageHeader = ({
  title,
  description,
  tagline,
  icon: Icon,
  colorTheme = "primary",
  className,
}: PageHeaderProps) => {
  const t = THEMES[colorTheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative mb-6 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br px-5 py-5 md:px-7 md:py-6 shadow-sm",
        t.surface,
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl",
          t.glowA
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full blur-3xl",
          t.glowB
        )}
      />
      <div className="relative flex items-center gap-3 md:gap-4">
        <div
          className={cn(
            "flex h-11 w-11 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-primary-foreground shadow-lg shadow-primary/20 ring-1",
            t.iconBg,
            t.iconRing
          )}
        >
          <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              "text-2xl md:text-3xl font-bold leading-tight bg-gradient-to-r bg-clip-text text-transparent",
              t.titleGradient
            )}
          >
            {title}
          </h1>
          {tagline && (
            <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-1.5 mt-0.5">
              <Sparkles className={cn("h-3.5 w-3.5", t.accent)} />
              {tagline}
            </p>
          )}
          {description && (
            <div className="text-xs md:text-sm text-muted-foreground mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PageHeader;
