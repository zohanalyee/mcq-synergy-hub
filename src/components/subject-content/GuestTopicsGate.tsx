import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthIntent } from "@/hooks/useAuthIntent";

interface TopicLite {
  id?: string;
  name: string;
  description?: string;
}

interface GuestTopicsGateProps {
  subjectTitle: string;
  topics: TopicLite[];
  onStartFirstTopic: (topic: TopicLite) => void;
  isLoading?: boolean;
}

const GuestTopicsGate = ({
  subjectTitle,
  topics,
  onStartFirstTopic,
  isLoading,
}: GuestTopicsGateProps) => {
  const [gateOpen, setGateOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { saveIntent } = useAuthIntent();

  const handleSignIn = () => {
    saveIntent({
      action: "unlock_subject",
      path: location.pathname + location.search,
    });
    setGateOpen(false);
    navigate("/sign-in");
  };

  const firstTopic = topics[0];
  const lockedTopics = topics.slice(1);

  return (
    <>
      {/* Primary CTA */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/60 bg-gradient-to-br from-secondary/40 to-background">
        <div>
          <h3 className="font-semibold text-foreground">
            {subjectTitle} Practice
          </h3>
          <p className="text-sm text-muted-foreground">
            First topic is free — sign in to unlock the full subject.
          </p>
        </div>
        <Button
          onClick={() => setGateOpen(true)}
          size="lg"
          className="bg-brand-gradient text-white shadow-brand gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Sign In to Start Practice
        </Button>
      </div>

      {/* Topics list */}
      {topics.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Topics for this subject are coming soon.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* First topic — FREE */}
          {firstTopic && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card
                role="button"
                tabIndex={0}
                onClick={() => !isLoading && onStartFirstTopic(firstTopic)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onStartFirstTopic(firstTopic);
                }}
                className="group cursor-pointer transition-all hover:shadow-brand hover:-translate-y-0.5 border-transparent"
                style={{
                  backgroundImage:
                    "var(--gradient-brand-soft), var(--gradient-brand)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-gradient text-white flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground truncate">
                        {firstTopic.name}
                      </h4>
                      <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-brand-gradient text-white">
                        Free
                      </span>
                    </div>
                    {firstTopic.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {firstTopic.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Locked topics */}
          {lockedTopics.map((t, i) => (
            <motion.div
              key={t.id || t.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: (i + 1) * 0.04 }}
            >
              <Card
                role="button"
                tabIndex={0}
                onClick={() => setGateOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setGateOpen(true);
                }}
                className="cursor-pointer transition-all hover:border-primary/40 hover:bg-secondary/30"
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Lock
                      className="w-4 h-4 text-transparent"
                      style={{
                        backgroundImage: "var(--gradient-brand)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                      }}
                      strokeWidth={2.5}
                      stroke="url(#lockBrandGradient)"
                    />
                    <svg width="0" height="0" className="absolute">
                      <defs>
                        <linearGradient id="lockBrandGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--brand-from))" />
                          <stop offset="50%" stopColor="hsl(var(--brand-via))" />
                          <stop offset="100%" stopColor="hsl(var(--brand-to))" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {t.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Sign in to unlock
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Sign-In Gate Dialog */}
      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center mb-2 shadow-brand">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-center text-xl">
              Sign In to Unlock
            </DialogTitle>
            <DialogDescription className="text-center">
              Unlock all topics and advanced practice features by signing in for free.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 pt-2">
            <Button
              onClick={handleSignIn}
              className="w-full h-11 bg-brand-gradient text-white shadow-brand"
            >
              Sign In — It's Free
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setGateOpen(false)}
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GuestTopicsGate;
