
import { BrainCircuit, Sparkles } from 'lucide-react';

interface HeaderLogoProps {
  onNavigate: (path: string) => void;
}

const HeaderLogo = ({ onNavigate }: HeaderLogoProps) => {
  return (
    <div 
      className="flex-shrink-0 cursor-pointer mr-2 sm:mr-6 hover:scale-105 transition-transform duration-300" 
      onClick={() => onNavigate('/')}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1 sm:p-1.5 text-white animate-pulse drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]">
          <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
          <Sparkles className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-300" />
        </div>
        <span className="text-base sm:text-xl whitespace-nowrap font-bold tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">MCQS</span>
          <span className="text-foreground">AI</span>
        </span>
      </div>
    </div>
  );
};

export default HeaderLogo;
