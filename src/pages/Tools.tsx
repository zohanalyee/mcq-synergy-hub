import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Wrench } from 'lucide-react';
import { ALL_TOOLS, TOOL_CATEGORIES, CATEGORY_COLORS } from '@/data/toolsData';
import { TOOL_ICON_COLORS } from '@/data/toolColors';
import { motion } from 'framer-motion';
import TypewriterText from '@/components/TypewriterText';
import PageHeader from '@/components/ui/PageHeader';

const Tools = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = ALL_TOOLS.filter(tool => {
    const matchSearch = tool.name.toLowerCase().includes(search.toLowerCase()) || tool.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || tool.category === category;
    return matchSearch && matchCat;
  });

  return (
    <Header>
      <SEOHead
        title="Free AI Tools & Calculators for Students"
        description="Access 50+ premium, free AI tools and calculators for students and professionals. Generate content, solve problems, and study smarter with our AI-powered utilities."
        keywords="AI tools, free AI tools, AI calculators, AI student tools, GPA calculator, age calculator, unit converter, student tools, online calculators"
      />
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-5">
        <PageBreadcrumb items={[{ title: 'Tools', href: '/tools', isCurrent: true }]} showHomeButton={true} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-lg">
            <Wrench className="h-4 w-4" />
            {ALL_TOOLS.length}+ Free Tools
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Free Online AI Tools</h1>
          <TypewriterText
            prefix="Access 50+ Premium AI Tools to "
            phrases={[
              'Build a Professional Resume',
              'Solve Complex Math',
              'Manage School Attendance',
              'Generate Study Notes Instantly',
              'Boost Productivity — Free Forever',
            ]}
            className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base"
            minHeightClass="min-h-[3rem]"
          />
        </motion.div>

        {/* Search + Filters */}
        <div className="space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {TOOL_CATEGORIES.map(cat => (
              <Button
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat)}
                className="rounded-full"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((tool, i) => {
            const colors = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS['Calculators'];
            const uniqueIcon = TOOL_ICON_COLORS[tool.id];
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ delay: Math.min(i * 0.015, 0.2), type: "spring", stiffness: 300, damping: 20 }}
                className="will-change-transform"
              >
                <Link
                  to={tool.href}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border overflow-hidden min-h-[120px] ${colors.border} ${colors.bg} ${colors.hover} hover:shadow-md transition-all text-center group h-full bg-background`}
                >
                  {tool.popular && (
                    <Badge className="absolute top-2 right-2 text-[9px] px-1.5 py-0 bg-primary/90">
                      Popular
                    </Badge>
                  )}
                  <div className={`h-10 w-10 rounded-xl ${uniqueIcon ? uniqueIcon.iconBg : colors.icon} flex items-center justify-center group-hover:scale-110 transition-all`}>
                    <tool.icon className={`h-5 w-5 ${uniqueIcon ? uniqueIcon.iconText : ''}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{tool.name}</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${colors.badge}`}>{tool.category}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tools found. Try a different search term.
          </div>
        )}

        {/* CTA */}
        <div className="text-center p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
          <h2 className="text-xl font-bold text-foreground">Students? Try Our MCQ Platform!</h2>
          <p className="text-muted-foreground text-sm">10,000+ Free Practice Questions | All Subjects</p>
          <Button asChild><Link to="/subjects">Start Practicing Free →</Link></Button>
        </div>
      </div>
    </Header>
  );
};

export default Tools;
