
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PageBreadcrumbProps {
  items: {
    title: string;
    href: string;
    isCurrent?: boolean;
  }[];
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

const PageBreadcrumb = ({ 
  items, 
  showBackButton = true, 
  showHomeButton = true 
}: PageBreadcrumbProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // Don't show breadcrumb on home page
  if (isHomePage) return null;

  return (
    <motion.div 
      className="flex flex-wrap items-center gap-4 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showBackButton && (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 mr-2" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      )}
      
      {showHomeButton && !isHomePage && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 mr-2" 
          onClick={() => navigate('/')}
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
      )}
      
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <BreadcrumbItem key={index}>
              {item.isCurrent ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href} onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}>
                  {item.title}
                </BreadcrumbLink>
              )}
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </motion.div>
  );
};

export default PageBreadcrumb;
