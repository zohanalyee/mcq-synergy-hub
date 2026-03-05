import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy } from 'lucide-react';
import { getRelatedTools } from '@/data/toolsData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ToolWrapperProps {
  toolId: string;
  title: string;
  description: string;
  category?: string;
  children: ReactNode;
}

const ToolWrapper = ({ toolId, title, description, category, children }: ToolWrapperProps) => {
  const relatedTools = getRelatedTools(toolId, 4);
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/tools')}
        className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Tools
      </Button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground -mt-3">
        <Link to="/tools" className="hover:text-foreground transition-colors">
          Tools
        </Link>
        <span>/</span>
        {category && <><span>{category}</span><span>/</span></>}
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </motion.div>

      {/* Tool Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-4 sm:p-6">
            {children}
          </CardContent>
        </Card>
      </motion.div>

      {/* MCQ CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">Students? Try our MCQ Platform!</p>
            <p className="text-sm text-muted-foreground">10,000+ free practice questions for all subjects</p>
          </div>
          <Button asChild size="sm">
            <Link to="/subjects">Explore MCQs →</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Related Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedTools.map(tool => (
              <Link
                key={tool.id}
                to={tool.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/30 transition-all text-center group"
              >
                <tool.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground">{tool.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CopyButton = ({ text }: { text: string }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={() => { navigator.clipboard.writeText(text); toast.success('Copied!'); }}
    className="gap-1.5"
  >
    <Copy className="h-3.5 w-3.5" /> Copy
  </Button>
);

export default ToolWrapper;
