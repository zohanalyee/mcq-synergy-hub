import { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BookOpen, 
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
  Sparkles
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
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const fontClass = isRTL ? 'font-nastaliq' : '';

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
      
      
      {/* Hero Section */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        animate="visible"
        className="pt-2 pb-4 md:pt-4 md:pb-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        
        {/* Made in Pakistan Badge */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute top-24 right-8 hidden lg:block z-10"
        >
          <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border">
            <span>🇵🇰</span>
            <span className="text-sm font-medium text-muted-foreground">{t('hero.madeInPakistan')}</span>
          </div>
        </motion.div>
        
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* AI Brand Icon */}
              <div className="relative mb-2 hidden md:flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-violet-500/20 blur-lg"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                  <BrainCircuit className="h-5 w-5 text-white" />
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
                </div>
              </div>
              
              <motion.span
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-violet-500/15 to-blue-500/15 text-primary border border-violet-500/20 rounded-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Sparkles className="h-3 w-3 text-violet-500 animate-pulse" />
                <span className="bg-gradient-to-r from-violet-600 via-blue-500 to-violet-600 bg-[length:500px_auto] animate-shimmer bg-clip-text text-transparent font-semibold">
                  {t('hero.badge')}
                </span>
              </motion.span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={cn("text-xl md:text-4xl lg:text-5xl font-bold mt-2 mb-2 md:mt-4 md:mb-4 tracking-tight", isRTL && "rtl-text font-nastaliq-heading")}
            >
              <span>{t('hero.title')} </span><span className="text-gradient text-gradient-animated">{t('hero.titleHighlight1')}</span> &amp; <span className="text-gradient text-gradient-animated">{t('hero.titleHighlight2')}</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:block text-base text-muted-foreground mb-6 max-w-2xl mx-auto"
            >
              {t('hero.subtitle')}
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
                    onClick={() => navigate(category.route)}
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
                <Button size="default" className="btn-shine" onClick={() => navigate('/get-started')}>
                  {t('hero.getStarted')}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button size="default" variant="outline" onClick={() => navigate('/subjects')}>
                  {t('hero.exploreSubjects')}
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
                  onClick={() => navigate(`/subject/${subject.title.toLowerCase()}`)}
                />
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={() => navigate('/subjects')}>
              View All Subjects
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
              <Button size="default" className="btn-shine" onClick={() => navigate('/get-started')}>
                Get Started Now
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.section>
      
      {/* Footer */}
      <Footer />
      <UserSatisfactionPopup />
      </div>
    </Header>
  );
};

export default Home;
