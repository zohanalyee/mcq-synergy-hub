
import { motion } from "framer-motion";
import LeaderboardEntry from "./LeaderboardEntry";
import { LeaderboardEntry as LeaderboardEntryType } from "@/data/leaderboardData";

interface LeaderboardListProps {
  leaders: LeaderboardEntryType[];
  filter: string;
}

const LeaderboardList = ({ leaders, filter }: LeaderboardListProps) => {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {leaders
        .filter(leader => filter === "all" || leader.subject.toLowerCase() === filter.toLowerCase())
        .map((leader) => (
          <LeaderboardEntry key={leader.id} leader={leader} />
        ))}
    </motion.div>
  );
};

export default LeaderboardList;
