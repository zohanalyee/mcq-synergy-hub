
import { BookOpen } from 'lucide-react';

interface HeaderLogoProps {
  onNavigate: (path: string) => void;
}

const HeaderLogo = ({ onNavigate }: HeaderLogoProps) => {
  return (
    <div 
      className="flex-shrink-0 cursor-pointer mr-6" 
      onClick={() => onNavigate('/')}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* Pakistani flag inspired design */}
          <div className="rounded-lg bg-gradient-to-br from-[#006A4E] to-[#228B22] p-1.5 text-white shadow-lg">
            <BookOpen className="h-5 w-5" />
          </div>
          {/* Small crescent and star decoration */}
          <div className="absolute -top-1 -right-1 text-white text-xs">⭐</div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gradient whitespace-nowrap">MCQs Point</span>
          <span className="text-xs text-muted-foreground font-urdu">تعلیمی مرکز</span>
        </div>
      </div>
    </div>
  );
};

export default HeaderLogo;
