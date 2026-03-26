import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const StudyGuides = () => {
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["study-guides-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, description, category")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: topicCounts = {} } = useQuery({
    queryKey: ["study-guides-topic-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("subject_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((t: any) => {
        if (t.subject_id) counts[t.subject_id] = (counts[t.subject_id] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Study Guides - Topic-wise Summaries"
        description="Browse comprehensive study guides organized by subject and topic for MDCAT, ECAT, CSS, and more."
        keywords="study guides Pakistan, MDCAT study guide, topic summaries, exam preparation guides"
      />
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <PageBreadcrumb
          items={[
            { title: "Home", href: "/" },
            { title: "Study Guides", href: "/study-guides", isCurrent: true },
          ]}
        />

        <div className="text-center mb-8">
          <BookOpen className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Study Guides</h1>
          <p className="text-muted-foreground">
            Browse subjects and topics to find study material and practice MCQs
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-6 bg-muted rounded w-2/3" /></CardHeader>
                <CardContent><div className="h-10 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, i) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/subject/${subject.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {subject.name}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {subject.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {topicCounts[subject.id] || 0} topics
                        </Badge>
                        {subject.category && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {subject.category}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StudyGuides;
