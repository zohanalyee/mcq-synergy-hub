import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Wrench } from 'lucide-react';
import { ALL_TOOLS, TOOL_CATEGORIES, CATEGORY_COLORS } from '@/data/toolsData';
import { TOOL_ICON_COLORS } from '@/data/toolColors';
import { motion } from 'framer-motion';

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
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-5">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Wrench className="h-4 w-4" />
            {ALL_TOOLS.length}+ Free Tools
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Free Online Tools</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Premium tools for students, professionals, and everyone — fast, smooth & free forever.
          </p>
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {filtered.map((tool, i) => {
            const colors = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS['Calculators'];
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ delay: Math.min(i * 0.02, 0.3), type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link
                  to={tool.href}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border ${colors.border} ${colors.bg} ${colors.hover} hover:shadow-md transition-all text-center group h-full`}
                >
                  {tool.popular && (
                    <Badge className="absolute top-2 right-2 text-[9px] px-1.5 py-0 bg-primary/90">
                      Popular
                    </Badge>
                  )}
                  <div className={`h-8 w-8 rounded-xl ${colors.icon} flex items-center justify-center group-hover:scale-110 transition-all`}>
                    <tool.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground leading-tight">{tool.name}</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${colors.badge}`}>{tool.category}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{tool.description}</p>
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
