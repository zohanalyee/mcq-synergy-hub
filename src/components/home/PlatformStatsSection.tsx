import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

/** Simple counter that animates immediately on mount — no IntersectionObserver dependency */
const SimpleCounter = ({ to, suffix = "", className = "" }: { to: number; suffix?: string; className?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (to <= 0) return;
    let start = 0;
    const duration = 2000;
    const increment = to / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= to) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [to]);

  return <div className={className}>{count.toLocaleString()}{suffix}</div>;
};

const PlatformStatsSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      // Reads a pre-computed hourly snapshot row — no live COUNT(*) scans.
      const { data, error } = await supabase.rpc("get_platform_stats");
      if (!error && data?.[0]) {
        return data[0];
      }
      console.warn("Platform stats snapshot unavailable", error);
      const { data: snap } = await supabase
        .from("platform_stats_snapshot" as any)
        .select("mcq_count, subject_count, test_count, satisfaction_pct")
        .maybeSingle();
      return (snap as any) ?? null;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });


  const stats = [
    { to: Number(data?.mcq_count ?? 0), suffix: "+", label: "MCQs Available" },
    { to: Number(data?.subject_count ?? 0), suffix: "+", label: "Subjects Covered" },
    { to: Number((data as any)?.satisfaction_pct ?? 98), suffix: "%", label: "User Satisfaction" },
    { to: Number(data?.test_count ?? 0), suffix: "+", label: "Tests Completed" },
  ];

  

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
                <SimpleCounter
                  key={`${stat.label}-${stat.to}`}
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
