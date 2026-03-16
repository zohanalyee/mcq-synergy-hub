import { Shield, LogOut, Settings, LayoutGrid, LayoutDashboard, User, MessageSquare, ArrowRight, Star, Globe } from 'lucide-react';
import { FlagIcon } from '@/components/ui/flag-icon';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import StreakCounter from '@/components/gamification/StreakCounter';
import { ALL_TOOLS } from '@/data/toolsData';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import SettingsDialog from '@/components/settings/SettingsDialog';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';


interface HeaderActionsProps {
  theme?: string;
  user: any;
  profile: any;
  isAdmin: boolean;
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
  onSignOut: () => Promise<void>;
}

const HeaderActions = ({ 
  theme, 
  user, 
  profile, 
  isAdmin, 
  onToggleTheme, 
  onNavigate, 
  onSignOut
}: HeaderActionsProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    const messages: Record<Language, { title: string; desc: string }> = {
      en: { title: 'Language Updated', desc: 'English' },
      ur: { title: 'زبان تبدیل', desc: 'اردو' },
      sd: { title: 'ٻولي تبديل', desc: 'سنڌي' },
    };
    const msg = messages[value];
    toast({ title: msg.title, description: msg.desc, duration: 1500 });
  };

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (profile?.username) return profile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const TOOL_COLORS: Record<string, { bg: string; icon: string }> = {
    'gpa-calculator':        { bg: 'bg-[#FFE4EC] dark:bg-[#3D2A33]', icon: 'text-[#E8A0B8]' },
    'cgpa-calculator':       { bg: 'bg-[#F0E6FF] dark:bg-[#2E2A3D]', icon: 'text-[#B89FD9]' },
    'percentage-calculator': { bg: 'bg-[#E6F3FF] dark:bg-[#1E2D3D]', icon: 'text-[#90CAF9]' },
    'grade-calculator':      { bg: 'bg-[#FFF4E6] dark:bg-[#3D3425]', icon: 'text-[#E8C896]' },
    'attendance-calculator': { bg: 'bg-[#F0F4E8] dark:bg-[#2A3025]', icon: 'text-[#A8C69F]' },
    'age-calculator':        { bg: 'bg-[#FFE5D9] dark:bg-[#3D2E25]', icon: 'text-[#E8A87C]' },
    'bmi-calculator':        { bg: 'bg-[#E0F9F4] dark:bg-[#1E3D35]', icon: 'text-[#8BD8C7]' },
    'calculator':            { bg: 'bg-[#FFF8E7] dark:bg-[#3D3820]', icon: 'text-[#D4A574]' },
  };

  const STUDENT_TOOL_IDS = Object.keys(TOOL_COLORS);
  const FEATURED_IDS = new Set(['gpa-calculator', 'cgpa-calculator', 'percentage-calculator', 'grade-calculator']);

  const studentTools = STUDENT_TOOL_IDS
    .map(id => ALL_TOOLS.find(t => t.id === id))
    .filter(Boolean);

  return (
    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
      {user && <StreakCounter />}
      
      {/* Language Selector */}
      <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
        <SelectTrigger className="h-9 w-9 border-none bg-transparent hover:bg-muted rounded-full p-0 justify-center [&>svg.lucide-chevron-down]:hidden sm:w-auto sm:min-w-[7.5rem] sm:px-3 sm:justify-start sm:rounded-md sm:border sm:border-input sm:[&>svg.lucide-chevron-down]:block">
          <Globe className="h-4 w-4 shrink-0 sm:hidden" />
          <span className="hidden sm:flex items-center gap-2">
            <span className="language-flag-emoji">{language === 'en' ? '🇬🇧' : '🇵🇰'}</span>
            <span>{language === 'en' ? 'English' : language === 'ur' ? 'اردو' : 'سنڌي'}</span>
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">
            <div className="flex items-center gap-2">
              <span className="language-flag-emoji">🇬🇧</span>
              <span>English</span>
            </div>
          </SelectItem>
          <SelectItem value="ur">
            <div className="flex items-center gap-2">
              <span className="language-flag-emoji">🇵🇰</span>
              <span>اردو</span>
            </div>
          </SelectItem>
          <SelectItem value="sd">
            <div className="flex items-center gap-2">
              <span className="language-flag-emoji">🇵🇰</span>
              <span>سنڌي</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {!isMobile && <ThemeToggle />}
      
      {/* Tools Menu */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            <LayoutGrid className="h-5 w-5 text-blue-500 hover:text-blue-600 transition-colors" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 bg-popover/95 backdrop-blur-xl border border-border p-0">
          <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student Tools</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">Most Used</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-0" />
          <div className="py-1">
            {studentTools.map((tool) => {
              if (!tool) return null;
              const Icon = tool.icon;
              const isFeatured = FEATURED_IDS.has(tool.id);
              return (
                <DropdownMenuItem 
                  key={tool.id} 
                  onClick={() => onNavigate(tool.href)}
                  className="cursor-pointer px-3 py-2.5 mx-1 rounded-md gap-3"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md shrink-0 transition-transform group-hover:scale-110 ${TOOL_COLORS[tool.id]?.bg ?? 'bg-primary/10'}`}>
                    <Icon className={`h-4 w-4 ${TOOL_COLORS[tool.id]?.icon ?? 'text-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{tool.name}</span>
                      {isFeatured && <Star className="h-3 w-3 text-accent-foreground fill-accent shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{tool.description}</p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
          <DropdownMenuSeparator className="my-0" />
          <div className="px-2 py-1.5">
            <DropdownMenuItem 
              onClick={() => onNavigate('/tools')}
              className="cursor-pointer px-3 py-2 rounded-md justify-between text-primary font-medium text-sm"
            >
              <span>View All 50+ Tools</span>
              <ArrowRight className="h-4 w-4" />
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Bell */}
      {user && <NotificationBell />}

      {/* User menu or sign in button */}
      {user ? (
        !isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-medium">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-card backdrop-blur-xl border border-white/40 dark:border-border p-1.5">
              <DropdownMenuLabel className="flex items-center gap-3 py-3 px-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-medium">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{getDisplayName()}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('/analytics')} className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40 mb-0.5">
                <LayoutDashboard className="mr-2.5 h-4 w-4 text-cyan-500" />
                {t('nav.aiCoach')}
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => onNavigate('/admin')} className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 mb-0.5">
                  <Shield className="mr-2.5 h-4 w-4 text-violet-500" />
                  {t('nav.adminPanel')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onNavigate('/profile')} className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 mb-0.5">
                <User className="mr-2.5 h-4 w-4 text-emerald-500" />
                {t('nav.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('/feedback')} className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 mb-0.5">
                <MessageSquare className="mr-2.5 h-4 w-4 text-amber-500" />
                {t('nav.feedback')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 mb-0.5">
                <Settings className="mr-2.5 h-4 w-4 text-rose-500" />
                {t('nav.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSignOut()} className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40">
                <LogOut className="mr-2.5 h-4 w-4 text-red-500" />
                <span>{t('nav.signOut')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      ) : (
        <Button 
          size="sm"
          className="h-8 text-xs backdrop-blur-sm bg-primary hover:bg-primary/90" 
          onClick={() => onNavigate('/sign-in')}
        >
          {t('nav.signIn')}
        </Button>
      )}

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default HeaderActions;
