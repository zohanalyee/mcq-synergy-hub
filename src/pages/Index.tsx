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
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  BrainCircuit, 
  Trophy, 
  BarChart3, 
  Users, 
  FileText, 
  CheckCircle2, 
  Timer, 
  PieChart, 
  Medal, 
  Sparkles, 
  Layers, 
  Workflow, 
  Rocket, 
  PersonStanding, 
  ShieldCheck, 
  Glasses,
  Dices,
  LayoutGrid,
  ListChecks
} from 'lucide-react';

const Home = () => {
  const { theme, setTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      }
    })
  };

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
      title: "Timed Mock Tests",
      description: "Simulate real exam conditions with time constraints",
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

  return (
    <Header theme={theme} setTheme={setTheme}>
      <div className={`min-h-screen bg-background ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}>
      
      
      {/* Hero Section */}
      <section className="pt-8 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                Prepare Smarter, Score Higher
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mt-6 mb-6 tracking-tight"
            >
              Master MCQs with <span className="text-gradient">Precision</span> and <span className="text-gradient">Confidence</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto"
            >
              Personalize your test preparation with custom syllabi, analytics-driven insights, and adaptive learning. Designed for university admissions, job exams, and beyond.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold mb-6">Prepare Your Way</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" onClick={() => navigate('/get-started')}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/subjects')}>
                Explore Subjects
              </Button>
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
      </section>
      
      {/* Subjects Section */}
      <section className="py-12">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold mb-4"
            >
              Popular Subjects
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-muted-foreground max-w-2xl mx-auto"
            >
              Explore our comprehensive collection of subjects and topics designed to help you excel in your exams
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjects.map((subject, index) => (
              <SubjectCard
                key={subject.title}
                title={subject.title}
                icon={subject.icon}
                description={subject.description}
                topicCount={subject.topicCount}
                color={subject.color}
                onClick={() => navigate(`/subjects/${subject.title.toLowerCase()}`)}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button variant="outline" onClick={() => navigate('/subjects')}>
              View All Subjects
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold mb-4"
            >
              Powerful Features for Effective Learning
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-muted-foreground max-w-2xl mx-auto"
            >
              Tools and features designed to maximize your learning efficiency and test performance
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                delay={index}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-10 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <AnimatedCounter
                from={0}
                to={5000}
                prefix="+"
                className="text-4xl font-bold mb-2"
              />
              <p className="text-white/80">MCQs Available</p>
            </div>
            <div>
              <AnimatedCounter
                from={0}
                to={25}
                className="text-4xl font-bold mb-2"
              />
              <p className="text-white/80">Subjects Covered</p>
            </div>
            <div>
              <AnimatedCounter
                from={0}
                to={98}
                suffix="%"
                className="text-4xl font-bold mb-2"
              />
              <p className="text-white/80">User Satisfaction</p>
            </div>
            <div>
              <AnimatedCounter
                from={0}
                to={20000}
                prefix="+"
                className="text-4xl font-bold mb-2"
              />
              <p className="text-white/80">Tests Completed</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-12">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold mb-4"
            >
              What Our Users Say
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-muted-foreground max-w-2xl mx-auto"
            >
              Hear from students and professionals who have transformed their test preparation with MCQs Point
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.author}
                content={testimonial.content}
                author={testimonial.author}
                role={testimonial.role}
                rating={testimonial.rating}
                delay={index}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 bg-muted/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none" />
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold mb-6"
            >
              Ready to Transform Your Test Preparation?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-muted-foreground mb-8"
            >
              Join thousands of students who have improved their test scores with MCQs Point's intelligent preparation system.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button size="lg" onClick={() => navigate('/get-started')}>
                Get Started Now
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">MCQs Point</h3>
              <p className="text-muted-foreground">Your intelligent companion for MCQ-based test preparation.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Home</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Subjects</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Mock Tests</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Analytics</a></li>
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
