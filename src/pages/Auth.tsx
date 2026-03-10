import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp, signInWithGoogle } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import PasswordStrengthIndicator, { calculatePasswordStrength } from "@/components/PasswordStrengthIndicator";
import { Loader2, Mail, Lock, User, BookOpen, Eye, EyeOff } from "lucide-react";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        options: {
          redirectTo: `${window.location.origin}/complete-profile`,
        },
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

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Faux dashboard background */}
      <div className="absolute inset-0 bg-background">
        {/* Simulated dashboard elements */}
        <div className="absolute top-0 left-0 w-[220px] h-full bg-[hsl(var(--primary)/0.08)]" />
        <div className="absolute top-0 left-[220px] right-0 h-[56px] bg-[hsl(var(--primary)/0.05)]" />
        <div className="absolute top-[80px] left-[260px] w-[280px] h-[160px] rounded-2xl bg-[hsl(var(--primary)/0.1)]" />
        <div className="absolute top-[80px] left-[560px] w-[280px] h-[160px] rounded-2xl bg-[hsl(280,80%,65%,0.1)]" />
        <div className="absolute top-[80px] right-[40px] w-[200px] h-[160px] rounded-2xl bg-[hsl(200,90%,60%,0.1)]" />
        <div className="absolute top-[270px] left-[260px] right-[40px] h-[200px] rounded-2xl bg-[hsl(var(--primary)/0.06)]" />
        <div className="absolute bottom-[40px] left-[260px] w-[45%] h-[140px] rounded-2xl bg-[hsl(330,70%,60%,0.08)]" />
        <div className="absolute bottom-[40px] right-[40px] w-[30%] h-[140px] rounded-2xl bg-[hsl(200,90%,60%,0.08)]" />
        {/* Mesh gradient orbs for color richness */}
        <div className="absolute top-[-10%] left-[10%] w-[50%] h-[50%] rounded-full bg-[hsl(var(--primary)/0.2)] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[45%] h-[45%] rounded-full bg-[hsl(280,80%,65%,0.15)] blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full bg-[hsl(200,90%,60%,0.12)] blur-[110px]" />
      </div>
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-background/30 z-[1]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[450px] relative z-10">
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-3 shadow-lg shadow-primary/25">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">AI-MCQs Point</h1>
          <p className="text-sm text-muted-foreground">Your gateway to academic excellence</p>
        </div>

        <div className="bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-2xl p-8">
          <div className="space-y-1 mb-6">
            <h2 className="text-lg font-semibold leading-tight tracking-tight text-foreground">Welcome</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account or create a new one to get started</p>
          </div>
          <div className="space-y-4">
            {/* Google OAuth */}
            <Button variant="outline" className="w-full h-11 font-medium gap-3 bg-white/70 dark:bg-slate-800/60 border-white/50 dark:border-white/15 hover:bg-white/90 dark:hover:bg-slate-800/80 hover:shadow-md transition-all" onClick={handleGoogleLogin} disabled={isGoogleLoading || isLoading}>
              {isGoogleLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Connecting...</> : <><GoogleIcon />Continue with Google</>}
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground font-medium uppercase">or</span>
              <Separator className="flex-1" />
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleInputChange} className="pl-10 bg-white/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 border-white/60 dark:border-white/15" required disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="password" name="password" type="password" placeholder="Enter your password" value={formData.password} onChange={handleInputChange} className="pl-10" required disabled={isLoading} />
                    </div>
                    <div className="text-right">
                      <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-name" name="fullName" type="text" placeholder="Enter your full name" value={formData.fullName} onChange={handleInputChange} className="pl-10" required disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleInputChange} className="pl-10" required disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-password" name="password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={formData.password} onChange={handleInputChange} className="pl-10 pr-10" required disabled={isLoading} minLength={8} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={formData.password} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="confirm-password" name="confirmPassword" type="password" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleInputChange} className="pl-10" required disabled={isLoading} minLength={8} />
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked === true)} />
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || !agreedToTerms}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="text-center mt-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground text-sm">
            ← Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
