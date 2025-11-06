import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarRail, useSidebar } from "@/components/ui/sidebar";
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
  const icons: Record<string, { icon: React.ReactNode; color: string }> = {
    'Home': { 
      icon: <BookOpen size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-blue-400 via-blue-500 to-blue-600'
    },
    'Subjects': { 
      icon: <FileText size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-purple-400 via-purple-500 to-purple-600'
    },
    'MCQs': { 
      icon: <PenTool size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-green-400 via-green-500 to-green-600'
    },
    'Quizzes': { 
      icon: <Target size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-red-400 via-red-500 to-red-600'
    },
    'Mock Tests': { 
      icon: <Clock size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-orange-400 via-orange-500 to-orange-600'
    },
    'Custom Syllabus': { 
      icon: <GraduationCap size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-indigo-400 via-indigo-500 to-indigo-600'
    },
    'Scholarships': { 
      icon: <Users size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-pink-400 via-pink-500 to-pink-600'
    },
    'Jobs': { 
      icon: <Briefcase size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-teal-400 via-teal-500 to-teal-600'
    },
    'Past Papers': { 
      icon: <FileText size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-amber-400 via-amber-500 to-amber-600'
    },
    'Analytics': { 
      icon: <TrendingUp size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-cyan-400 via-cyan-500 to-cyan-600'
    },
    'Feedback': { 
      icon: <MessageSquare size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-lime-400 via-lime-500 to-lime-600'
    },
    'Question Bank': { 
      icon: <Database size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
      color: 'from-violet-400 via-violet-500 to-violet-600'
    }
  };
  return icons[title] || { 
    icon: <BookOpen size={20} strokeWidth={2.5} absoluteStrokeWidth className="w-5 h-5" />, 
    color: 'from-gray-400 via-gray-500 to-gray-600'
  };
};
export function AppSidebar({
  navItems,
  secondaryNavItems,
  isActive,
  onNavigate,
  isAdmin
}: AppSidebarProps) {
  const {
    open,
    openMobile,
    isMobile
  } = useSidebar();
  const expanded = open || (isMobile && openMobile);
  return <Sidebar collapsible="icon" className="border-r border-border/40 transition-all duration-300">
      <SidebarHeader className="border-b border-border/40 p-3">
        <div className={cn("flex items-center gap-3 transition-all duration-300", !expanded && "justify-center")}>
          <img src={logo} alt="MCQs Point" className={cn("object-contain transition-all duration-300", expanded ? "h-8" : "h-8")} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(!expanded && "sr-only")}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const iconData = getIcon(item.title);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => onNavigate(item.path)} 
                      isActive={isActive(item.path)} 
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-300 hover:scale-105 group relative overflow-hidden my-1",
                        isActive(item.path) && "shadow-lg",
                        !expanded && "justify-center px-0 w-12 h-12 mx-auto"
                      )}
                    >
                      <span className={cn(
                        "transition-all duration-300 flex items-center justify-center rounded-lg p-2 backdrop-blur-xl bg-gradient-to-br text-white",
                        iconData.color,
                        "shadow-md hover:shadow-xl hover:scale-110",
                        "border border-white/20 hover:border-white/40",
                        !expanded && "w-full h-full"
                      )}>
                        {iconData.icon}
                      </span>
                      {expanded && <span className="font-medium animate-fade-in ml-3">{item.title}</span>}
                      {isActive(item.path) && expanded && <ChevronRight className="ml-auto w-4 h-4 animate-fade-in" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={cn(!expanded && "sr-only")}>
            Tools & Resources
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map(item => {
                const iconData = getIcon(item.title);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => onNavigate(item.path)} 
                      isActive={isActive(item.path)} 
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-300 hover:scale-105 group relative overflow-hidden my-1",
                        isActive(item.path) && "shadow-lg",
                        !expanded && "justify-center px-0 w-12 h-12 mx-auto"
                      )}
                    >
                      <span className={cn(
                        "transition-all duration-300 flex items-center justify-center rounded-lg p-2 backdrop-blur-xl bg-gradient-to-br text-white",
                        iconData.color,
                        "shadow-md hover:shadow-xl hover:scale-110",
                        "border border-white/20 hover:border-white/40",
                        !expanded && "w-full h-full"
                      )}>
                        {iconData.icon}
                      </span>
                      {expanded && <span className="font-medium animate-fade-in ml-3">{item.title}</span>}
                      {item.title === 'Question Bank' && isAdmin && expanded && (
                        <Badge variant="secondary" className="ml-auto text-xs animate-fade-in">
                          Admin
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail className="bg-gradient-to-b from-primary/30 via-primary/20 to-primary/30 hover:from-primary/40 hover:via-primary/30 hover:to-primary/40 transition-all duration-300 w-1.5 hover:w-2 rounded-full shadow-md hover:shadow-lg hover:shadow-primary/30 relative group">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full blur-sm" />
      </SidebarRail>

      <SidebarFooter className="border-t border-border/40 p-2">
        <div className={cn("text-xs text-muted-foreground text-center transition-opacity duration-300", !expanded && "opacity-0")}> 
          <p className="animate-fade-in">© 2025 MCQs Point</p>
        </div>
      </SidebarFooter>
    </Sidebar>;
}