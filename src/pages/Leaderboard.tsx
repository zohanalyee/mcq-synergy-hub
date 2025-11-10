
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import SubjectFilter from "@/components/leaderboard/SubjectFilter";
import LeaderboardTabs from "@/components/leaderboard/LeaderboardTabs";

const Leaderboard = () => {
  const [filter, setFilter] = useState("all");

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
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
    </>
  );
};

export default Leaderboard;
