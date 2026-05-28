import { useParams, Link } from "react-router-dom";
import { useBlogPost, useBlogPosts } from "@/hooks/useBlogPosts";
import SEOHead from "@/components/SEOHead";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import RelatedContent from "@/components/seo/related/RelatedContent";
import { ArticleSchema } from "@/components/seo/schemas";
import {
  BlogTrustStrip,
  BlogHighlightsCard,
  BlogTOC,
  BlogTables,
  BlogFAQ,
  BlogPrepFunnel,
  BlogInternalLinks,
  BlogSources,
  JobPostingSchema,
  HowToSchema,
} from "@/components/blog/BlogStructured";
import { calculateReadingTime, autoLinkMarkdown, extractHowToSteps } from "@/lib/blogContentUtils";
import { useMemo } from "react";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || "");
  const { data: allPosts = [] } = useBlogPosts();

  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.category === post?.category)
    .slice(0, 3);

  if (isLoading) {
    return (
      <Header>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Header>
    );
  }

  if (!post) {
    return (
      <Header>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">This blog post doesn't exist or has been removed.</p>
          <Link to="/blog">
            <Button><ArrowLeft className="h-4 w-4 mr-2" />Back to Blog</Button>
          </Link>
        </div>
        <Footer />
      </Header>
    );
  }

  const p = post as any;
  const highlights = p.highlights;
  const tables = Array.isArray(p.structured_tables) ? p.structured_tables : [];
  const faqs = Array.isArray(p.faqs) ? p.faqs : [];
  const internalLinks = Array.isArray(p.internal_links) ? p.internal_links : [];
  const prepBlocks = Array.isArray(p.prep_blocks) ? p.prep_blocks : [];
  const sources = Array.isArray(p.sources) ? p.sources : [];
  const jobposting = p.jobposting;
  const schemaType = p.schema_type || "Article";
  const rawContent = post.content || "";

  // Auto-inject up to 6 contextual internal links into body markdown.
  const linkedContent = useMemo(
    () => autoLinkMarkdown(rawContent, post.category, 6),
    [rawContent, post.category],
  );

  const readingMinutes = p.reading_time_minutes || calculateReadingTime(rawContent);
  const lastUpdated = p.last_updated_at || p.updated_at || p.published_at;

  // HowTo schema only for guide-like categories AND when steps are extractable.
  const howToCategories = new Set(["study-guides", "preparation", "preparation-tips", "guides"]);
  const isHowToCategory = howToCategories.has((post.category || "").toLowerCase());
  const howToSteps = useMemo(
    () => (isHowToCategory ? extractHowToSteps(rawContent) : []),
    [rawContent, isHowToCategory],
  );

  // Split content roughly in half to inject prep funnel mid-article
  const lines = linkedContent.split("\n");
  const midpoint = Math.floor(lines.length / 2);
  const splitAt = lines.findIndex((l, i) => i >= midpoint && /^##\s+/.test(l));
  const firstHalf = splitAt > 0 ? lines.slice(0, splitAt).join("\n") : linkedContent;
  const secondHalf = splitAt > 0 ? lines.slice(splitAt).join("\n") : "";

  const articleUrl = `https://mcqsai.com/blog/${post.slug}`;

  return (
    <>
      <SEOHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || undefined}
        type="article"
      />
      {/* OG / Twitter overrides */}
      <BreadcrumbSchema items={[
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` },
      ]} />
      <ArticleSchema
        headline={post.title}
        description={post.excerpt || post.meta_description || undefined}
        url={articleUrl}
        datePublished={post.published_at || undefined}
        dateModified={lastUpdated || post.published_at || undefined}
        authorName={post.author_name || 'MCQsAI Editorial Team'}
        keywords={post.tags || undefined}
        articleSection={post.category || undefined}
      />
      {schemaType === "JobPosting" && jobposting && (
        <JobPostingSchema
          data={jobposting}
          url={articleUrl}
          title={post.title}
          description={post.excerpt || undefined}
          datePosted={post.published_at || undefined}
        />
      )}
      {isHowToCategory && howToSteps.length >= 2 && (
        <HowToSchema
          name={post.title}
          description={post.excerpt || undefined}
          url={articleUrl}
          steps={howToSteps}
          totalTimeMinutes={readingMinutes || undefined}
        />
      )}
      <Header>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <PageBreadcrumb
            items={[
              { title: "Home", href: "/" },
              { title: "Blog", href: "/blog" },
              { title: post.title, href: `/blog/${post.slug}`, isCurrent: true },
            ]}
          />

          <article>
            <header className="mb-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {post.category && (
                  <Badge variant="secondary" className="capitalize">{post.category}</Badge>
                )}
                {(post.tags || []).slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{post.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />{post.author_name}
                </span>
                {post.published_at && (
                  <span>· {new Date(post.published_at).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}</span>
                )}
                {readingMinutes ? <span>· {readingMinutes} min read</span> : null}
              </div>
            </header>

            <BlogTrustStrip
              lastUpdated={lastUpdated}
              readingMinutes={readingMinutes}
              hasSource={sources.length > 0}
            />

            <BlogHighlightsCard highlights={highlights} />

            <BlogTOC markdown={post.content || ""} />

            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
                            prose-headings:scroll-mt-20 prose-headings:font-semibold
                            prose-h2:text-xl prose-h2:mt-7 prose-h2:mb-3
                            prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                            prose-p:leading-relaxed prose-li:leading-relaxed
                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                            prose-table:text-sm prose-th:bg-muted/60
                            [&_table]:block [&_table]:overflow-x-auto [&_table]:w-full">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{firstHalf}</ReactMarkdown>
            </div>

            {tables.length > 0 && <BlogTables tables={tables} />}

            {/* Mid-article preparation funnel */}
            {prepBlocks.length > 0 && <BlogPrepFunnel blocks={prepBlocks.slice(0, 2)} />}

            {secondHalf && (
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
                              prose-headings:scroll-mt-20 prose-headings:font-semibold
                              prose-h2:text-xl prose-h2:mt-7 prose-h2:mb-3
                              prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                              prose-p:leading-relaxed prose-li:leading-relaxed
                              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                              [&_table]:block [&_table]:overflow-x-auto [&_table]:w-full">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{secondHalf}</ReactMarkdown>
              </div>
            )}

            {/* Remaining prep blocks before conclusion */}
            {prepBlocks.length > 2 && (
              <BlogPrepFunnel blocks={prepBlocks.slice(2)} heading="Keep Practising" />
            )}

            <BlogFAQ faqs={faqs} />

            <BlogInternalLinks links={internalLinks} />

            <BlogSources sources={sources} />
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-xl font-bold mb-4">Related Articles</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((rp) => (
                  <Link key={rp.id} to={`/blog/${rp.slug}`}>
                    <Card className="hover:shadow-md transition-shadow h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm line-clamp-2">{rp.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground line-clamp-2">{rp.excerpt}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <RelatedContent entitySlug="blog-hub" title="Continue Reading" />
        </div>
        <Footer />
      </Header>
    </>
  );
};

export default BlogPost;
