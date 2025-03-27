
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Award, Medal, Trophy, Crown } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";

const weeklyLeaders = [
  { id: 1, name: "Alex Johnson", score: 956, rank: 1, subject: "Computer Science" },
  { id: 2, name: "Sarah Williams", score: 942, rank: 2, subject: "Mathematics" },
  { id: 3, name: "Michael Chen", score: 925, rank: 3, subject: "Physics" },
  { id: 4, name: "Jessica Taylor", score: 918, rank: 4, subject: "Chemistry" },
  { id: 5, name: "David Brown", score: 903, rank: 5, subject: "Biology" },
  { id: 6, name: "Emily Wilson", score: 897, rank: 6, subject: "Mathematics" },
  { id: 7, name: "James Lee", score: 885, rank: 7, subject: "Computer Science" },
  { id: 8, name: "Sophia Martinez", score: 872, rank: 8, subject: "Physics" },
  { id: 9, name: "Daniel Jackson", score: 865, rank: 9, subject: "Chemistry" },
  { id: 10, name: "Olivia Thomas", score: 852, rank: 10, subject: "Biology" },
];

const monthlyLeaders = [
  { id: 1, name: "Emma Davis", score: 3856, rank: 1, subject: "Mathematics" },
  { id: 2, name: "Noah Wilson", score: 3742, rank: 2, subject: "Computer Science" },
  { id: 3, name: "Ava Johnson", score: 3625, rank: 3, subject: "Physics" },
  { id: 4, name: "Liam Smith", score: 3518, rank: 4, subject: "Biology" },
  { id: 5, name: "Isabella Brown", score: 3503, rank: 5, subject: "Chemistry" },
  { id: 6, name: "Mason Taylor", score: 3497, rank: 6, subject: "Mathematics" },
  { id: 7, name: "Sophia Rodriguez", score: 3485, rank: 7, subject: "Computer Science" },
  { id: 8, name: "Lucas Martinez", score: 3372, rank: 8, subject: "Physics" },
  { id: 9, name: "Mia Anderson", score: 3365, rank: 9, subject: "Chemistry" },
  { id: 10, name: "Ethan Thomas", score: 3352, rank: 10, subject: "Biology" },
];

const allTimeLeaders = [
  { id: 1, name: "Olivia Walker", score: 12856, rank: 1, subject: "Mathematics" },
  { id: 2, name: "William Johnson", score: 12742, rank: 2, subject: "Computer Science" },
  { id: 3, name: "Sophia Harris", score: 12625, rank: 3, subject: "Physics" },
  { id: 4, name: "James Davis", score: 12518, rank: 4, subject: "Chemistry" },
  { id: 5, name: "Emma Wilson", score: 12503, rank: 5, subject: "Biology" },
  { id: 6, name: "Benjamin Taylor", score: 12497, rank: 6, subject: "Mathematics" },
  { id: 7, name: "Ava Clark", score: 12485, rank: 7, subject: "Computer Science" },
  { id: 8, name: "Alexander Rodriguez", score: 12372, rank: 8, subject: "Physics" },
  { id: 9, name: "Charlotte Lewis", score: 12365, rank: 9, subject: "Chemistry" },
  { id: 10, name: "Daniel Walker", score: 12352, rank: 10, subject: "Biology" },
];

const Leaderboard = () => {
  const [filter, setFilter] = useState("all");

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-amber-500" />;
      case 2: return <Medal className="h-5 w-5 text-slate-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-700" />;
      default: return <Award className="h-5 w-5 text-primary/60" />;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">See how you rank against other students</p>
        </motion.div>

        <Card className="mb-8">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle>Top Performers</CardTitle>
              <div className="space-x-2">
                <Button 
                  variant={filter === "all" ? "default" : "outline"} 
                  onClick={() => setFilter("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button 
                  variant={filter === "mathematics" ? "default" : "outline"} 
                  onClick={() => setFilter("mathematics")}
                  size="sm"
                >
                  Mathematics
                </Button>
                <Button 
                  variant={filter === "computer science" ? "default" : "outline"} 
                  onClick={() => setFilter("computer science")}
                  size="sm"
                >
                  CS
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="mt-6">
              <TabsList className="mb-6">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="allTime">All Time</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly">
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {weeklyLeaders
                    .filter(leader => filter === "all" || leader.subject.toLowerCase() === filter.toLowerCase())
                    .map((leader) => (
                      <motion.div key={leader.id} variants={item}>
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
                    ))}
                </motion.div>
              </TabsContent>
              
              <TabsContent value="monthly">
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {monthlyLeaders
                    .filter(leader => filter === "all" || leader.subject.toLowerCase() === filter.toLowerCase())
                    .map((leader) => (
                      <motion.div key={leader.id} variants={item}>
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
                    ))}
                </motion.div>
              </TabsContent>
              
              <TabsContent value="allTime">
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {allTimeLeaders
                    .filter(leader => filter === "all" || leader.subject.toLowerCase() === filter.toLowerCase())
                    .map((leader) => (
                      <motion.div key={leader.id} variants={item}>
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
                    ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Leaderboard;
