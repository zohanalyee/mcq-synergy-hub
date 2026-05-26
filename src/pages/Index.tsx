import { useState, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import useTheme from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import SubjectCard from '@/components/SubjectCard';
import FeatureCard from '@/components/FeatureCard';
import TestCategoryCard from '@/components/TestCategoryCard';
import AnimatedCounter from '@/components/AnimatedCounter';
import TestimonialsSection from '@/components/reviews/TestimonialsSection';
import HeroStatsSection from '@/components/home/HeroStatsSection';
import PlatformStatsSection from '@/components/home/PlatformStatsSection';
import UserSatisfactionPopup from '@/components/UserSatisfactionPopup';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { getLocalizedGreeting } from '@/lib/greetings';
import TypewriterText from '@/components/TypewriterText';
import UpcomingFreeBanner from '@/components/home/UpcomingFreeBanner';
import { 
  BookOpen, 
  Brain,
  BrainCircuit, 
  Trophy, 
  BarChart3, 
  Timer, 
  Layers, 
  Workflow, 
  Rocket, 
  PersonStanding, 
  ShieldCheck, 
  LayoutGrid,
  ListChecks,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  FileText,
  Landmark,
  ShieldAlert
} from 'lucide-react';

// Stagger container variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

// Section reveal variants
const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const Home = () => {
  const { theme, setTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, tr, isRTL, language } = useLanguage();
  const fontClass = isRTL ? 'font-nastaliq' : '';
  const displayName = profile?.username || user?.email?.split('@')[0] || null;
  const greeting = user ? getLocalizedGreeting(language, displayName) : null;

  // Time-of-day greeting for typewriter
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const heroPhrases = [
    ...(displayName ? [`${timeGreeting}, ${displayName}! 👋`] : []),
    'Ace your Board Exams 📚',
    'Crack Govt Job Tests 🏢',
    'Generate Custom AI Tests 🤖',
  ];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const subjects = [
    {
      title: "Mathematics",
      icon: <BrainCircuit size={24} className="text-blue-600" />,
      description: "Algebra, Calculus, Geometry, Statistics and more",
      topicCount: 24,
      color: "#3b82f6"
    },
    {
      title: "Physics",
      icon: <Rocket size={24} className="text-indigo-600" />,
      description: "Mechanics, Thermodynamics, Electromagnetism",
      topicCount: 18,
      color: "#6366f1"
    },
    {
      title: "Chemistry",
      icon: <Layers size={24} className="text-emerald-600" />,
      description: "Organic, Inorganic, Physical Chemistry",
      topicCount: 16,
      color: "#10b981"
    },
    {
      title: "Biology",
      icon: <PersonStanding size={24} className="text-rose-600" />,
      description: "Cell Biology, Genetics, Human Physiology",
      topicCount: 20,
      color: "#f43f5e"
    }
  ];

  const testCategories = [
    {
      title: "Competitive Exams",
      description: "Practice full-length job recruitment and exam simulations",
      icon: <Timer size={32} className="text-white" />,
      bgClass: "bg-gradient-to-br from-blue-600 to-blue-400 text-white",
      route: "/mock-tests"
    },
    {
      title: "Subject-wise Practice",
      description: "Focus on specific subjects to strengthen your knowledge",
      icon: <BookOpen size={32} className="text-white" />,
      bgClass: "bg-gradient-to-br from-purple-600 to-purple-400 text-white",
      route: "/subjects"
    },
    {
      title: "Custom Syllabus Builder",
      description: "Create your own syllabus by selecting from multiple subjects and topics",
      icon: <ListChecks size={32} className="text-white" />,
      bgClass: "bg-gradient-to-br from-amber-600 to-amber-400 text-white",
      route: "/custom-syllabus"
    }
  ];

  const features = [
    {
      title: "Custom Syllabus Creation",
      description: "Build your own test syllabus by selecting from multiple subjects and topics.",
      icon: <LayoutGrid size={20} />,
      iconColor: "from-blue-500 to-indigo-600",
    },
    {
      title: "Immediate Feedback",
      description: "Get instant feedback after each question or at the end of the test.",
      icon: <CheckCircle2 size={20} />,
      iconColor: "from-emerald-500 to-teal-600",
    },
    {
      title: "Performance Analytics",
      description: "Visualize your performance with detailed charts and progress tracking.",
      icon: <BarChart3 size={20} />,
      iconColor: "from-violet-500 to-purple-600",
    },
    {
      title: "Gamified Learning",
      description: "Earn badges and compete on leaderboards to stay motivated.",
      icon: <Trophy size={20} />,
      iconColor: "from-amber-500 to-orange-600",
    },
    {
      title: "Smart Study Plans",
      description: "Get personalized study plans based on your performance.",
      icon: <Workflow size={20} />,
      iconColor: "from-rose-500 to-pink-600",
    },
    {
      title: "Exam Strategies",
      description: "Learn proven strategies for tackling different types of MCQs.",
      icon: <ShieldCheck size={20} />,
      iconColor: "from-cyan-500 to-blue-600",
    }
  ];


  const displaySubjects = subjects;

  return (
    <Header theme={theme} setTheme={setTheme}>
       <div className={`min-h-screen bg-background ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}>
      <SEOHead
        title="AI-Powered MCQ Practice Platform"
        description="Free AI MCQ practice for NTS, FPSC, PPSC, MDCAT, ECAT, Matric & FSc. 10,000+ questions with instant feedback. No signup needed — MCQsAI Pakistan."
        keywords="MDCAT MCQs, ECAT preparation, CSS exam, PPSC test, NTS practice, Pakistan exams, اردو MCQs, AI learning, MCQSAI"
      />

      <UpcomingFreeBanner />

      {/* Hero Section */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        animate="visible"
        className="pt-10 pb-4 md:pt-16 md:pb-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        
        
        {/* AI Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />
        
        {/* Animated glowing orbs */}
        <motion.div
          className="absolute -top-16 -right-16 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-12 -left-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <TypewriterText
              phrases={heroPhrases}
              className={cn(
                "text-base md:text-xl font-semibold text-brand-gradient mb-3 md:mb-4 text-center",
                isRTL && "font-nastaliq-heading"
              )}
              minHeightClass="min-h-[2.25rem] md:min-h-[2.75rem]"
              as="h2"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <motion.span
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-violet-500/15 to-blue-500/15 text-primary border border-violet-500/20 rounded-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Sparkles className="h-3 w-3 text-violet-500 animate-pulse" />
                <span className="bg-gradient-to-r from-violet-600 via-blue-500 to-violet-600 bg-[length:500px_auto] animate-shimmer bg-clip-text text-transparent font-semibold">
                  {tr('hero.badge')}
                </span>
              </motion.span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={cn("text-xl md:text-4xl lg:text-5xl font-bold mt-2 mb-2 md:mt-4 md:mb-4 tracking-tight text-center", isRTL && "font-nastaliq-heading")}
            >
              {language === 'en' ? (
                <>
                  <span>{t('hero.title')} </span>
                  <span className="brand-mcqsai">{t('hero.brandName')}</span>
                  <span> {t('hero.titleSuffix')} </span>
                  <span className="text-gradient text-gradient-animated">{t('hero.titleHighlight1')}</span>
                  <span> & </span>
                  <span className="text-gradient text-gradient-animated">{t('hero.titleHighlight2')}</span>
                </>
              ) : (
                <>
                  <span>{tr('hero.title')} </span>
                  <span className="text-gradient text-gradient-animated">{tr('hero.titleHighlight1')}</span>
                  {language === 'sd' ? ' ۽ ' : ' اور '}
                  <span className="text-gradient text-gradient-animated">{tr('hero.titleHighlight2')}</span>
                  <span> {tr('hero.titleSuffix')} </span>
                  <span className="brand-mcqsai">{t('hero.brandName')}</span>
                  <span> {tr('hero.titlePrefix')}</span>
                </>
              )}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={cn("hidden md:block text-base text-muted-foreground mb-6 max-w-2xl mx-auto text-center", isRTL && "font-nastaliq")}
            >
              {tr('hero.subtitle')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-2 md:mb-6"
            >
              <h2 className="hidden md:block text-xl font-bold mb-3">{t('hero.prepareYourWay')}</h2>
              {/* Hero Cards - Stack on mobile, row on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-4">
                {testCategories.map((category, index) => (
                  <TestCategoryCard
                    key={category.title}
                    title={category.title}
                    description={category.description}
                    icon={category.icon}
                    bgClass={category.bgClass}
                    to={category.route}
                  />
                ))}
              </div>
              
              {/* Stats Section */}
              <HeroStatsSection />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="hidden sm:flex flex-row gap-3 justify-center"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button asChild size="default" className="btn-shine">
                  <Link to="/boards">{t('hero.getStarted')}</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button asChild size="default" variant="outline">
                  <Link to="/subjects">{t('hero.exploreSubjects')}</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-1/2 left-10 transform -translate-y-1/2 hidden lg:block">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-32 h-32 rounded-full bg-primary/20 backdrop-blur-sm"
            style={{ filter: 'blur(40px)' }}
          />
        </div>
        <div className="absolute bottom-20 right-10 hidden lg:block">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="w-40 h-40 rounded-full bg-accent/20 backdrop-blur-sm"
            style={{ filter: 'blur(40px)' }}
          />
        </div>
      </motion.section>
      
      {/* Subjects Section */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="py-5"
      >
        <div className="container px-4 mx-auto">
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold mb-2">Popular Subjects</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Explore our comprehensive collection of subjects and topics
            </p>
          </div>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-3 md:grid-cols-4 gap-2"
          >
            {displaySubjects.map((subject) => (
              <motion.div key={subject.title} variants={staggerItem}>
                <SubjectCard
                  title={subject.title}
                  icon={subject.icon}
                  description={subject.description}
                  topicCount={subject.topicCount}
                  color={subject.color}
                />
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-4 text-center">
            <Button asChild variant="outline" size="sm">
              <Link to="/subjects">View All Subjects</Link>
            </Button>
          </div>
        </div>
      </motion.section>
      
      {/* Features Section */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="py-5 bg-muted/50"
      >
        <div className="container px-4 mx-auto">
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold mb-2">Powerful Features</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Tools designed to maximize your learning efficiency
            </p>
          </div>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 md:grid-cols-3 gap-2"
          >
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={staggerItem}>
                <FeatureCard
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  iconColor={feature.iconColor}
                  delay={index}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
      
      {/* Stats Section */}
      <PlatformStatsSection />
      
      {/* Testimonials Section - Real Reviews */}
      <TestimonialsSection />
      
      {/* CTA Section */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="py-5 bg-muted/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none" />
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Transform Your Test Preparation?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Join thousands of students who have improved their test scores with MCQSAI.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button asChild size="default" className="btn-shine">
                <Link to="/boards">Get Started Now</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* SEO Landing Pages — Internal Links */}
      <section className="py-8 bg-background border-t">
        <div className="container px-4 mx-auto max-w-5xl">
          <h2 className="text-lg font-bold mb-6 text-center">Popular Exam Preparations</h2>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">University Entry Tests</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'NUST Entry Test', url: '/nust-entry-test' },
                { label: 'Punjab University', url: '/punjab-university-entry-test' },
                { label: 'COMSATS Entry Test', url: '/comsats-entry-test' },
                { label: 'Sindh Universities', url: '/sindh-universities-entry-test' },
                { label: 'Engineering Unis', url: '/engineering-universities-entry-test' },
                { label: 'MDCAT Syllabus', url: '/mdcat-syllabus' },
                { label: 'ECAT Preparation', url: '/ecat-preparation' },
                { label: '9th Class MCQs', url: '/9th-class-mcqs' },
              ].map(link => (
                <Link key={link.url} to={link.url} className="px-3 py-1.5 text-sm border rounded-full hover:bg-primary/5 hover:border-primary/40 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Past Papers</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'MDCAT Past Papers', url: '/mdcat-past-papers' },
                { label: 'PPSC Past Papers', url: '/ppsc-past-papers' },
                { label: 'FPSC Past Papers', url: '/fpsc-past-papers' },
                { label: 'CSS MCQs', url: '/css-mcqs-practice' },
              ].map(link => (
                <Link key={link.url} to={link.url} className="px-3 py-1.5 text-sm border rounded-full hover:bg-primary/5 hover:border-primary/40 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Teaching & Board Exams</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'PST & SST Test', url: '/pst-sst-test-preparation' },
                { label: 'Board MCQs', url: '/board-mcqs' },
              ].map(link => (
                <Link key={link.url} to={link.url} className="px-3 py-1.5 text-sm border rounded-full hover:bg-primary/5 hover:border-primary/40 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Forces & Government Jobs</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Pak Army Test', url: '/pak-army-test' },
                { label: 'PAF Test', url: '/paf-test' },
                { label: 'ASF Test', url: '/asf-test' },
                { label: 'Navy/Rangers/FIA', url: '/forces-jobs-tests' },
              ].map(link => (
                <Link key={link.url} to={link.url} className="px-3 py-1.5 text-sm border rounded-full hover:bg-primary/5 hover:border-primary/40 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      <UserSatisfactionPopup />
      </div>
    </Header>
  );
};

export default Home;
