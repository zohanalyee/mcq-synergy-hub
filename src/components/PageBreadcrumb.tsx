
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageBreadcrumbProps {
  items: {
    title: string;
    href: string;
    isCurrent?: boolean;
  }[];
  showBackButton?: boolean;
}

const PageBreadcrumb = ({ items, showBackButton = true }: PageBreadcrumbProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 mb-6">
      {showBackButton && (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
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
    </div>
  );
};

export default PageBreadcrumb;
