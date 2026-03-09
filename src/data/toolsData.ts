import {
  Calculator, Calendar, Timer, StickyNote, GraduationCap, ArrowLeftRight,
  Activity, Percent, DollarSign, CreditCard, CalendarDays, Fuel, Receipt,
  Landmark, Tag, TrendingUp, TrendingDown, Award, PenTool, UserCheck,
  FileCheck, BookOpen, Grid3X3, Divide, Equal, LineChart, FileImage,
  Key, Type, Hash, CaseSensitive, User, Palette, Image, FileText,
  Clock, Globe, Shuffle, Heart, Hourglass, Maximize, Binary,
  Thermometer, Gauge, Square, Atom, QrCode, Coins,
  Wrench, LucideIcon, Merge, FileOutput, Building2
} from 'lucide-react';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'Calculators' | 'Student Tools' | 'Productivity' | 'Converters' | 'Generators' | 'HR & Attendance';
  icon: LucideIcon;
  popular?: boolean;
  href: string;
}

export const TOOL_CATEGORIES = [
  'All',
  'HR & Attendance',
  'Calculators',
  'Student Tools',
  'Productivity',
  'Converters',
  'Generators',
] as const;

export const CATEGORY_COLORS: Record<string, { icon: string; border: string; bg: string; hover: string; badge: string }> = {
  'HR & Attendance': {
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/60 dark:border-emerald-800/50',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    hover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    badge: 'text-emerald-700 dark:text-emerald-300',
  },
  'Calculators': {
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    border: 'border-blue-200/60 dark:border-blue-800/50',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    hover: 'hover:border-blue-400 dark:hover:border-blue-600',
    badge: 'text-blue-700 dark:text-blue-300',
  },
  'Student Tools': {
    icon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/60 dark:border-violet-800/50',
    bg: 'bg-violet-50/50 dark:bg-violet-950/20',
    hover: 'hover:border-violet-400 dark:hover:border-violet-600',
    badge: 'text-violet-700 dark:text-violet-300',
  },
  'Productivity': {
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/60 dark:border-amber-800/50',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    hover: 'hover:border-amber-400 dark:hover:border-amber-600',
    badge: 'text-amber-700 dark:text-amber-300',
  },
  'Converters': {
    icon: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200/60 dark:border-cyan-800/50',
    bg: 'bg-cyan-50/50 dark:bg-cyan-950/20',
    hover: 'hover:border-cyan-400 dark:hover:border-cyan-600',
    badge: 'text-cyan-700 dark:text-cyan-300',
  },
  'Generators': {
    icon: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
    border: 'border-rose-200/60 dark:border-rose-800/50',
    bg: 'bg-rose-50/50 dark:bg-rose-950/20',
    hover: 'hover:border-rose-400 dark:hover:border-rose-600',
    badge: 'text-rose-700 dark:text-rose-300',
  },
};

export const ALL_TOOLS: ToolDefinition[] = [
  // === HR & Attendance System ===
  { id: 'hr-system', name: 'Attendance & HR System', description: 'Complete attendance tracking & HR management', category: 'HR & Attendance', icon: Building2, popular: true, href: '/tools/hr' },
  // === Existing (7) ===
  { id: 'calculator', name: 'Calculator', description: 'Basic & scientific calculator', category: 'Calculators', icon: Calculator, popular: true, href: '/tools/math' },
  { id: 'age-calculator', name: 'Age Calculator', description: 'Calculate exact age from date of birth', category: 'Calculators', icon: Calendar, popular: true, href: '/tools/age-calculator' },
  { id: 'timer', name: 'Study Timer', description: 'Pomodoro & countdown timer', category: 'Productivity', icon: Timer, popular: true, href: '/tools/timer' },
  { id: 'gpa-calculator', name: 'GPA Calculator', description: 'Calculate your GPA easily', category: 'Student Tools', icon: GraduationCap, popular: true, href: '/tools/gpa-calculator' },
  { id: 'unit-converter', name: 'Unit Converter', description: 'Convert between units', category: 'Converters', icon: ArrowLeftRight, popular: true, href: '/tools/units' },
  { id: 'notes', name: 'Quick Notes', description: 'Jot down notes quickly', category: 'Productivity', icon: StickyNote, popular: true, href: '/tools/notes' },
  { id: 'calendar', name: 'Study Calendar', description: 'Plan your study schedule', category: 'Productivity', icon: Calendar, href: '/tools/calendar' },

  // === Calculators (15 new) ===
  { id: 'bmi-calculator', name: 'BMI Calculator', description: 'Calculate Body Mass Index', category: 'Calculators', icon: Activity, popular: true, href: '/tools/bmi-calculator' },
  { id: 'percentage-calculator', name: 'Percentage Calculator', description: 'Calculate percentages easily', category: 'Calculators', icon: Percent, popular: true, href: '/tools/percentage-calculator' },
  { id: 'salary-calculator', name: 'Salary Calculator', description: 'Calculate monthly & annual salary', category: 'Calculators', icon: DollarSign, href: '/tools/salary-calculator' },
  { id: 'emi-calculator', name: 'EMI Calculator', description: 'Calculate loan EMI payments', category: 'Calculators', icon: CreditCard, href: '/tools/emi-calculator' },
  { id: 'tip-calculator', name: 'Tip Calculator', description: 'Calculate tip amounts', category: 'Calculators', icon: Receipt, href: '/tools/tip-calculator' },
  { id: 'loan-calculator', name: 'Loan Calculator', description: 'Calculate loan payments', category: 'Calculators', icon: Landmark, href: '/tools/loan-calculator' },
  { id: 'discount-calculator', name: 'Discount Calculator', description: 'Calculate discounted prices', category: 'Calculators', icon: Tag, href: '/tools/discount-calculator' },
  { id: 'bmr-calculator', name: 'BMR Calculator', description: 'Calculate Basal Metabolic Rate', category: 'Calculators', icon: Heart, href: '/tools/bmr-calculator' },
  { id: 'duration-calculator', name: 'Duration Calculator', description: 'Calculate time duration', category: 'Calculators', icon: Hourglass, href: '/tools/duration-calculator' },
  { id: 'ratio-calculator', name: 'Ratio Calculator', description: 'Calculate and simplify ratios', category: 'Calculators', icon: Maximize, href: '/tools/ratio-calculator' },
  { id: 'speed-calculator', name: 'Speed Calculator', description: 'Calculate speed, distance, time', category: 'Calculators', icon: Gauge, href: '/tools/speed-calculator' },
  { id: 'area-calculator', name: 'Area Calculator', description: 'Calculate area of shapes', category: 'Calculators', icon: Square, href: '/tools/area-calculator' },
  { id: 'fraction-calculator', name: 'Fraction Calculator', description: 'Add, subtract, multiply fractions', category: 'Calculators', icon: Divide, href: '/tools/fraction-calculator' },
  { id: 'date-calculator', name: 'Date Calculator', description: 'Find days between dates', category: 'Calculators', icon: CalendarDays, href: '/tools/date-calculator' },
  { id: 'fuel-calculator', name: 'Fuel Calculator', description: 'Calculate fuel cost & mileage', category: 'Calculators', icon: Fuel, href: '/tools/fuel-calculator' },

  // === Student Tools (10 new) ===
  { id: 'cgpa-calculator', name: 'CGPA Calculator', description: 'Calculate cumulative GPA', category: 'Student Tools', icon: GraduationCap, href: '/tools/cgpa-calculator' },
  { id: 'gpa-to-percentage', name: 'GPA to Percentage', description: 'Convert GPA to percentage', category: 'Student Tools', icon: TrendingUp, href: '/tools/gpa-to-percentage' },
  { id: 'percentage-to-gpa', name: 'Percentage to GPA', description: 'Convert percentage to GPA', category: 'Student Tools', icon: TrendingDown, href: '/tools/percentage-to-gpa' },
  { id: 'grade-calculator', name: 'Grade Calculator', description: 'Calculate your final grade', category: 'Student Tools', icon: Award, href: '/tools/grade-calculator' },
  { id: 'marks-calculator', name: 'Marks Calculator', description: 'Calculate total marks & percentage', category: 'Student Tools', icon: PenTool, href: '/tools/marks-calculator' },
  { id: 'attendance-calculator', name: 'Attendance Calculator', description: 'Track attendance percentage', category: 'Student Tools', icon: UserCheck, href: '/tools/attendance-calculator' },
  { id: 'result-calculator', name: 'Result Calculator', description: 'Calculate exam results', category: 'Student Tools', icon: FileCheck, href: '/tools/result-calculator' },
  { id: 'formula-sheet', name: 'Formula Sheet', description: 'Common math & science formulas', category: 'Student Tools', icon: BookOpen, popular: true, href: '/tools/formula-sheet' },
  { id: 'periodic-table', name: 'Periodic Table', description: 'Interactive periodic table', category: 'Student Tools', icon: Atom, popular: true, href: '/tools/periodic-table' },
  { id: 'multiplication-table', name: 'Multiplication Table', description: 'Generate multiplication tables', category: 'Student Tools', icon: Grid3X3, href: '/tools/multiplication-table' },

  // === Converters (7 new) ===
  { id: 'currency-converter', name: 'Currency Converter', description: 'Convert between currencies', category: 'Converters', icon: Coins, popular: true, href: '/tools/currency-converter' },
  { id: 'temperature-converter', name: 'Temperature Converter', description: 'Convert °C, °F, K', category: 'Converters', icon: Thermometer, href: '/tools/temperature-converter' },
  { id: 'roman-converter', name: 'Roman Numeral Converter', description: 'Convert to/from Roman numerals', category: 'Converters', icon: Type, href: '/tools/roman-converter' },
  { id: 'binary-converter', name: 'Binary Converter', description: 'Convert decimal to binary & more', category: 'Converters', icon: Binary, href: '/tools/binary-converter' },
  { id: 'case-converter', name: 'Text Case Converter', description: 'Convert text case styles', category: 'Converters', icon: CaseSensitive, href: '/tools/case-converter' },
  { id: 'image-resizer', name: 'Image Resizer', description: 'Resize images in browser', category: 'Converters', icon: Image, href: '/tools/image-resizer' },
  { id: 'image-compressor', name: 'Image Compressor', description: 'Compress images up to 80% instantly', category: 'Converters', icon: FileImage, popular: true, href: '/tools/image-compressor' },
  { id: 'pdf-compressor', name: 'PDF Compressor', description: 'Reduce PDF file size instantly', category: 'Converters', icon: FileOutput, popular: true, href: '/tools/pdf-compressor' },
  { id: 'pdf-merger', name: 'PDF Merger', description: 'Merge multiple PDFs into one', category: 'Converters', icon: Merge, popular: true, href: '/tools/pdf-merger' },
  { id: 'image-converter', name: 'Image Converter', description: 'Convert between JPG, PNG & WebP', category: 'Converters', icon: Image, popular: true, href: '/tools/image-converter' },
  { id: 'pdf-to-text', name: 'PDF to Text', description: 'Extract text from PDF files', category: 'Converters', icon: FileText, href: '/tools/pdf-to-text' },
  { id: 'pdf-splitter', name: 'PDF Splitter', description: 'Split PDFs by page ranges', category: 'Converters', icon: FileOutput, popular: true, href: '/tools/pdf-splitter' },

  // === Productivity (4 new) ===
  { id: 'stopwatch', name: 'Stopwatch', description: 'Simple stopwatch with laps', category: 'Productivity', icon: Clock, href: '/tools/stopwatch' },
  { id: 'world-clock', name: 'World Clock', description: 'View time across timezones', category: 'Productivity', icon: Globe, href: '/tools/world-clock' },
  { id: 'word-counter', name: 'Word Counter', description: 'Count words and characters', category: 'Productivity', icon: Type, popular: true, href: '/tools/word-counter' },
  { id: 'character-counter', name: 'Character Counter', description: 'Detailed character analysis', category: 'Productivity', icon: Hash, href: '/tools/character-counter' },

  // === Generators (6 new) ===
  { id: 'qr-generator', name: 'QR Code Generator', description: 'Generate QR codes from text', category: 'Generators', icon: QrCode, popular: true, href: '/tools/qr-generator' },
  { id: 'password-generator', name: 'Password Generator', description: 'Generate strong passwords', category: 'Generators', icon: Key, popular: true, href: '/tools/password-generator' },
  { id: 'name-generator', name: 'Random Name Generator', description: 'Generate random names', category: 'Generators', icon: User, href: '/tools/name-generator' },
  { id: 'color-picker', name: 'Color Picker', description: 'Pick and convert colors', category: 'Generators', icon: Palette, href: '/tools/color-picker' },
  { id: 'random-number', name: 'Random Number Generator', description: 'Generate random numbers', category: 'Generators', icon: Shuffle, href: '/tools/random-number' },
  { id: 'equation-solver', name: 'Equation Solver', description: 'Solve linear & quadratic equations', category: 'Generators', icon: Equal, href: '/tools/equation-solver' },
];

export const getRelatedTools = (currentId: string, count = 4): ToolDefinition[] => {
  const current = ALL_TOOLS.find(t => t.id === currentId);
  if (!current) return ALL_TOOLS.slice(0, count);
  
  const sameCategory = ALL_TOOLS.filter(t => t.id !== currentId && t.category === current.category);
  const others = ALL_TOOLS.filter(t => t.id !== currentId && t.category !== current.category);
  
  return [...sameCategory, ...others].slice(0, count);
};
