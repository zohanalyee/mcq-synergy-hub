import { Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderLogoProps {
  onNavigate?: (path: string) => void;
}

const HeaderLogo = (_: HeaderLogoProps) => {
  return (
    <Link
      to="/"
      className="flex-shrink-0 mr-2 sm:mr-6 hover:scale-105 transition-transform duration-300"
      aria-label="MCQSAI Home"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div
          className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-gradient shadow-brand"
          aria-label="MCQSAI Logo"
        >
          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
        </div>
        <span
          className="text-base sm:text-xl whitespace-nowrap font-bold tracking-tight"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          <span className="text-brand-gradient">MCQS</span>
          <span className="text-foreground">AI</span>
        </span>
      </div>
    </Link>
  );
};

export default HeaderLogo;
