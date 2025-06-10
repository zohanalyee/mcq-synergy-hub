
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger,
  navigationMenuTriggerStyle 
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { BookOpen, Users, Briefcase, FileText, GraduationCap, Calendar, BarChart3, MessageSquare } from "lucide-react";

interface NavItem {
  title: string;
  path: string;
  icon?: any;
}

interface DesktopNavigationProps {
  navItems: NavItem[];
  secondaryNavItems: NavItem[];
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
}

const DesktopNavigation = ({ navItems, secondaryNavItems, isActive, onNavigate }: DesktopNavigationProps) => {
  // Add icons to navigation items
  const getIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'home': return <BookOpen className="h-4 w-4" />;
      case 'subjects': return <BookOpen className="h-4 w-4" />;
      case 'scholarships': return <GraduationCap className="h-4 w-4" />;
      case 'jobs': return <Briefcase className="h-4 w-4" />;
      case 'mock tests': return <FileText className="h-4 w-4" />;
      case 'past papers': return <FileText className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'feedback': return <MessageSquare className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="hidden lg:flex items-center space-x-1">
      <NavigationMenu>
        <NavigationMenuList className="flex items-center space-x-1">
          {/* Main Navigation Items */}
          {navItems.map((item) => (
            <NavigationMenuItem key={item.path}>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.path) 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50"
                )}
                onClick={() => onNavigate(item.path)}
              >
                {getIcon(item.title)}
                {item.title}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}

          {/* Educational Resources Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Resources
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid gap-1 p-4 w-48">
                <NavigationMenuLink
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  onClick={() => onNavigate('/custom-syllabus')}
                >
                  <div className="text-sm font-medium leading-none">Custom Syllabus</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Create personalized study plans
                  </p>
                </NavigationMenuLink>
                <NavigationMenuLink
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  onClick={() => onNavigate('/custom-quizzes')}
                >
                  <div className="text-sm font-medium leading-none">Custom Quizzes</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Generate practice tests
                  </p>
                </NavigationMenuLink>
                <NavigationMenuLink
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                  onClick={() => onNavigate('/leaderboard')}
                >
                  <div className="text-sm font-medium leading-none">Leaderboard</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    See top performers
                  </p>
                </NavigationMenuLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Tools & Analytics */}
          {secondaryNavItems.map((item) => (
            <NavigationMenuItem key={item.path}>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.path) 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50"
                )}
                onClick={() => onNavigate(item.path)}
              >
                {getIcon(item.title)}
                {item.title}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export default DesktopNavigation;
