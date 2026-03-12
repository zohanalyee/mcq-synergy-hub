import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getIntentRaw, clearIntentRaw } from "@/hooks/useAuthIntent";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import PasswordStrengthIndicator, { calculatePasswordStrength } from "@/components/PasswordStrengthIndicator";
import { Loader2, Mail, Lock, User, BrainCircuit, Eye, EyeOff, CheckCircle2, Sparkles, BarChart3, GraduationCap, ArrowLeft } from "lucide-react";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const features = [
  { icon: Sparkles, title: "AI-Powered Tests", description: "Generate unlimited MCQs with artificial intelligence" },
  { icon: BarChart3, title: "Detailed Analytics", description: "Track your progress with comprehensive insights" },
  { icon: GraduationCap, title: "Personalized Learning", description: "Adaptive paths tailored to your strengths" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/complete-profile` },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Sign In Failed", description: error.message || "Failed to sign in with Google." });
      setIsGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      if (data?.user) {
        toast({ title: "Welcome back!", description: "You have been successfully signed in." });
        navigate("/");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign In Failed", description: error.message || "Failed to sign in." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast({ variant: "destructive", title: "Terms Required", description: "Please agree to the Terms of Service and Privacy Policy." });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Password Mismatch", description: "Passwords do not match." });
      return;
    }
    if (formData.password.length < 8) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 8 characters." });
      return;
    }
    if (calculatePasswordStrength(formData.password) < 50) {
      toast({ variant: "destructive", title: "Weak Password", description: "Please use a stronger password." });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName },
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });
      if (error) throw error;
      if (data?.user) {
        toast({ title: "Account Created!", description: "Please check your email to verify your account." });
        navigate("/verify-email-sent");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign Up Failed", description: error.message || "Failed to create account." });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClass =
    "w-full h-11 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 pl-10 text-sm placeholder:text-[hsl(var(--muted-foreground))] transition-all duration-200 outline-none focus:ring-2 focus:ring-[hsl(220,90%,56%,0.2)] focus:border-[hsl(220,90%,56%)] disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2">
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-center items-center p-12 text-white"
        style={{ background: "linear-gradient(135deg, hsl(220, 90%, 45%), hsl(230, 80%, 40%), hsl(250, 70%, 35%))" }}
      >
        {/* Subtle dot pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        {/* Floating decorative circles */}
        <motion.div
          className="absolute top-20 left-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent)" }}
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-32 right-12 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3), transparent)" }}
          animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-8 shadow-lg">
              <BrainCircuit className="w-9 h-9 text-white" />
            </div>

            <h2 className="text-3xl font-bold mb-3 leading-tight">
              Join AI-MCQs Point
            </h2>
            <p className="text-blue-100 text-lg mb-10 leading-relaxed">
              Your gateway to academic excellence
            </p>
          </motion.div>

          <div className="space-y-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-0.5">{feature.title}</h3>
                  <p className="text-sm text-blue-200 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 flex items-center gap-2 text-blue-200 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Trusted by thousands of students</span>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-b from-[hsl(var(--background))] to-[hsl(210,40%,96%)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 shadow-md"
              style={{ background: "linear-gradient(135deg, hsl(220, 90%, 50%), hsl(240, 70%, 50%))" }}
            >
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Welcome to AI-MCQs Point</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {activeTab === "signin" ? "Sign in to continue your learning journey" : "Create an account to get started"}
            </p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full h-11 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] flex items-center justify-center gap-3 text-sm font-medium text-[hsl(var(--foreground))] hover:shadow-md hover:bg-[hsl(var(--muted))] transition-all duration-200 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
            ) : (
              <><GoogleIcon /> Continue with Google</>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1" />
            <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Segmented Tab Toggle */}
          <div className="bg-[hsl(var(--muted))] rounded-full p-1 flex mb-6 relative">
            <button
              onClick={() => setActiveTab("signin")}
              className="flex-1 relative z-10 text-sm font-medium py-2 rounded-full transition-colors duration-200"
              style={{ color: activeTab === "signin" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className="flex-1 relative z-10 text-sm font-medium py-2 rounded-full transition-colors duration-200"
              style={{ color: activeTab === "signup" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            >
              Sign Up
            </button>
            <motion.div
              layoutId="auth-tab-indicator"
              className="absolute top-1 bottom-1 rounded-full bg-[hsl(var(--background))] shadow-sm"
              style={{ width: "calc(50% - 4px)" }}
              animate={{ left: activeTab === "signin" ? "4px" : "calc(50% + 0px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {activeTab === "signin" ? (
              <motion.form
                key="signin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignIn}
                className="space-y-4"
              >
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(220,90%,56%)] transition-colors" />
                    <input
                      name="email" type="email" placeholder="yourname@example.com"
                      value={formData.email} onChange={handleInputChange}
                      className={inputBaseClass} required disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(220,90%,56%)] transition-colors" />
                    <input
                      name="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={formData.password} onChange={handleInputChange}
                      className={`${inputBaseClass} pr-10`} required disabled={isLoading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-xs font-medium text-[hsl(220,90%,50%)] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit" disabled={isLoading || isGoogleLoading}
                  className="w-full h-11 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, hsl(220, 90%, 50%), hsl(240, 70%, 45%))" }}
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing In...</> : "Sign In"}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignUp}
                className="space-y-4"
              >
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(220,90%,56%)] transition-colors" />
                    <input
                      name="fullName" type="text" placeholder="Enter your full name"
                      value={formData.fullName} onChange={handleInputChange}
                      className={inputBaseClass} required disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(220,90%,56%)] transition-colors" />
                    <input
                      name="email" type="email" placeholder="yourname@example.com"
                      value={formData.email} onChange={handleInputChange}
                      className={inputBaseClass} required disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(220,90%,56%)] transition-colors" />
                    <input
                      name="password" type={showPassword ? "text" : "password"} placeholder="Create a password"
                      value={formData.password} onChange={handleInputChange}
                      className={`${inputBaseClass} pr-10`} required disabled={isLoading} minLength={8}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(220,90%,56%)] transition-colors" />
                    <input
                      name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password"
                      value={formData.confirmPassword} onChange={handleInputChange}
                      className={`${inputBaseClass} pr-10`} required disabled={isLoading} minLength={8}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked === true)} className="mt-0.5" />
                  <label htmlFor="terms" className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <Link to="/terms" className="text-[hsl(220,90%,50%)] hover:underline">Terms of Service</Link>{" "}and{" "}
                    <Link to="/privacy" className="text-[hsl(220,90%,50%)] hover:underline">Privacy Policy</Link>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit" disabled={isLoading || isGoogleLoading || !agreedToTerms}
                  className="w-full h-11 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, hsl(220, 90%, 50%), hsl(240, 70%, 45%))" }}
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</> : "Create Account"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
