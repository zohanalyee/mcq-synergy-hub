import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { BookOpen, FileText, Users, Briefcase, Target, GraduationCap, TrendingUp, MessageSquare, Database, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNewJobsCount } from '@/hooks/useNewJobsCount';
import { useNewScholarshipsCount } from '@/hooks/useNewScholarshipsCount';
import logoImage from '@/assets/logo.png';

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
  const icons: Record<string, { icon: React.ReactNode }> = {
    'Home': { 
      icon: <BookOpen size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-blue-500" />
    },
    'Subjects': { 
      icon: <FileText size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-purple-500" />
    },
    'Quizzes': { 
      icon: <Target size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-red-500" />
    },
    'Recruitment Tests': { 
      icon: <Briefcase size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-orange-500" />
    },
    'Custom Syllabus': { 
      icon: <GraduationCap size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-indigo-500" />
    },
    'Scholarships': { 
      icon: <Users size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-pink-500" />
    },
    'Jobs': { 
      icon: <Briefcase size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-teal-500" />
    },
    'Past Papers': { 
      icon: <FileText size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-amber-500" />
    },
    'Analytics': { 
      icon: <TrendingUp size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-cyan-500" />
    },
    'Feedback': { 
      icon: <MessageSquare size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-lime-500" />
    },
    'Question Bank': { 
      icon: <Database size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-violet-500" />
    },
  };
  return icons[title] || { 
    icon: <BookOpen size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-gray-500" />
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
  const { data: newJobsCount = 0 } = useNewJobsCount();
  const { data: newScholarshipsCount = 0 } = useNewScholarshipsCount();

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border/40 transition-all duration-300 h-screen fixed top-0 left-0 z-50"
    >
      {/* Sidebar Header with Logo and Toggle */}
      <SidebarHeader className="h-14 flex items-center px-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        {/* When collapsed: Show only toggle button centered */}
        {!expanded && (
          <div className="w-full flex justify-center">
            <SidebarTrigger className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300" />
          </div>
        )}
        
        {/* When expanded: Show logo + name + toggle on the right */}
        {expanded && (
          <div className="flex items-center justify-between w-full">
            <div 
              className="flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
              onClick={() => onNavigate('/')}
            >
              <img 
                src={logoImage} 
                alt="Logo" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <SidebarTrigger className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300 flex-shrink-0" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="pt-2">
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
                        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] group relative overflow-hidden my-0.5 h-9",
                        isActive(item.path) && "shadow-sm bg-primary/10",
                        !expanded && "justify-center px-0 w-9 h-9 mx-auto"
                      )}
                    >
                        {iconData.icon}
                      <span className={cn(
                        "font-medium ml-2 text-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 absolute"
                      )}>{item.title}</span>
                      {item.title === 'Jobs' && newJobsCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className={cn(
                            "ml-auto text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] animate-pulse",
                            expanded ? "opacity-100 scale-100" : "opacity-0 scale-75 absolute right-2"
                          )}
                        >
                          {newJobsCount > 99 ? '99+' : newJobsCount}
                        </Badge>
                      )}
                      {item.title === 'Scholarships' && newScholarshipsCount > 0 && (
                        <Badge 
                          variant="default" 
                          className={cn(
                            "ml-auto text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] animate-pulse bg-pink-500 hover:bg-pink-600",
                            expanded ? "opacity-100 scale-100" : "opacity-0 scale-75 absolute right-2"
                          )}
                        >
                          {newScholarshipsCount > 99 ? '99+' : newScholarshipsCount}
                        </Badge>
                      )}
                      <ChevronRight className={cn(
                        "ml-auto w-3 h-3 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        isActive(item.path) && expanded && !(item.title === 'Jobs' && newJobsCount > 0) && !(item.title === 'Scholarships' && newScholarshipsCount > 0) ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 absolute right-2"
                      )} />
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
                        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] group relative overflow-hidden my-0.5 h-9",
                        isActive(item.path) && "shadow-sm bg-primary/10",
                        !expanded && "justify-center px-0 w-9 h-9 mx-auto"
                      )}
                    >
                        {iconData.icon}
                      <span className={cn(
                        "font-medium ml-2 text-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 absolute"
                      )}>{item.title}</span>
                      {item.title === 'Question Bank' && isAdmin && (
                        <Badge variant="secondary" className={cn(
                          "ml-auto text-[10px] px-1.5 py-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                          expanded ? "opacity-100 scale-100" : "opacity-0 scale-75 absolute right-2"
                        )}>
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
    </Sidebar>
  );
}