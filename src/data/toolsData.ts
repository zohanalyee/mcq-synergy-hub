import {
  Calculator, Calendar, Timer, StickyNote, GraduationCap, ArrowLeftRight,
  Activity, Percent, DollarSign, CreditCard, CalendarDays, Fuel, Receipt,
  Landmark, Tag, TrendingUp, TrendingDown, Award, PenTool, UserCheck,
  FileCheck, BookOpen, Grid3X3, Divide, Equal, LineChart, FileImage,
  Key, Type, Hash, CaseSensitive, User, Palette, Image, FileText,
  Clock, Globe, Shuffle, Heart, Hourglass, Maximize, Binary,
  Thermometer, Gauge, Square, Atom, QrCode, Coins,
  Wrench, LucideIcon, Merge, FileOutput, Building2, Moon,
  Target, Trophy, Wallet, HandCoins
} from 'lucide-react';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'Calculators' | 'Student Tools' | 'Productivity' | 'Converters' | 'Generators' | 'Student & Staff' | 'PDF Tools';
  icon: LucideIcon;
  popular?: boolean;
  href: string;
  seoDescription?: string;
  /** Overrides the generated `<title>` for keyword-led tools. Keep under 60 chars. */
  seoTitle?: string;
  /** Overrides the generated H1. Falls back to the generated string when absent. */
  h1?: string;
  howToUse?: string[];
  faq?: { q: string; a: string }[];
}


export const TOOL_CATEGORIES = [
  'All',
  'Student & Staff',
  'PDF Tools',
  'Calculators',
  'Student Tools',
  'Productivity',
  'Converters',
  'Generators',
] as const;

export const CATEGORY_COLORS: Record<string, { icon: string; border: string; bg: string; hover: string; badge: string }> = {
  'Student & Staff': {
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/60 dark:border-emerald-800/50',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    hover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    badge: 'text-emerald-700 dark:text-emerald-300',
  },
  'PDF Tools': {
    icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    border: 'border-orange-200/60 dark:border-orange-800/50',
    bg: 'bg-orange-50/50 dark:bg-orange-950/20',
    hover: 'hover:border-orange-400 dark:hover:border-orange-600',
    badge: 'text-orange-700 dark:text-orange-300',
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
  // === School Attendance System ===
  { id: 'school-attendance-system', name: 'School Attendance System', description: 'School & Staff Attendance Management System with PDF Reports', category: 'Student & Staff', icon: Building2, popular: true, href: '/tools/school-attendance-system',
    seoDescription: 'School & Staff Attendance Management System with PDF Reports. Free school attendance tool for daily staff attendance tracking, student attendance marking, leave management, and downloadable PDF attendance reports.',
    howToUse: ['Add your classes, students, and staff members', 'Mark daily student and staff attendance with one click', 'Track leaves, holidays, and generate PDF attendance reports'],
    faq: [
      { q: 'Is this attendance system free for Pakistani schools?', a: 'Yes — marking attendance, managing classes and exporting PDF reports are free, with no per-student licence.' },
      { q: 'Where is the attendance data stored?', a: 'Attendance is saved to your own account so the same register is available on any device you sign in from.' },
      { q: 'Can I print a monthly attendance register?', a: 'Yes — generate a PDF report for any date range and print or share it with the head teacher or education office.' },
    ] },

  // === Existing (7) ===
  { id: 'calculator', name: 'Calculator', description: 'Basic & scientific calculator', category: 'Calculators', icon: Calculator, popular: true, href: '/tools/math',
    seoDescription: 'Free online basic and scientific calculator. Perform arithmetic, trigonometry, logarithmic calculations instantly in your browser.',
    howToUse: ['Enter your mathematical expression', 'Use scientific functions for advanced calculations', 'View the result instantly'] },
  { id: 'age-calculator', name: 'Age Calculator', description: 'Calculate exact age from date of birth', category: 'Calculators', icon: Calendar, popular: true, href: '/tools/age-calculator',
    seoDescription: 'Calculate your exact age in years, months, and days from your date of birth. Free online age calculator with precise results.',
    howToUse: ['Enter your date of birth', 'Click Calculate', 'View your exact age in years, months, and days'],
    faq: [
      { q: 'Can I use this to check job or admission age eligibility?', a: 'Yes — enter your date of birth and the closing date to see your exact age in years, months and days on that date, which is how FPSC, PPSC and NTS compute eligibility.' },
      { q: 'Does it count leap years correctly?', a: 'Yes — the calculation is calendar-accurate and accounts for leap years and differing month lengths.' },
      { q: 'Is my date of birth stored anywhere?', a: 'No — the calculation runs entirely in your browser and nothing is uploaded.' },
    ] },
  { id: 'timer', name: 'Study Timer', description: 'Pomodoro & countdown timer', category: 'Productivity', icon: Timer, popular: true, href: '/tools/timer',
    seoDescription: 'Free Pomodoro study timer with customizable intervals. Boost focus and productivity with timed study sessions and breaks.',
    howToUse: ['Set your study and break duration', 'Click Start to begin the timer', 'Take breaks when prompted and track your sessions'] },
  { id: 'gpa-calculator', name: 'GPA Calculator', description: 'Calculate your GPA easily', category: 'Student Tools', icon: GraduationCap, popular: true, href: '/tools/gpa-calculator',
    seoDescription: 'Free GPA calculator for students. Enter your grades and credit hours to instantly calculate your Grade Point Average on a 4.0 scale.',
    howToUse: ['Add your courses with grades and credit hours', 'Click Calculate GPA', 'View your GPA on a 4.0 scale'],
    faq: [
      { q: 'Which GPA scale does this use?', a: 'The standard 4.0 scale used by most Pakistani universities (HEC-aligned): A = 4.0, B = 3.0, C = 2.0, D = 1.0.' },
      { q: 'Do credit hours change the result?', a: 'Yes — GPA is credit-weighted, so a 3-credit course affects your GPA more than a 1-credit course.' },
      { q: 'What if my university uses a different scale?', a: 'Convert your letter grades to their 4.0 equivalents from your transcript key first, then enter them here.' },
    ] },
  { id: 'unit-converter', name: 'Unit Converter', description: 'Convert between units', category: 'Converters', icon: ArrowLeftRight, popular: true, href: '/tools/units',
    seoDescription: 'Free online unit converter. Convert between length, weight, volume, temperature, and more units instantly.',
    howToUse: ['Select the unit category (length, weight, etc.)', 'Enter the value to convert', 'Choose source and target units to see the result'] },
  { id: 'notes', name: 'Quick Notes', description: 'Jot down notes quickly', category: 'Productivity', icon: StickyNote, popular: true, href: '/tools/notes',
    seoDescription: 'Free online notepad for quick notes. Write, save, and organize your study notes directly in the browser with no sign-up required.',
    howToUse: ['Start typing your notes', 'Notes are saved automatically in your browser', 'Copy or clear notes anytime'] },
  { id: 'calendar', name: 'Study Calendar', description: 'Plan your study schedule', category: 'Productivity', icon: Calendar, href: '/tools/calendar',
    seoDescription: 'Free online study calendar planner. Organize your exam dates, assignments, and study schedule in one place.',
    howToUse: ['Select a date on the calendar', 'Plan your study sessions and deadlines', 'Track upcoming exams and events'] },
  { id: 'islamic-calendar', name: 'Islamic (Hijri) Calendar', description: 'View Hijri dates & Islamic events', category: 'Productivity', icon: Moon, popular: true, href: '/tools/islamic-calendar',
    seoDescription: 'Free Islamic Hijri calendar converter. View today\'s Hijri date, upcoming Islamic events, and convert between Gregorian and Hijri dates.',
    howToUse: ['View the current Hijri date', 'Browse upcoming Islamic events and holidays', 'Convert between Gregorian and Hijri dates'] },
  { id: 'international-calendar', name: 'International Calendar', description: 'View dates in 10+ calendar systems worldwide', category: 'Productivity', icon: Globe, popular: true, href: '/tools/international-calendar',
    seoDescription: 'Free international calendar converter. View today\'s date in 10+ calendar systems including Hijri, Chinese, Hebrew, Persian, and more.',
    howToUse: ['Select a Gregorian date', 'View the equivalent date in multiple calendar systems', 'Compare dates across different cultures'] },

  // === Calculators (15 new) ===
  { id: 'bmi-calculator', name: 'BMI Calculator', description: 'Calculate Body Mass Index', category: 'Calculators', icon: Activity, popular: true, href: '/tools/bmi-calculator',
    seoDescription: 'Free online BMI calculator. Enter your height and weight to calculate your Body Mass Index and check your health category.',
    howToUse: ['Enter your height and weight', 'Select metric or imperial units', 'View your BMI and health category'] },
  { id: 'percentage-calculator', name: 'Percentage Calculator', description: 'Calculate percentages easily', category: 'Calculators', icon: Percent, popular: true, href: '/tools/percentage-calculator',
    seoDescription: 'Free online percentage calculator. Calculate what percent one number is of another, find percentage increase or decrease instantly.',
    howToUse: ['Enter the value and total', 'View the percentage result instantly', 'Copy the result to clipboard'],
    faq: [
      { q: 'How do I calculate exam percentage?', a: 'Divide marks obtained by total marks and multiply by 100 — e.g. 850 out of 1100 is 77.27%.' },
      { q: 'Can it work out percentage increase or decrease?', a: 'Yes — enter the old and new values to get the change as a percentage.' },
      { q: 'How many decimal places are shown?', a: 'Results are shown to two decimals, which matches how Pakistani boards report percentages.' },
    ] },
  { id: 'salary-calculator', name: 'Salary Calculator', description: 'Calculate monthly & annual salary', category: 'Calculators', icon: DollarSign, href: '/tools/salary-calculator',
    seoDescription: 'Free salary calculator. Convert between hourly, monthly, and annual salary. Calculate take-home pay after deductions.',
    howToUse: ['Enter your salary amount', 'Select the pay period (hourly, monthly, annual)', 'View converted salary across all periods'] },
  { id: 'emi-calculator', name: 'EMI Calculator', description: 'Calculate loan EMI payments', category: 'Calculators', icon: CreditCard, href: '/tools/emi-calculator',
    seoDescription: 'Free EMI calculator for loans. Calculate your monthly installment, total interest, and payment schedule for any loan amount.',
    howToUse: ['Enter loan amount, interest rate, and tenure', 'Click Calculate EMI', 'View monthly payment and total interest breakdown'] },
  { id: 'tip-calculator', name: 'Tip Calculator', description: 'Calculate tip amounts', category: 'Calculators', icon: Receipt, href: '/tools/tip-calculator',
    seoDescription: 'Free tip calculator. Calculate tip amount and split the bill among friends easily.',
    howToUse: ['Enter the bill amount', 'Select tip percentage', 'Split between people if needed'] },
  { id: 'loan-calculator', name: 'Loan Calculator', description: 'Calculate loan payments', category: 'Calculators', icon: Landmark, href: '/tools/loan-calculator',
    seoDescription: 'Free loan calculator. Calculate monthly payments, total interest, and amortization schedule for any loan.',
    howToUse: ['Enter loan amount and interest rate', 'Set the loan term in months or years', 'View your monthly payment and total cost'] },
  { id: 'discount-calculator', name: 'Discount Calculator', description: 'Calculate discounted prices', category: 'Calculators', icon: Tag, href: '/tools/discount-calculator',
    seoDescription: 'Free discount calculator. Calculate sale price, savings amount, and final price after applying any discount percentage.',
    howToUse: ['Enter the original price', 'Enter the discount percentage', 'View the sale price and amount saved'] },
  { id: 'bmr-calculator', name: 'BMR Calculator', description: 'Calculate Basal Metabolic Rate', category: 'Calculators', icon: Heart, href: '/tools/bmr-calculator',
    seoDescription: 'Free BMR calculator. Calculate your Basal Metabolic Rate to understand daily calorie needs based on age, gender, height, and weight.',
    howToUse: ['Enter your age, gender, height, and weight', 'Click Calculate', 'View your BMR and daily calorie needs'] },
  { id: 'duration-calculator', name: 'Duration Calculator', description: 'Calculate time duration', category: 'Calculators', icon: Hourglass, href: '/tools/duration-calculator',
    seoDescription: 'Free time duration calculator. Calculate the exact duration between two times or dates in hours, minutes, and seconds.',
    howToUse: ['Enter the start time or date', 'Enter the end time or date', 'View the exact duration breakdown'] },
  { id: 'ratio-calculator', name: 'Ratio Calculator', description: 'Calculate and simplify ratios', category: 'Calculators', icon: Maximize, href: '/tools/ratio-calculator',
    seoDescription: 'Free ratio calculator. Simplify ratios, find equivalent ratios, and solve ratio problems instantly.',
    howToUse: ['Enter two values', 'View the simplified ratio', 'Copy the result to use anywhere'] },
  { id: 'speed-calculator', name: 'Speed Calculator', description: 'Calculate speed, distance, time', category: 'Calculators', icon: Gauge, href: '/tools/speed-calculator',
    seoDescription: 'Free speed, distance, and time calculator. Calculate any value when you know the other two using the speed formula.',
    howToUse: ['Enter any two values (speed, distance, or time)', 'The third value is calculated automatically', 'Switch between metric and imperial units'] },
  { id: 'area-calculator', name: 'Area Calculator', description: 'Calculate area of shapes', category: 'Calculators', icon: Square, href: '/tools/area-calculator',
    seoDescription: 'Free area calculator for geometric shapes. Calculate area of circles, rectangles, triangles, and more with step-by-step formulas.',
    howToUse: ['Select a shape (circle, rectangle, triangle, etc.)', 'Enter the dimensions', 'View the calculated area with the formula used'] },
  { id: 'fraction-calculator', name: 'Fraction Calculator', description: 'Add, subtract, multiply fractions', category: 'Calculators', icon: Divide, href: '/tools/fraction-calculator',
    seoDescription: 'Free fraction calculator. Add, subtract, multiply, and divide fractions with step-by-step solutions and simplified results.',
    howToUse: ['Enter the numerator and denominator for each fraction', 'Select the operation (add, subtract, multiply, divide)', 'View the simplified result'] },
  { id: 'date-calculator', name: 'Date Calculator', description: 'Find days between dates', category: 'Calculators', icon: CalendarDays, href: '/tools/date-calculator',
    seoDescription: 'Free date calculator. Find the number of days, weeks, and months between two dates. Add or subtract days from any date.',
    howToUse: ['Enter the start date', 'Enter the end date', 'View the difference in days, weeks, and months'] },
  { id: 'fuel-calculator', name: 'Fuel Calculator', description: 'Calculate fuel cost & mileage', category: 'Calculators', icon: Fuel, href: '/tools/fuel-calculator',
    seoDescription: 'Free fuel cost calculator. Calculate fuel consumption, mileage, and trip cost based on distance and fuel price.',
    howToUse: ['Enter the distance of your trip', 'Enter your vehicle fuel efficiency', 'Enter fuel price to see total trip cost'] },

  // === Pakistan-specific high-intent calculators ===
  { id: 'aggregate-calculator', name: 'Aggregate Calculator', description: 'MDCAT, ECAT, NUST, NUMS & UHS aggregate', category: 'Student Tools', icon: Target, popular: true, href: '/tools/aggregate-calculator',
    seoTitle: 'MDCAT Aggregate Calculator 2026 — NUMS, UHS, ECAT & NUST',
    h1: 'MDCAT Aggregate Calculator 2026',
    seoDescription: 'Free MDCAT aggregate calculator for Pakistan — PMC, UHS, NUMS, ECAT and NUST NET formulas. Enter Matric, FSc and entry-test marks to get your aggregate % instantly.',
    howToUse: ['Pick your exam (MDCAT / ECAT / NUST / NUMS / UHS)', 'Enter Matric, FSc and entry-test marks', 'View aggregate % and admission-chance band'],
    faq: [
      { q: 'What is the aggregate formula for MDCAT?', a: 'The PMC standard aggregate is 10% Matric + 40% FSc + 50% MDCAT. Each component is converted to a percentage first, then weighted and added.' },
      { q: 'How do I calculate my MDCAT aggregate manually?', a: 'Convert each result to a percentage (obtained ÷ total × 100), then multiply Matric % by 0.10, FSc % by 0.40 and MDCAT % by 0.50 and add the three numbers.' },
      { q: 'Is this a PMC aggregate calculator?', a: 'Yes — the MDCAT option uses the PMC/PM&DC weightage (10/40/50) that Pakistani public medical colleges apply to open-merit lists.' },
      { q: 'Can I use it as an aggregate calculator for MBBS?', a: 'Yes. MBBS and BDS open-merit lists in Pakistan are built from the same MDCAT aggregate, so pick MDCAT (or UHS Punjab for Punjab colleges) and enter your marks.' },
      { q: 'How is the NUMS aggregate calculated?', a: 'NUMS also weights 10% Matric + 40% FSc + 50% NUMS entry test, but it uses its own test rather than the MDCAT score.' },
      { q: 'Does the UHS merit formula differ from PMC?', a: 'UHS Punjab applies the same 10% Matric + 40% FSc + 50% entry-test weightage; the difference is the merit list and closing aggregate, not the formula.' },
      { q: 'Is the NUST aggregate formula different?', a: 'Yes — NUST weights NET heavily: 75% NET + 15% FSc + 10% Matric, so the entry test matters far more than your board results.' },
      { q: 'What is the ECAT aggregate formula for UET?', a: 'UET Lahore and most Punjab engineering universities use 25% Matric + 45% FSc + 30% ECAT.' },
      { q: 'Should I enter marks or percentages?', a: 'Enter raw obtained marks along with the total (for example 950 out of 1100). The calculator converts each part to a percentage for you.' },
      { q: 'Are the admission chances guaranteed?', a: 'No. The bands are based on 2024 open-merit closing aggregates and are indicative only — always confirm against the official prospectus for the current session.' },
    ] },

  { id: 'merit-calculator', name: 'Merit Calculator', description: 'University merit with hafiz & quota bonuses', category: 'Student Tools', icon: Trophy, popular: true, href: '/tools/merit-calculator',
    seoDescription: 'Free Pakistani university merit calculator. Apply hafiz-e-Quran bonus, sports, disability, minorities and overseas quotas to your open-merit percentage.',
    howToUse: ['Enter your open-merit percentage', 'Toggle hafiz-e-Quran bonus if applicable', 'Pick your quota / category to see adjusted merit'],
    faq: [
      { q: 'How much is the hafiz bonus?', a: 'Most Pakistani boards award +20 marks (≈ +1.82% on a 1100-mark base) for verified hafiz-e-Quran candidates.' },
      { q: 'Do all universities accept these quotas?', a: 'Quota policies vary by institution and province. Confirm eligibility with the admission office.' },
    ] },
  { id: 'pakistan-tax-calculator', name: 'Pakistan Income Tax Calculator', description: 'FBR 2025-26 salaried income tax', category: 'Calculators', icon: Wallet, popular: true, href: '/tools/pakistan-tax-calculator',
    seoDescription: 'Free Pakistan income tax calculator using FBR 2025-26 salaried slabs. Get monthly and annual tax, effective rate and slab-wise breakdown in PKR.',
    howToUse: ['Pick monthly or annual salary', 'Enter your gross salary in PKR', 'View tax, take-home and slab-wise breakdown'],
    faq: [
      { q: 'Which slabs are used?', a: 'FBR 2025-26 salaried-individual slabs: 0% up to 600k, then 5%, 15%, 25%, 30% and 35% on the highest band.' },
      { q: 'Does this include super tax?', a: 'No. Super tax, surcharges and additional withholding are not applied — this is the base salaried income tax only.' },
      { q: 'Is this valid for business income?', a: 'No — the slabs used are for salaried individuals. Business and AOP income is taxed on different rates.' },
    ] },
  { id: 'zakat-calculator', name: 'Zakat Calculator', description: '2.5% Zakat on cash, gold & business assets', category: 'Calculators', icon: HandCoins, popular: true, href: '/tools/zakat-calculator',
    seoDescription: 'Free Zakat calculator for Pakistan. Compute 2.5% Zakat on cash, gold, silver and business assets with editable gold/silver nisab rates in PKR.',
    howToUse: ['Update today\'s gold and silver price per gram', 'Enter cash, gold, silver, business assets and liabilities', 'View Zakat due if you exceed nisab'],
    faq: [
      { q: 'Which nisab does the tool use?', a: 'Silver nisab (612.36 g) when you hold any silver, otherwise gold nisab (87.48 g) — the safer scholarly position.' },
      { q: 'Are the gold/silver prices live?', a: 'Defaults are indicative — update the price/gram fields to today\'s market rate before calculating.' },
      { q: 'Do I deduct loans and liabilities?', a: 'Yes — immediate debts payable are deducted from your zakatable assets before the 2.5% is applied.' },
    ] },


  // === Student Tools (10 new) ===
  { id: 'cgpa-calculator', name: 'CGPA Calculator', description: 'Calculate cumulative GPA', category: 'Student Tools', icon: GraduationCap, href: '/tools/cgpa-calculator',
    seoDescription: 'Free CGPA calculator. Calculate your Cumulative Grade Point Average across multiple semesters with easy semester-by-semester input.',
    howToUse: ['Add semesters with their GPA and credit hours', 'Click Calculate CGPA', 'View your cumulative GPA across all semesters'],
    faq: [
      { q: 'What is the difference between GPA and CGPA?', a: 'GPA covers one semester; CGPA is the credit-weighted average of every semester you have completed.' },
      { q: 'How is CGPA calculated?', a: 'Multiply each semester GPA by its credit hours, add the results, then divide by total credit hours.' },
      { q: 'Can I add an in-progress semester?', a: 'Yes — enter your expected GPA for it to see the projected CGPA before results are announced.' },
    ] },
  { id: 'gpa-to-percentage', name: 'GPA to Percentage', description: 'Convert GPA to percentage', category: 'Student Tools', icon: TrendingUp, href: '/tools/gpa-to-percentage',
    seoDescription: 'Free GPA to percentage converter. Convert your GPA on a 4.0 scale to percentage with multiple conversion formulas.',
    howToUse: ['Enter your GPA on a 4.0 scale', 'View the converted percentage', 'Copy the result to clipboard'],
    faq: [
      { q: 'Which formula converts GPA to percentage?', a: 'The common HEC-style approximation multiplies GPA by 25 (4.0 = 100%); some universities use their own transcript table, so confirm with yours.' },
      { q: 'Is a 3.0 GPA equal to 75%?', a: 'Under the ×25 method yes, but many Pakistani universities map 3.0 to roughly 70–75% — check your official conversion key.' },
      { q: 'Do foreign universities accept this conversion?', a: 'They usually require the conversion stated on your official transcript or an HEC equivalence letter, not a calculator result.' },
    ] },
  { id: 'percentage-to-gpa', name: 'Percentage to GPA', description: 'Convert percentage to GPA', category: 'Student Tools', icon: TrendingDown, href: '/tools/percentage-to-gpa',
    seoDescription: 'Free percentage to GPA converter. Convert your percentage score to GPA on a 4.0 scale instantly.',
    howToUse: ['Enter your percentage score', 'View the converted GPA', 'Copy the result to clipboard'],
    faq: [
      { q: 'How do I convert percentage to GPA?', a: 'Divide your percentage by 25 for the common 4.0-scale approximation — 80% becomes 3.2.' },
      { q: 'What GPA is 60% in Pakistan?', a: 'Roughly 2.4 on a 4.0 scale, though most universities publish their own band table.' },
      { q: 'Is the conversion exact?', a: 'No — it is an approximation. Your transcript conversion key is the authoritative value for admissions.' },
    ] },
  { id: 'grade-calculator', name: 'Grade Calculator', description: 'Calculate your final grade', category: 'Student Tools', icon: Award, href: '/tools/grade-calculator',
    seoDescription: 'Free grade calculator. Calculate your final grade based on weighted assignments, exams, and coursework.',
    howToUse: ['Add assignments with their scores and weights', 'Click Calculate', 'View your weighted final grade'] },
  { id: 'marks-calculator', name: 'Marks Calculator', description: 'Calculate total marks & percentage', category: 'Student Tools', icon: PenTool, href: '/tools/marks-calculator',
    seoDescription: 'Free marks calculator. Calculate total marks, percentage, and grade from your subject-wise scores.',
    howToUse: ['Enter marks obtained and total marks for each subject', 'View total marks and overall percentage', 'Check your grade based on the percentage'],
    faq: [
      { q: 'Can I calculate Matric or FSc marks with this?', a: 'Yes — enter each subject\'s obtained and total marks (e.g. out of 1100) to get your aggregate and percentage.' },
      { q: 'Which grade bands are used?', a: 'Standard Pakistani board bands: A+ 80%+, A 70–79%, B 60–69%, C 50–59%, D 40–49%, below 40% fail.' },
      { q: 'Does it handle practical marks?', a: 'Yes — add practicals as a separate subject row with their own obtained and total marks.' },
    ] },
  { id: 'attendance-calculator', name: 'Attendance Calculator', description: 'Track attendance percentage', category: 'Student Tools', icon: UserCheck, href: '/tools/attendance-calculator',
    seoDescription: 'Free attendance percentage calculator. Track how many classes you can miss and still meet the minimum attendance requirement.',
    howToUse: ['Enter total classes and classes attended', 'View your attendance percentage', 'Check how many more classes you can miss'],
    faq: [
      { q: 'What attendance percentage is required in Pakistan?', a: 'Most colleges and universities require 75% attendance to sit final exams — set that as your target.' },
      { q: 'How many classes can I miss?', a: 'The tool shows the number of remaining absences allowed before you fall below your required percentage.' },
      { q: 'Are approved leaves counted?', a: 'Only if your institution excludes them — enter them as attended if they are formally condoned.' },
    ] },
  { id: 'result-calculator', name: 'Result Calculator', description: 'Calculate exam results', category: 'Student Tools', icon: FileCheck, href: '/tools/result-calculator',
    seoDescription: 'Free exam result calculator. Calculate your exam results, total marks, percentage, and pass/fail status instantly.',
    howToUse: ['Enter your subject-wise marks', 'Set passing criteria', 'View your result with pass/fail status'],
    faq: [
      { q: 'What are passing marks on Pakistani boards?', a: 'Typically 33% per subject for Matric and Intermediate, though some boards and subjects differ.' },
      { q: 'Does this show my board result?', a: 'No — it calculates results from marks you enter. For official results, use your board\'s result portal.' },
      { q: 'Can I check a supplementary result?', a: 'Yes — enter the revised subject marks alongside your existing ones to see the updated total.' },
    ] },
  { id: 'formula-sheet', name: 'Formula Sheet', description: 'Common math & science formulas', category: 'Student Tools', icon: BookOpen, popular: true, href: '/tools/formula-sheet',
    seoDescription: 'Free comprehensive formula sheet for math and science. Quick reference for algebra, geometry, physics, and chemistry formulas.',
    howToUse: ['Browse formulas by subject category', 'Click on any formula to see details', 'Copy formulas for your assignments'] },
  { id: 'periodic-table', name: 'Periodic Table', description: 'Interactive periodic table', category: 'Student Tools', icon: Atom, popular: true, href: '/tools/periodic-table',
    seoDescription: 'Free interactive periodic table of elements. View atomic number, mass, electron configuration, and properties of all 118 elements.',
    howToUse: ['Browse the periodic table visually', 'Click on any element for details', 'Search elements by name or symbol'],
    faq: [
      { q: 'Is this useful for MDCAT and ECAT chemistry?', a: 'Yes — atomic number, mass, group, period and electron configuration cover what entry-test and board chemistry questions ask.' },
      { q: 'How many elements are included?', a: 'All 118 confirmed elements, grouped by category with their key properties.' },
      { q: 'Can I use it offline?', a: 'Once the page has loaded it works without further network requests in the same session.' },
    ] },
  { id: 'multiplication-table', name: 'Multiplication Table', description: 'Generate multiplication tables', category: 'Student Tools', icon: Grid3X3, href: '/tools/multiplication-table',
    seoDescription: 'Free multiplication table generator. Generate and print multiplication tables from 1 to 100 for quick math reference.',
    howToUse: ['Enter a number to generate its table', 'View the complete multiplication table', 'Print or copy the table'] },

  // === Converters (7 new) ===
  { id: 'currency-converter', name: 'Currency Converter', description: 'Convert between currencies', category: 'Converters', icon: Coins, popular: true, href: '/tools/currency-converter',
    seoDescription: 'Free currency converter with live exchange rates. Convert between USD, PKR, EUR, GBP, and 100+ currencies instantly.',
    howToUse: ['Select source and target currencies', 'Enter the amount to convert', 'View the converted amount with live rates'] },
  { id: 'temperature-converter', name: 'Temperature Converter', description: 'Convert °C, °F, K', category: 'Converters', icon: Thermometer, href: '/tools/temperature-converter',
    seoDescription: 'Free temperature converter. Convert between Celsius, Fahrenheit, and Kelvin instantly with the conversion formula shown.',
    howToUse: ['Enter the temperature value', 'Select the source unit (°C, °F, or K)', 'View conversions to all other units'] },
  { id: 'roman-converter', name: 'Roman Numeral Converter', description: 'Convert to/from Roman numerals', category: 'Converters', icon: Type, href: '/tools/roman-converter',
    seoDescription: 'Free Roman numeral converter. Convert numbers to Roman numerals and Roman numerals back to numbers instantly.',
    howToUse: ['Enter a number or Roman numeral', 'The conversion happens automatically', 'Copy the result to clipboard'] },
  { id: 'binary-converter', name: 'Binary Converter', description: 'Convert decimal to binary & more', category: 'Converters', icon: Binary, href: '/tools/binary-converter',
    seoDescription: 'Free binary converter. Convert between decimal, binary, octal, and hexadecimal number systems instantly.',
    howToUse: ['Enter a number in any base', 'View conversions to binary, decimal, octal, and hex', 'Copy any result to clipboard'] },
  { id: 'case-converter', name: 'Text Case Converter', description: 'Convert text case styles', category: 'Converters', icon: CaseSensitive, href: '/tools/case-converter',
    seoDescription: 'Free text case converter. Convert text to UPPERCASE, lowercase, Title Case, camelCase, and more styles instantly.',
    howToUse: ['Paste or type your text', 'Click the desired case style button', 'Copy the converted text'] },
  { id: 'image-resizer', name: 'Image Resizer', description: 'Resize images in browser', category: 'Converters', icon: Image, href: '/tools/image-resizer',
    seoDescription: 'Free online image resizer. Resize images to exact dimensions or by percentage right in your browser. No upload to server required.',
    howToUse: ['Upload an image from your device', 'Set the new width and height', 'Download the resized image'] },
  { id: 'image-compressor', name: 'Image Compressor', description: 'Compress images up to 80% instantly', category: 'Converters', icon: FileImage, popular: true, href: '/tools/image-compressor',
    seoDescription: 'Free online image compressor. Reduce image file size by up to 80% while maintaining quality. No server upload — works in your browser.',
    howToUse: ['Upload an image file', 'Adjust the compression quality slider', 'Download the compressed image'] },
  { id: 'image-converter', name: 'Image Converter', description: 'Convert between JPG, PNG & WebP', category: 'Converters', icon: Image, popular: true, href: '/tools/image-converter',
    seoDescription: 'Free online image format converter. Convert between JPG, PNG, and WebP formats instantly in your browser.',
    howToUse: ['Upload an image in any format', 'Select the target format (JPG, PNG, or WebP)', 'Download the converted image'] },

  // === PDF Tools ===
  { id: 'pdf-compressor', name: 'PDF Compressor', description: 'Reduce PDF file size instantly', category: 'PDF Tools', icon: FileOutput, popular: true, href: '/tools/pdf-compressor',
    seoDescription: 'Free online PDF compressor. Reduce PDF file size by up to 80% while maintaining document quality. Works entirely in your browser.',
    howToUse: ['Upload your PDF file', 'Select compression level', 'Download the compressed PDF'] },
  { id: 'pdf-merger', name: 'PDF Merger', description: 'Merge multiple PDFs into one', category: 'PDF Tools', icon: Merge, popular: true, href: '/tools/pdf-merger',
    seoDescription: 'Free online PDF merger. Combine multiple PDF files into a single document. Drag and drop to reorder pages.',
    howToUse: ['Upload multiple PDF files', 'Drag to reorder if needed', 'Click Merge and download the combined PDF'] },
  { id: 'pdf-to-text', name: 'PDF to Text', description: 'Extract text from PDF files', category: 'PDF Tools', icon: FileText, href: '/tools/pdf-to-text',
    seoDescription: 'Free PDF to text extractor. Extract all text content from PDF files instantly. Copy or download the extracted text.',
    howToUse: ['Upload a PDF file', 'Text is extracted automatically', 'Copy or download the extracted text'] },
  { id: 'pdf-splitter', name: 'PDF Splitter', description: 'Split PDFs by page ranges', category: 'PDF Tools', icon: FileOutput, popular: true, href: '/tools/pdf-splitter',
    seoDescription: 'Free online PDF splitter. Split PDF files by page ranges or extract individual pages. Works in your browser.',
    howToUse: ['Upload your PDF file', 'Enter the page range to extract', 'Download the split PDF'] },

  // === Productivity (4 new) ===
  { id: 'stopwatch', name: 'Stopwatch', description: 'Simple stopwatch with laps', category: 'Productivity', icon: Clock, href: '/tools/stopwatch',
    seoDescription: 'Free online stopwatch with lap timer. Measure elapsed time with millisecond precision and record lap times.',
    howToUse: ['Click Start to begin timing', 'Click Lap to record a lap time', 'Click Stop to pause and Reset to clear'] },
  { id: 'world-clock', name: 'World Clock', description: 'View time across timezones', category: 'Productivity', icon: Globe, href: '/tools/world-clock',
    seoDescription: 'Free world clock. View current time across 9+ major timezones including Karachi, New York, London, Dubai, and Tokyo.',
    howToUse: ['View current time across all major cities', 'Times update in real-time every second', 'Compare timezones at a glance'] },
  { id: 'word-counter', name: 'Word Counter', description: 'Count words and characters', category: 'Productivity', icon: Type, popular: true, href: '/tools/word-counter',
    seoDescription: 'Free online word counter. Count words, characters, sentences, and paragraphs. Estimate reading time for any text.',
    howToUse: ['Paste or type your text', 'View word, character, and sentence counts instantly', 'Check estimated reading time'] },
  { id: 'character-counter', name: 'Character Counter', description: 'Detailed character analysis', category: 'Productivity', icon: Hash, href: '/tools/character-counter',
    seoDescription: 'Free character counter with detailed analysis. Count total characters, letters, digits, spaces, uppercase, and lowercase separately.',
    howToUse: ['Paste or type your text', 'View detailed character breakdown instantly', 'Check uppercase, lowercase, digits, and special characters'] },

  // === Generators (6 new) ===
  { id: 'qr-generator', name: 'QR Code Generator', description: 'Generate real scannable QR codes from text', category: 'Generators', icon: QrCode, popular: true, href: '/tools/qr-generator',
    seoDescription: 'Free QR code generator. Create real scannable QR codes from any text, URL, or contact details. Download as PNG or SVG with custom colours and error correction.',
    howToUse: ['Enter your text or URL', 'Pick size, colours and error-correction level', 'Download as PNG or SVG, or share directly'],
    faq: [
      { q: 'Are the QR codes really scannable?', a: 'Yes. We use the standard QR (Reed–Solomon) encoder. Test by pointing any phone camera at the generated code.' },
      { q: 'Which error-correction level should I pick?', a: 'Use Medium (15%) for most cases. Use High (30%) if you plan to print small, add a logo, or expect the code to get scratched.' },
      { q: 'Can I use custom colours?', a: 'Yes — but keep good contrast between foreground and background, otherwise some scanners will fail.' },
      { q: 'Is my data sent to a server?', a: 'No. The QR is generated entirely in your browser. Nothing is uploaded.' },
    ],
  },
  { id: 'qr-scanner', name: 'QR Code Scanner', description: 'Scan QR codes with camera or image', category: 'Generators', icon: QrCode, popular: true, href: '/tools/qr-scanner',
    seoDescription: 'Free online QR code scanner. Decode QR codes using your phone camera or by uploading an image — works in the browser, no install.',
    howToUse: ['Tap Start Camera and allow access — or upload a photo of the QR', 'The decoded text or URL appears instantly', 'Copy it, or tap Open to follow a link'],
    faq: [
      { q: 'Why is my camera not working?', a: 'Most browsers only allow camera access on HTTPS. Allow camera permission in the address bar, or use the upload-image option instead.' },
      { q: 'Does the scanner work offline?', a: 'After the page loads, scanning runs entirely in your browser — no server round-trip.' },
      { q: 'Is my scan history saved anywhere?', a: 'Only on your own device in localStorage. Tap Clear to remove it.' },
      { q: 'Which QR formats are supported?', a: 'Standard QR codes including URLs, plain text, Wi-Fi credentials and contact (vCard/MeCard) payloads.' },
    ],
  },
  { id: 'password-generator', name: 'Password Generator', description: 'Generate strong passwords', category: 'Generators', icon: Key, popular: true, href: '/tools/password-generator',
    seoDescription: 'Free strong password generator. Generate secure random passwords with customizable length, symbols, numbers, and case options.',
    howToUse: ['Set your desired password length', 'Toggle uppercase, lowercase, numbers, and symbols', 'Click Generate and copy the password'] },
  { id: 'name-generator', name: 'Random Name Generator', description: 'Generate random names', category: 'Generators', icon: User, href: '/tools/name-generator',
    seoDescription: 'Free random name generator. Generate random first names and last names for creative projects, games, or testing.',
    howToUse: ['Select the number of names to generate', 'Click Generate', 'Copy names to clipboard'] },
  { id: 'color-picker', name: 'Color Picker', description: 'Pick and convert colors', category: 'Generators', icon: Palette, href: '/tools/color-picker',
    seoDescription: 'Free color picker tool. Pick colors visually and get HEX, RGB, and HSL values. Copy color codes instantly for web development.',
    howToUse: ['Use the color picker to select a color', 'View HEX, RGB, and HSL values', 'Copy the color code you need'] },
  { id: 'random-number', name: 'Random Number Generator', description: 'Generate random numbers', category: 'Generators', icon: Shuffle, href: '/tools/random-number',
    seoDescription: 'Free random number generator. Generate random numbers within any range for games, statistics, or decision making.',
    howToUse: ['Set the minimum and maximum range', 'Click Generate', 'View and copy the random number'] },
  { id: 'equation-solver', name: 'Equation Solver', description: 'Solve linear & quadratic equations', category: 'Generators', icon: Equal, href: '/tools/equation-solver',
    seoDescription: 'Free equation solver. Solve linear and quadratic equations with step-by-step solutions and visual graphs.',
    howToUse: ['Select equation type (linear or quadratic)', 'Enter the coefficients', 'View the solution with step-by-step explanation'] },
];

export const getRelatedTools = (currentId: string, count = 4): ToolDefinition[] => {
  const current = ALL_TOOLS.find(t => t.id === currentId);
  if (!current) return ALL_TOOLS.slice(0, count);
  
  const sameCategory = ALL_TOOLS.filter(t => t.id !== currentId && t.category === current.category);
  const others = ALL_TOOLS.filter(t => t.id !== currentId && t.category !== current.category);
  
  return [...sameCategory, ...others].slice(0, count);
};
