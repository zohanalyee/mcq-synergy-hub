import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BadgeCard from "@/components/gamification/BadgeCard";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  awarded_at: string;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const RecentAchievements = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_badges")
          .select(`
            awarded_at,
            badges (
              id,
              name,
              description,
              icon,
              category
            )
          `)
          .eq("user_id", user.id)
          .order("awarded_at", { ascending: false })
          .limit(3);

        if (error) throw error;

        const formattedBadges = (data || [])
          .filter((item) => item.badges)
          .map((item) => ({
            id: (item.badges as any).id,
            name: (item.badges as any).name,
            description: (item.badges as any).description,
            icon: (item.badges as any).icon,
            category: (item.badges as any).category,
            awarded_at: item.awarded_at || "",
          }));

        setBadges(formattedBadges);
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user]);

  if (loading) {
    return (
      <motion.div variants={item}>
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Your Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div variants={item}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Your Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {badges.length > 0 ? (
            <>
              {[...new Map(badges.map((b) => [b.id, b])).values()].map((badge) => (
                <BadgeCard
                  key={badge.id}
                  name={badge.name}
                  description={badge.description}
                  icon={badge.icon}
                  category={badge.category}
                  awardedAt={badge.awarded_at}
                  compact
                />
              ))}
              <Link to="/achievements">
                <Button variant="ghost" size="sm" className="w-full mt-2 text-primary">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Trophy className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Complete a test to unlock your first badge!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentAchievements;
