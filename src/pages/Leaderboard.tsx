
import { useState } from "react";
import { Link } from "react-router-dom";
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import SubjectFilter from "@/components/leaderboard/SubjectFilter";
import LeaderboardTabs from "@/components/leaderboard/LeaderboardTabs";
import { useAuthSafe } from "@/contexts/AuthContext";

const Leaderboard = () => {
  const [filter, setFilter] = useState("all");
  const auth = useAuthSafe();
  const isGuest = !auth?.user;


  return (
    <Header>
      <SEOHead
        title="Leaderboard - Top Performers"
        description="See the top-performing students on MCQsAI. Compete with others and climb the leaderboard."
        keywords="leaderboard, top students, rankings, competition, MCQ scores"
      />
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground">See how you rank against other students</p>
        </motion.div>

        <Card className="mb-8">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle>Top Performers</CardTitle>
              <SubjectFilter filter={filter} setFilter={setFilter} />
            </div>
          </CardHeader>
          <CardContent>
            <LeaderboardTabs filter={filter} />
          </CardContent>
        </Card>
      </div>
    </Header>
  );
};

export default Leaderboard;
