import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Link } from 'react-router-dom';
import { Brain, BrainCircuit, Sparkles, Home, FileText, Users, Briefcase, Target, GraduationCap, TrendingUp, MessageSquare, Database, ChevronRight, ClipboardCheck, Bot, BookOpen, BriefcaseBusiness } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNewJobsCount } from '@/hooks/useNewJobsCount';
import { useNewScholarshipsCount } from '@/hooks/useNewScholarshipsCount';

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

const getIcon = (path: string) => {
  const icons: Record<string, { icon: React.ReactNode; hoverClass: string }> = {
    '/': { 
      icon: <Home size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-blue-500" />,
      hoverClass: "hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
    },
    '/subjects': { 
      icon: <FileText size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-purple-500" />,
      hoverClass: "hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400"
    },
    '/quizzes': { 
      icon: <Target size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-red-500" />,
      hoverClass: "hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
    },
    '/recruitment-tests': { 
      icon: <BriefcaseBusiness size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-orange-600" />,
      hoverClass: "hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400"
    },
    '/custom-syllabus': { 
      icon: <GraduationCap size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-indigo-500" />,
      hoverClass: "hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400"
    },
    '/scholarships': { 
      icon: <Users size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-pink-500" />,
      hoverClass: "hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400"
    },
    '/jobs': { 
      icon: <Briefcase size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-teal-500" />,
      hoverClass: "hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400"
    },
    '/past-papers': { 
      icon: <FileText size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-amber-500" />,
      hoverClass: "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
    },
    '/tools': {
      icon: <Sparkles size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-indigo-400 animate-pulse drop-shadow-[0_0_6px_rgba(129,140,248,0.6)]" />,
      hoverClass: "hover:bg-indigo-400/10 hover:text-indigo-500 dark:hover:text-indigo-300"
    },
    '/analytics': { 
      icon: <Brain size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-cyan-500" />,
      hoverClass: "hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
    },
    '/ai-coach': { 
      icon: <Brain size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-cyan-500" />,
      hoverClass: "hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
    },
    '/feedback': { 
      icon: <MessageSquare size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-lime-500" />,
      hoverClass: "hover:bg-lime-500/10 hover:text-lime-600 dark:hover:text-lime-400"
    },
    '/question-bank': { 
      icon: <Database size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-violet-500" />,
      hoverClass: "hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400"
    },
    '/ask-docs': { 
      icon: <Bot size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-amber-500" />,
      hoverClass: "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
    },
  };
  return icons[path] || { 
    icon: <BookOpen size={18} strokeWidth={2.5} absoluteStrokeWidth className="w-4.5 h-4.5 text-gray-500" />,
    hoverClass: "hover:bg-gray-500/10"
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
  const showAskDocsNew = !localStorage.getItem('visited_ask_docs');

  const handleNavigate = (path: string, title: string) => {
    if (title === 'Ask Docs') localStorage.setItem('visited_ask_docs', 'true');
    onNavigate(path);
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border/40 transition-all duration-300 h-screen fixed top-0 left-0 z-50 themed-sidebar"
    >
      {/* Sidebar Header with Logo and Toggle */}
      <SidebarHeader className="h-14 flex items-center px-3 border-b border-border/40 themed-interface backdrop-blur-sm">
        {/* When collapsed: Show only toggle button centered */}
        {!expanded && (
          <div className="w-full flex justify-center">
            <SidebarTrigger className="h-8 w-8 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300" />
          </div>
        )}
        
        {/* When expanded: Show icon + name + toggle on the right */}
        {expanded && (
          <div className="flex items-center justify-between w-full">
            <Link
              to="/"
              className="flex items-center gap-2 cursor-pointer transition-all duration-300"
              aria-label="MCQSAI Home"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-cyan-500">MCQS</span>
                <span className="text-foreground">AI</span>
              </span>
            </Link>
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
                const iconData = getIcon(item.path);
                return (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] group relative overflow-hidden my-0.5 h-9",
                        iconData.hoverClass,
                        isActive(item.path) && "shadow-sm bg-primary/10",
                        !expanded && "justify-center px-0 w-9 h-9 mx-auto"
                      )}
                    >
                      <Link to={item.path}>
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
                      </Link>
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
                const iconData = getIcon(item.path);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] group relative overflow-hidden my-0.5 h-9",
                        iconData.hoverClass,
                        isActive(item.path) && "shadow-sm bg-primary/10",
                        !expanded && "justify-center px-0 w-9 h-9 mx-auto"
                      )}
                    >
                      <Link
                        to={item.path}
                        onClick={() => { if (item.title === 'Ask Docs') localStorage.setItem('visited_ask_docs', 'true'); }}
                      >
                        {iconData.icon}
                      <span className={cn(
                        "font-medium ml-2 text-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 absolute"
                      )}>{item.title}</span>
                      {item.title === 'Ask Docs' && showAskDocsNew && (
                        <Badge className={cn(
                          "ml-auto text-[10px] px-1.5 py-0 bg-emerald-500 hover:bg-emerald-600 text-white border-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                          expanded ? "opacity-100 scale-100" : "opacity-0 scale-75 absolute right-2"
                        )}>
                          NEW
                        </Badge>
                      )}
                      {item.title === 'Question Bank' && isAdmin && (
                        <Badge variant="secondary" className={cn(
                          "ml-auto text-[10px] px-1.5 py-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                          expanded ? "opacity-100 scale-100" : "opacity-0 scale-75 absolute right-2"
                        )}>
                          Admin
                        </Badge>
                      )}
                      </Link>
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
          <p className="animate-fade-in">© {new Date().getFullYear()} MCQSAI</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}