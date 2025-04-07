
import { Award, Medal, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { LeaderboardEntry as LeaderboardEntryType } from "@/data/leaderboardData";

interface LeaderboardEntryProps {
  leader: LeaderboardEntryType;
}

export const LeaderboardEntry = ({ leader }: LeaderboardEntryProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-amber-500" />;
      case 2: return <Medal className="h-5 w-5 text-slate-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-700" />;
      default: return <Award className="h-5 w-5 text-primary/60" />;
    }
  };

  return (
    <motion.div variants={{
      hidden: { y: 10, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    }}>
      <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/40 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-4">
          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary/10">
            {getRankIcon(leader.rank)}
          </div>
          <div>
            <p className="font-medium">{leader.name}</p>
            <p className="text-sm text-muted-foreground">{leader.subject}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{leader.score}</p>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>
    </motion.div>
  );
};

export default LeaderboardEntry;
