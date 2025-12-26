import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Star, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import BadgeCard from "@/components/gamification/BadgeCard";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  awarded_at: string | null;
  earned: boolean;
}

const Achievements = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllBadges = async () => {
      try {
        // Fetch all available badges
        const { data: allBadges, error: badgesError } = await supabase
          .from("badges")
          .select("*")
          .order("name");

        if (badgesError) throw badgesError;

        if (!user) {
          // Show all badges as not earned for non-logged in users
          setBadges(
            (allBadges || []).map((b) => ({
              id: b.id,
              name: b.name,
              description: b.description,
              icon: b.icon,
              category: b.category || "General",
              awarded_at: null,
              earned: false,
            }))
          );
          setLoading(false);
          return;
        }

        // Fetch user's earned badges
        const { data: userBadges, error: userBadgesError } = await supabase
          .from("user_badges")
          .select("badge_id, awarded_at")
          .eq("user_id", user.id);

        if (userBadgesError) throw userBadgesError;

        const earnedMap = new Map(
          (userBadges || []).map((ub) => [ub.badge_id, ub.awarded_at])
        );

        // Merge all badges with user's earned status
        const mergedBadges = (allBadges || []).map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          category: b.category || "General",
          awarded_at: earnedMap.get(b.id) || null,
          earned: earnedMap.has(b.id),
        }));

        // Sort: earned first, then by name
        mergedBadges.sort((a, b) => {
          if (a.earned && !b.earned) return -1;
          if (!a.earned && b.earned) return 1;
          return a.name.localeCompare(b.name);
        });

        setBadges(mergedBadges);
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBadges();
  }, [user]);

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Achievements</h1>
              <p className="text-sm text-muted-foreground">
                {earnedCount} of {totalCount} badges earned
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{earnedCount}</p>
                <p className="text-xs text-muted-foreground">Earned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{totalCount - earnedCount}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">
                  {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </CardContent>
            </Card>
          </div>

          {/* Badges Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : badges.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No badges available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {badges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={!badge.earned ? "opacity-50" : ""}
                    >
                      <BadgeCard
                        name={badge.name}
                        description={badge.description}
                        icon={badge.icon}
                        category={badge.category}
                        awardedAt={badge.awarded_at || undefined}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Achievements;
