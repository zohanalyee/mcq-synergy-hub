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
      icon: <LayoutGrid size={24} />
    },
    {
      title: "Immediate Feedback",
      description: "Get instant feedback after each question or at the end of the test.",
      icon: <CheckCircle2 size={24} />
    },
    {
      title: "Performance Analytics",
      description: "Visualize your performance with detailed charts and progress tracking.",
      icon: <BarChart3 size={24} />
    },
    {
      title: "Gamified Learning",
      description: "Earn badges and compete on leaderboards to stay motivated.",
      icon: <Trophy size={24} />
    },
    {
      title: "Smart Study Plans",
      description: "Get personalized study plans based on your performance.",
      icon: <Workflow size={24} />
    },
    {
      title: "Exam Strategies",
      description: "Learn proven strategies for tackling different types of MCQs.",
      icon: <ShieldCheck size={24} />
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
        className="pt-2 pb-4 md:pt-4 md:pb-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="hidden md:inline px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                Prepare Smarter, Score Higher
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl md:text-4xl lg:text-5xl font-bold mt-2 mb-2 md:mt-4 md:mb-4 tracking-tight"
            >
              Master MCQs with <span className="text-gradient text-gradient-animated">Precision</span> and <span className="text-gradient text-gradient-animated">Confidence</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:block text-base text-muted-foreground mb-6 max-w-2xl mx-auto"
            >
              Personalize your test preparation with custom syllabi, analytics-driven insights, and adaptive learning.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-2 md:mb-6"
            >
              <h2 className="hidden md:block text-xl font-bold mb-3">Prepare Your Way</h2>
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
                  Get Started
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button size="default" variant="outline" onClick={() => navigate('/subjects')}>
                  Explore Subjects
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
            {features.map((feature) => (
              <motion.div key={feature.title} variants={staggerItem}>
                <FeatureCard
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
      
      {/* Stats Section */}
      <motion.section
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="py-6 bg-gradient-to-r from-primary to-accent text-white"
      >
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { to: 5000, prefix: "+", label: "MCQs Available" },
              { to: 25, prefix: "", label: "Subjects Covered" },
              { to: 98, suffix: "%", label: "User Satisfaction" },
              { to: 20000, prefix: "+", label: "Tests Completed" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <AnimatedCounter
                  from={0}
                  to={stat.to}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  className="text-xl md:text-2xl font-bold mb-1"
                />
                <p className="text-xs text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
      
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
      <footer className="py-6 border-t">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">MCQs Point</h3>
              <p className="text-xs text-muted-foreground">Your intelligent companion for MCQ-based test preparation.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Quick Links</h3>
              <ul className="space-y-1">
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Home</a></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Subjects</a></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Recruitment Tests</a></li>
                <li><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Guides</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-muted-foreground">contact@mcqspoint.com</li>
                <li className="text-muted-foreground">+1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-muted-foreground text-sm">
            <p>© {new Date().getFullYear()} MCQs Point. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </Header>
  );
};

export default Home;
