import { safeJsonLd } from '@/lib/jsonLd';
import { useState, useMemo } from "react";
import { useFAQItems } from "@/hooks/useFAQItems";
import SEOHead from "@/components/SEOHead";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, HelpCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

const FAQ = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: items = [], isLoading } = useFAQItems();

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return ["all", ...Array.from(cats)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === "all" || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [items, search, activeCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach((item) => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }, [filtered]);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <SEOHead
        title="FAQ - Frequently Asked Questions"
        description="Find answers to common questions about MCQsAI, exam preparation, mock tests, and study tools for Pakistani students."
        keywords="MCQsAI FAQ, exam preparation questions, MDCAT help, study tools help"
      />
      <Helmet>
        <script type="application/ld+json">{safeJsonLd(faqSchema)}</script>
      </Helmet>
      <Header>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <PageBreadcrumb
            items={[
              { title: "Home", href: "/" },
              { title: "FAQ", href: "/faq", isCurrent: true },
            ]}
          />

          <div className="text-center mb-8">
            <HelpCircle className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">Everything you need to know about MCQsAI</p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((c) => (
                <Badge
                  key={c}
                  variant={activeCategory === c ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No questions match your search.</p>
          ) : (
            Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat} className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-3 capitalize">{cat}</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {catItems.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </div>
        <Footer />
      </Header>
    </>
  );
};

export default FAQ;
