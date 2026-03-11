import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AnimatedCounter from "@/components/AnimatedCounter";
import { Skeleton } from "@/components/ui/skeleton";

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const PlatformStatsSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      // Try RPC first
      const { data, error } = await supabase.rpc("get_platform_stats");
      if (!error && data?.[0]) {
        return data[0];
      }
      console.warn("RPC fallback: fetching stats directly", error);
      // Fallback: query tables directly
      const [mcqRes, subRes, testRes, ratingRes] = await Promise.all([
        supabase.from("content_items").select("*", { count: "exact", head: true }),
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("test_attempts").select("*", { count: "exact", head: true }),
        supabase.from("user_ratings" as any).select("rating"),
      ]);
      const ratings = (ratingRes.data as any[]) || [];
      const avgRating = ratings.length > 0 ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length : 0;
      return {
        mcq_count: mcqRes.count ?? 0,
        subject_count: subRes.count ?? 0,
        test_count: testRes.count ?? 0,
        satisfaction_pct: ratings.length > 0 ? Math.round((avgRating / 5) * 100) : 98,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = [
    { to: Number(data?.mcq_count ?? 0), suffix: "+", label: "MCQs Available" },
    { to: Number(data?.subject_count ?? 0), suffix: "+", label: "Subjects Covered" },
    { to: Number((data as any)?.satisfaction_pct ?? 98), suffix: "%", label: "User Satisfaction" },
    { to: Number(data?.test_count ?? 0), suffix: "+", label: "Tests Completed" },
  ];

  console.log("STATS DATA RESPONSE:", data);

  return (
    <motion.section
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="py-6 bg-gradient-to-r from-primary to-accent text-primary-foreground"
    >
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              {isLoading || !data ? (
                <Skeleton className="h-7 w-16 mx-auto mb-1 bg-white/20" />
              ) : (
                <AnimatedCounter
                  from={0}
                  to={stat.to}
                  suffix={stat.suffix}
                  className="text-xl md:text-2xl font-bold mb-1"
                />
              )}
              <p className="text-xs text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default PlatformStatsSection;
