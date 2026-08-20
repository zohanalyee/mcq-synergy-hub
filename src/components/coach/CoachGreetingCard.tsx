import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Briefcase, GraduationCap, School, Sparkles, Sun, Sunrise, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  /** Most recent attempt row from useAnalyticsData().recentAttempts */
  lastAttempt?: any;
  totalTests: number;
  /** Opens the EXISTING QuickTestGenerator dialog — flow logic unchanged */
  onSuggestForMe: () => void;
}

const firstName = (profile: any, user: any) => {
  const raw =
    profile?.full_name ||
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? String(user.email).split("@")[0] : "") ||
    "Student";
  const first = String(raw).trim().split(/[\s.]+/)[0] || "Student";
  return first.charAt(0).toUpperCase() + first.slice(1);
};

const CoachGreetingCard = ({ lastAttempt, totalTests, onSuggestForMe }: Props) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { greeting, GreetIcon } = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { greeting: "Good morning", GreetIcon: Sunrise };
    if (h < 17) return { greeting: "Good afternoon", GreetIcon: Sun };
    return { greeting: "Good evening", GreetIcon: Moon };
  }, []);

  const name = firstName(profile, user);

  const coachLine = useMemo(() => {
    if (!totalTests || !lastAttempt) {
      return "Chalo shuru karein — neeche se apna test type choose karo aur main tumhare liye plan bana deta hoon.";
    }
    const subject =
      (Array.isArray(lastAttempt.subjects) ? lastAttempt.subjects[0] : lastAttempt.subject) || "General";
    const pct = lastAttempt.total_questions
      ? Math.round((lastAttempt.score / lastAttempt.total_questions) * 100)
      : Number(lastAttempt.score) || 0;
    if (pct >= 80) return `Last test: ${subject} ${pct}% — zabardast! Isi rhythm mein agla test pakro.`;
    if (pct >= 50) return `Last test: ${subject} ${pct}% — thoda push aur, aaj isi ko upar le jaate hain.`;
    return `Last test: ${subject} ${pct}% — koi masla nahi, aaj ${subject} par focus karke wapsi karte hain.`;
  }, [lastAttempt, totalTests]);

  const intents = [
    { label: "Job Test", icon: Briefcase, onClick: () => navigate("/mock-tests") },
    { label: "Admission Test", icon: GraduationCap, onClick: () => navigate("/exams") },
    { label: "Board Exam", icon: School, onClick: () => navigate("/boards") },
    { label: "Suggest for me", icon: Sparkles, onClick: onSuggestForMe },
  ];

  return (
    <Card className="mb-4 p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 animate-fade-in">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1.5">
          <GreetIcon className="w-4 h-4 text-primary" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base md:text-lg font-semibold text-foreground truncate">
            {greeting}, {name}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5 [overflow-wrap:anywhere]">
            {coachLine}
          </p>
        </div>
      </div>

      <p className="text-xs font-medium text-muted-foreground mt-3 mb-2">Aaj kis ki tayyari?</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {intents.map((it) => (
          <button
            key={it.label}
            onClick={it.onClick}
            className="min-h-11 px-3 py-2 rounded-xl border border-border bg-card/70 text-xs md:text-sm font-medium text-foreground flex items-center justify-center gap-1.5 transition-colors hover:bg-primary/10 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <it.icon className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{it.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default CoachGreetingCard;
