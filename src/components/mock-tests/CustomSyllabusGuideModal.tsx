import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Scale, Bot, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hasSeenSyllabusGuide";

const features = [
  {
    icon: FileText,
    emoji: "📝",
    title: "Rename Subjects",
    desc: "Modify up to 2 subject descriptions (e.g. add 'Current Affairs' to General Knowledge).",
  },
  {
    icon: Scale,
    emoji: "⚖️",
    title: "Adjust Weightage",
    desc: "Change the percentage of questions per subject or disable them entirely.",
  },
  {
    icon: Bot,
    emoji: "🤖",
    title: "AI Adapted",
    desc: "The AI will instantly read your changes and generate matching questions!",
  },
];

export const CustomSyllabusGuideModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      seen = false;
    }
    if (seen) return;
    const timer = setTimeout(() => setOpen(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="syllabus-guide-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl p-[1.5px] bg-brand-gradient shadow-2xl"
          >
            <div className="relative rounded-[calc(1.5rem-1.5px)] bg-card/80 dark:bg-card/70 backdrop-blur-lg p-6 sm:p-7">
              {/* Top decorative accent */}
              <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-gradient" />

              <button
                onClick={close}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient-soft">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
              </div>

              <h2
                id="syllabus-guide-title"
                className="text-center text-2xl font-bold text-brand-gradient bg-clip-text text-transparent"
              >
                Customize Your Test Syllabus! 🎯
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                You can now tailor the AI-generated exam to your exact needs:
              </p>

              <div className="mt-5 space-y-3">
                {features.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/50 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient-soft">
                      <f.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        <span className="mr-1">{f.emoji}</span>
                        {f.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={close}
                size="lg"
                className="mt-6 w-full bg-brand-gradient text-white border-0 hover:opacity-90 transition-opacity font-semibold"
              >
                Got it, let's practice!
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomSyllabusGuideModal;
