
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { BookOpen, FileText, Users, Briefcase, Target, Clock, PenTool, GraduationCap } from 'lucide-react';

interface NavItem {
  title: string;
  path: string;
  icon?: React.ReactNode;
}

interface DesktopNavigationProps {
  navItems: NavItem[];
  secondaryNavItems: NavItem[];
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
}

const DesktopNavigation = ({ navItems, secondaryNavItems, isActive, onNavigate }: DesktopNavigationProps) => {
  // All navigation items in one place - no more dropdown
  const allNavItems = [
    { title: 'Home', path: '/', icon: <BookOpen className="w-4 h-4" /> },
    { title: 'Subjects', path: '/subjects', icon: <FileText className="w-4 h-4" /> },
    { title: 'MCQs', path: '/mcqs', icon: <PenTool className="w-4 h-4" /> },
    { title: 'Quizzes', path: '/quizzes', icon: <Target className="w-4 h-4" /> },
    { title: 'Mock Tests', path: '/mock-tests', icon: <Clock className="w-4 h-4" /> },
    { title: 'Custom Syllabus', path: '/custom-syllabus', icon: <GraduationCap className="w-4 h-4" /> },
    { title: 'Scholarships', path: '/scholarships', icon: <Users className="w-4 h-4" /> },
    { title: 'Jobs', path: '/jobs', icon: <Briefcase className="w-4 h-4" /> },
    { title: 'Past Papers', path: '/past-papers', icon: <FileText className="w-4 h-4" /> },
    ...secondaryNavItems.map(item => ({ ...item, icon: <BookOpen className="w-4 h-4" /> }))
  ];

  return (
    <NavigationMenu className="hidden lg:flex mx-2">
      <NavigationMenuList className="flex-wrap gap-1 max-w-full">
        {allNavItems.map((item) => (
          <NavigationMenuItem key={item.title}>
            <NavigationMenuLink
              className={`${navigationMenuTriggerStyle()} cursor-pointer flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md transition-all duration-200 hover:scale-105 ${
                isActive(item.path) ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-accent/80'
              }`}
              onClick={() => onNavigate(item.path)}
            >
              {item.icon}
              <span className="hidden xl:inline whitespace-nowrap">{item.title}</span>
              <span className="xl:hidden">{item.title.split(' ')[0]}</span>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default DesktopNavigation;
