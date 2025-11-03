import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { BookOpen, FileText, Users, Briefcase, Target, Clock, PenTool, GraduationCap, TrendingUp, MessageSquare, Database, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import logo from '@/assets/logo.png';

interface NavItem {
  title: string;
  path: string;
}

interface AppSidebarProps {
  navItems: NavItem[];
  secondaryNavItems: NavItem[];
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
  isAdmin?: boolean;
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

export function AppSidebar({ navItems, secondaryNavItems, isActive, onNavigate, isAdmin }: AppSidebarProps) {
  const { open } = useSidebar();

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border/40 transition-all duration-300"
    >
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300",
          !open && "justify-center"
        )}>
          <img 
            src={logo} 
            alt="MCQs Point" 
            className={cn(
              "object-contain transition-all duration-300",
              open ? "h-8" : "h-10"
            )}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(!open && "sr-only")}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    className={cn(
                      "transition-all duration-300 hover:scale-105 group relative overflow-hidden",
                      isActive(item.path) && "bg-primary text-primary-foreground shadow-md",
                      !open && "justify-center px-2"
                    )}
                  >
                    <span className={cn(
                      "transition-all duration-300 flex items-center justify-center",
                      isActive(item.path) && "scale-110",
                      !open && "mr-0"
                    )}>
                      {getIcon(item.title)}
                    </span>
                    {open && <span className="font-medium animate-fade-in">{item.title}</span>}
                    {isActive(item.path) && open && (
                      <ChevronRight className="ml-auto w-4 h-4 animate-fade-in" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={cn(!open && "sr-only")}>
            Tools & Resources
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    className={cn(
                      "transition-all duration-300 hover:scale-105 group",
                      isActive(item.path) && "bg-accent text-accent-foreground",
                      !open && "justify-center px-2"
                    )}
                  >
                    <span className={cn(
                      "transition-all duration-300 flex items-center justify-center",
                      isActive(item.path) && "scale-110",
                      !open && "mr-0"
                    )}>
                      {getIcon(item.title)}
                    </span>
                    {open && <span className="font-medium animate-fade-in">{item.title}</span>}
                    {item.title === 'Question Bank' && isAdmin && open && (
                      <Badge variant="secondary" className="ml-auto text-xs animate-fade-in">
                        Admin
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        <div className={cn(
          "text-xs text-muted-foreground text-center transition-opacity duration-300",
          !open && "opacity-0"
        )}>
          <p className="animate-fade-in">© 2024 EduPortal</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
