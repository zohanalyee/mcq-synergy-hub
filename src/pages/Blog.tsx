import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import SEOHead from "@/components/SEOHead";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, User, ArrowRight, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/PageHeader";
import RelatedContent from "@/components/seo/related/RelatedContent";

const CATEGORIES = ["all", "preparation", "colleges", "tips"];

const Blog = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { data: posts = [], isLoading } = useBlogPosts();

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.excerpt || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [posts, search, category]);

  return (
    <>
      <SEOHead
        title="MCQsAI Blog — Pakistan Exam Tips, MDCAT & FPSC Guides"
        description="Expert guides on MDCAT, ECAT, FPSC, NTS preparation, study techniques and college admissions for Pakistani students. Updated regularly."
        keywords="MDCAT blog, FPSC tips, exam tips Pakistan, study guides, medical college guide, NTS preparation"
      />
      <Header>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <PageBreadcrumb
            items={[
              { title: "Home", href: "/" },
              { title: "Blog", href: "/blog", isCurrent: true },
            ]}
          />

          <PageHeader
            icon={Newspaper}
            title="Blog"
            tagline="Insights & guides"
            description="Expert articles on exam preparation, study tips, and career guidance."
          />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((c) => (
                <Badge
                  key={c}
                  variant={category === c ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setCategory(c)}
                >
                  {c === "all" ? "All" : c}
                </Badge>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader>
                  <CardContent><div className="h-16 bg-muted rounded" /></CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No articles found.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/blog/${post.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow border-border/50 hover:border-primary/30">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          {post.category && (
                            <Badge variant="secondary" className="capitalize text-xs">
                              {post.category}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg leading-tight line-clamp-2">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {post.author_name}
                            </span>
                            {post.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(post.published_at), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </Header>
    </>
  );
};

export default Blog;
