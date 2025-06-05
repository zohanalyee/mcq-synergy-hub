
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

interface NavItem {
  title: string;
  path: string;
}

interface DesktopNavigationProps {
  navItems: NavItem[];
  secondaryNavItems: NavItem[];
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
}

const DesktopNavigation = ({ navItems, secondaryNavItems, isActive, onNavigate }: DesktopNavigationProps) => {
  return (
    <NavigationMenu className="hidden md:flex mx-4">
      <NavigationMenuList>
        {navItems.map((item) => (
          <NavigationMenuItem key={item.title}>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              active={isActive(item.path)}
              onClick={() => onNavigate(item.path)}
            >
              {item.title}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}

        <NavigationMenuItem>
          <NavigationMenuTrigger>More</NavigationMenuTrigger>
          <NavigationMenuContent className="min-w-[200px]">
            <div className="grid grid-cols-1 gap-1 p-2">
              {secondaryNavItems.map((item) => (
                <Button
                  key={item.title}
                  variant="ghost"
                  className={`justify-start ${isActive(item.path) ? 'bg-accent' : ''}`}
                  onClick={() => onNavigate(item.path)}
                >
                  {item.title}
                </Button>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default DesktopNavigation;
