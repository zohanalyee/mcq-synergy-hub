import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { BookOpen, FileText, Users, Briefcase, Target, Clock, PenTool, GraduationCap, TrendingUp, MessageSquare, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  path: string;
}

interface CarouselNavigationProps {
  navItems: NavItem[];
  secondaryNavItems: NavItem[];
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
}

const getIcon = (title: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Home': <BookOpen className="w-4 h-4" />,
    'Subjects': <FileText className="w-4 h-4" />,
    'MCQs': <PenTool className="w-4 h-4" />,
    'Quizzes': <Target className="w-4 h-4" />,
    'Mock Tests': <Clock className="w-4 h-4" />,
    'Custom Syllabus': <GraduationCap className="w-4 h-4" />,
    'Scholarships': <Users className="w-4 h-4" />,
    'Jobs': <Briefcase className="w-4 h-4" />,
    'Past Papers': <FileText className="w-4 h-4" />,
    'Analytics': <TrendingUp className="w-4 h-4" />,
    'Feedback': <MessageSquare className="w-4 h-4" />,
    'Question Bank': <Database className="w-4 h-4" />,
  };
  return icons[title] || <BookOpen className="w-4 h-4" />;
};

const CarouselNavigation = ({ navItems, secondaryNavItems, isActive, onNavigate }: CarouselNavigationProps) => {
  const allNavItems = [...navItems, ...secondaryNavItems];

  return (
    <div className="hidden lg:block w-full max-w-3xl mx-auto px-12">
      <Carousel
        opts={{
          align: "start",
          loop: false,
          slidesToScroll: 3,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {allNavItems.map((item) => (
            <CarouselItem key={item.title} className="pl-2 basis-auto">
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                onClick={() => onNavigate(item.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 h-9 transition-all duration-200",
                  isActive(item.path) 
                    ? "bg-primary text-primary-foreground shadow-md scale-105" 
                    : "hover:bg-accent hover:text-accent-foreground hover:scale-105"
                )}
              >
                {getIcon(item.title)}
                <span className="text-sm font-medium whitespace-nowrap">{item.title}</span>
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 bg-background/95 backdrop-blur-sm border-border hover:bg-accent" />
        <CarouselNext className="right-0 bg-background/95 backdrop-blur-sm border-border hover:bg-accent" />
      </Carousel>
    </div>
  );
};

export default CarouselNavigation;
