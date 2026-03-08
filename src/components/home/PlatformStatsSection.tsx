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
      const { data, error } = await supabase.rpc("get_platform_stats");
      if (error) {
        console.error("Platform stats error:", error);
        return { mcq_count: 0, subject_count: 0, test_count: 0 };
      }
      return data?.[0] ?? { mcq_count: 0, subject_count: 0, test_count: 0 };
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = [
    { to: Number(data?.mcq_count ?? 0), prefix: "+", label: "MCQs Available" },
    { to: Number(data?.subject_count ?? 0), prefix: "", label: "Subjects Covered" },
    { to: 98, suffix: "%", label: "User Satisfaction" },
    { to: Number(data?.test_count ?? 0), prefix: "+", label: "Tests Completed" },
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
              {isLoading ? (
                <Skeleton className="h-7 w-16 mx-auto mb-1 bg-white/20" />
              ) : (
                <AnimatedCounter
                  from={0}
                  to={stat.to}
                  prefix={stat.prefix}
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
