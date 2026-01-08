
import { BookOpen } from 'lucide-react';

interface HeaderLogoProps {
  onNavigate: (path: string) => void;
}

const HeaderLogo = ({ onNavigate }: HeaderLogoProps) => {
  return (
    <div 
      className="flex-shrink-0 cursor-pointer mr-2 sm:mr-6" 
      onClick={() => onNavigate('/')}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-1 sm:p-1.5 text-white">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span className="text-base sm:text-xl font-bold text-gradient whitespace-nowrap">MCQs Point</span>
      </div>
    </div>
  );
};

export default HeaderLogo;
