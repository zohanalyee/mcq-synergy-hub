
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SEOHead
        title="Page Not Found | MCQsAI"
        description="The page you are looking for does not exist. Explore MCQsAI for free MCQ practice for NTS, FPSC, PPSC, Matric, FSc exams."
        keywords=""
        noindex={true}
      />
      <div className="container px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="relative mb-8">
            <div className="text-[150px] font-bold text-primary/10">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-4xl font-bold text-primary">Page Not Found</h1>
            </div>
          </div>
          
          <p className="text-xl text-muted-foreground mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Button size="lg" onClick={() => navigate("/")}>
            Return to Home
          </Button>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">Explore popular sections:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="/boards" className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200">Browse Boards</a>
              <a href="/exams" className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200">Exam Prep</a>
              <a href="/subjects" className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200">Subjects</a>
              <a href="/blog" className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200">Blog</a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
