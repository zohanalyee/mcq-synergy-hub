import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import SubjectCard from '@/components/SubjectCard';
import FeatureCard from '@/components/FeatureCard';
import TestCategoryCard from '@/components/TestCategoryCard';
import AnimatedCounter from '@/components/AnimatedCounter';
import TestimonialCard from '@/components/TestimonialCard';
import HeroStatsSection from '@/components/home/HeroStatsSection';
import PlatformStatsSection from '@/components/home/PlatformStatsSection';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  CheckCircle2
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
      bgClass: "bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 text-white",
      route: "/mock-tests"
    },
    {
      title: "Subject-wise Practice",
      description: "Focus on specific subjects to strengthen your knowledge",
      icon: <BookOpen size={32} className="text-white" />,
      bgClass: "bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 text-white",
      route: "/subjects"
    },
    {
      title: "Custom Syllabus Builder",
      description: "Create your own syllabus by selecting from multiple subjects and topics",
      icon: <ListChecks size={32} className="text-white" />,
      bgClass: "bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 text-white",
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

  const testimonials = [
    {
      content: "MCQs Point helped me prepare efficiently for my medical entrance exam. The analytics feature showed me exactly where I needed to improve.",
      author: "Sarah Johnson",
      role: "Medical Student",
      rating: 5
    },
    {
      content: "The custom syllabus feature is a game-changer. I could focus on my weak areas and track my progress in real-time.",
      author: "Michael Chen",
      role: "Engineering Student",
      rating: 5
    },
    {
      content: "I improved my test scores by 20% after just a month of consistent practice on MCQs Point. The immediate feedback helps correct misconceptions.",
      author: "Priya Sharma",
      role: "CSS Aspirant",
      rating: 4
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
        className="pt-2 pb-4 md:pt-4 md:pb-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950"
      >
        {/* Pakistani heritage background overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.12] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url('/images/hero-bg-pakistan.jpg')" }}
        />
        
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white/90 rounded-full border border-indigo-400/50 bg-indigo-500/20 backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                ✨ AI-Powered Platform
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl md:text-4xl lg:text-5xl font-bold mt-3 mb-2 md:mt-5 md:mb-4 tracking-tight text-white"
            >
              Conquer Your Exams with{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI-Driven
              </span>{" "}
              Precision
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:block text-base text-white/70 mb-6 max-w-2xl mx-auto"
            >
              Pakistan's smartest MCQ platform. Personalize your syllabus, get instant RAG-based question generation, and track your progress in real-time.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-2 md:mb-6"
            >
              <h2 className="hidden md:block text-xl font-bold mb-3 text-white">Prepare Your Way</h2>
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
              
              <HeroStatsSection />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="hidden sm:flex flex-row gap-3 justify-center"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button size="default" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25" onClick={() => navigate('/get-started')}>
                  Get Started
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button size="default" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('/subjects')}>
                  Explore Subjects
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Floating glow orbs */}
        <div className="absolute top-1/3 left-10 hidden lg:block">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="w-36 h-36 rounded-full bg-indigo-500/30"
            style={{ filter: 'blur(60px)' }}
          />
        </div>
        <div className="absolute bottom-16 right-10 hidden lg:block">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1.5, delay: 0.7 }}
            className="w-44 h-44 rounded-full bg-emerald-500/20"
            style={{ filter: 'blur(60px)' }}
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
      
      {/* Testimonials Section */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="py-5"
      >
        <div className="container px-4 mx-auto">
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold mb-2">What Our Users Say</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Hear from students who transformed their test preparation
            </p>
          </div>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-2"
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.author} variants={staggerItem}>
                <TestimonialCard
                  content={testimonial.content}
                  author={testimonial.author}
                  role={testimonial.role}
                  rating={testimonial.rating}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
      
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
              Join thousands of students who have improved their test scores with MCQs Point.
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
      <footer className="py-8 border-t bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-bold mb-2 text-gradient">MCQs Point</h3>
              <p className="text-xs text-muted-foreground">Your intelligent companion for MCQ-based test preparation.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Quick Links</h3>
              <ul className="space-y-1.5">
                <li><button onClick={() => navigate('/')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Home</button></li>
                <li><button onClick={() => navigate('/subjects')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Subjects</button></li>
                <li><button onClick={() => navigate('/mock-tests')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Recruitment Tests</button></li>
                <li><button onClick={() => navigate('/analytics')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Analytics</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Resources</h3>
              <ul className="space-y-1.5">
                <li><button onClick={() => navigate('/quizzes')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Quizzes</button></li>
                <li><button onClick={() => navigate('/custom-syllabus')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Custom Syllabus</button></li>
                <li><button onClick={() => navigate('/feedback')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Feedback</button></li>
                <li><button onClick={() => navigate('/tools')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Tools</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">More</h3>
              <ul className="space-y-1.5">
                <li><button onClick={() => navigate('/jobs')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Jobs</button></li>
                <li><button onClick={() => navigate('/scholarships')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Scholarships</button></li>
                <li><button onClick={() => navigate('/leaderboard')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Leaderboard</button></li>
                <li><button onClick={() => navigate('/ask-document')} className="text-xs text-muted-foreground hover:text-primary transition-colors">Ask Docs</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t text-center text-muted-foreground text-xs">
            <p>© {new Date().getFullYear()} MCQs Point. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </Header>
  );
};

export default Home;
