import { useFloatingTools } from '@/contexts/FloatingToolsContext';
import FloatingToolWindow from './FloatingToolWindow';
import FloatingCalendar from './FloatingCalendar';
import FloatingCalculator from './FloatingCalculator';
import FloatingAgeCalculator from './FloatingAgeCalculator';
import FloatingTimer from './FloatingTimer';
import FloatingGPACalculator from './FloatingGPACalculator';
import FloatingUnitConverter from './FloatingUnitConverter';
import FloatingNotes from './FloatingNotes';
import { Calendar, Calculator, Cake, Timer, GraduationCap, Ruler, StickyNote } from 'lucide-react';

export const toolsConfig = {
  calendar: {
    name: 'Calendar',
    icon: <Calendar className="h-4 w-4" />,
    color: '#0ea5e9', // sky-500
    component: FloatingCalendar,
  },
  math: {
    name: 'Calculator',
    icon: <Calculator className="h-4 w-4" />,
    color: '#10b981', // emerald-500
    component: FloatingCalculator,
  },
  'age-calculator': {
    name: 'Age Calculator',
    icon: <Cake className="h-4 w-4" />,
    color: '#f43f5e', // rose-500
    component: FloatingAgeCalculator,
  },
  timer: {
    name: 'Timer',
    icon: <Timer className="h-4 w-4" />,
    color: '#f59e0b', // amber-500
    component: FloatingTimer,
  },
  'gpa-calculator': {
    name: 'GPA Calculator',
    icon: <GraduationCap className="h-4 w-4" />,
    color: '#8b5cf6', // violet-500
    component: FloatingGPACalculator,
  },
  units: {
    name: 'Unit Converter',
    icon: <Ruler className="h-4 w-4" />,
    color: '#3b82f6', // blue-500
    component: FloatingUnitConverter,
  },
  notes: {
    name: 'Notes',
    icon: <StickyNote className="h-4 w-4" />,
    color: '#eab308', // yellow-500
    component: FloatingNotes,
  },
} as const;

export type ToolId = keyof typeof toolsConfig;

const FloatingToolsRenderer = () => {
  const { openTools, closeTool, toggleMinimize, bringToFront } = useFloatingTools();

  return (
    <>
      {openTools.map((tool, index) => {
        const config = toolsConfig[tool.id as ToolId];
        if (!config) return null;

        const Component = config.component;
        const baseBottom = 80; // Above mobile nav
        const baseRight = 16;
        
        // Stack minimized windows horizontally, expanded windows vertically
        const style = tool.isMinimized
          ? { bottom: baseBottom, right: baseRight + index * 200 }
          : { bottom: baseBottom, right: baseRight };

        return (
          <FloatingToolWindow
            key={tool.id}
            id={tool.id}
            title={config.name}
            icon={config.icon}
            color={config.color}
            isMinimized={tool.isMinimized}
            style={style}
            onMinimize={() => toggleMinimize(tool.id)}
            onClose={() => closeTool(tool.id)}
            onFocus={() => bringToFront(tool.id)}
          >
            <Component />
          </FloatingToolWindow>
        );
      })}
    </>
  );
};

export default FloatingToolsRenderer;
