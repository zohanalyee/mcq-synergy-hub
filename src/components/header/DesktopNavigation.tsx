
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
import { BookOpen, FileText, Users, Briefcase, Target, Timer, PenTool, GraduationCap } from 'lucide-react';

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
    { title: 'Mock Tests', path: '/mock-tests', icon: <Timer className="w-4 h-4" /> },
    { title: 'Custom Syllabus', path: '/custom-syllabus', icon: <GraduationCap className="w-4 h-4" /> },
    { title: 'Scholarships', path: '/scholarships', icon: <Users className="w-4 h-4" /> },
    { title: 'Jobs', path: '/jobs', icon: <Briefcase className="w-4 h-4" /> },
    { title: 'Past Papers', path: '/past-papers', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="gap-1">
        {allNavItems.slice(0, 6).map((item) => (
          <NavigationMenuItem key={item.title}>
            <NavigationMenuLink
              className={`${navigationMenuTriggerStyle()} cursor-pointer flex items-center gap-1.5 text-sm px-2.5 py-1.5 h-8 ${
                isActive(item.path) ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => onNavigate(item.path)}
            >
              <span className="text-xs font-medium">{item.title}</span>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
        
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm px-2.5 py-1.5 h-8">
            More
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-48 gap-1 p-2">
              {[...allNavItems.slice(6), ...secondaryNavItems].map((item) => (
                <li key={item.title}>
                  <NavigationMenuLink
                    className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer ${
                      isActive(item.path) ? 'bg-accent text-accent-foreground' : ''
                    }`}
                    onClick={() => onNavigate(item.path)}
                  >
                    <div className="text-sm font-medium leading-none">{item.title}</div>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default DesktopNavigation;
