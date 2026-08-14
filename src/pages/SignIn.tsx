
import React, { useEffect, useRef, useState } from "react";
import SEOHead from '@/components/SEOHead';
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithGoogle, signInWithFacebook } from "@/services/authService";
import { getIntentRaw, clearIntentRaw } from "@/hooks/useAuthIntent";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { PENDING_EMAIL_OPTOUT_KEY } from "@/components/EmailPrefSync";
import { toast } from "sonner";
import PasswordStrengthIndicator, { passwordMeetsPolicy, getPasswordPolicyError } from "@/components/PasswordStrengthIndicator";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import {
  Loader2, Mail, Lock, User, Brain, Eye, EyeOff, ArrowLeft
} from "lucide-react";
import { JoinSection } from "@/components/landing/JoinSection";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.017 1.792-4.684 4.533-4.684 1.312 0 2.686.235 2.686.235v2.955H15.83c-1.49 0-1.955.929-1.955 1.882v2.273h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';

interface SignInPageProps {
  defaultTab?: "signin" | "signup";
}

type AuthTab = "signin" | "signup";

const SignIn: React.FC<SignInPageProps> = ({ defaultTab = "signin" }) => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");
  const resolvedDefaultTab: AuthTab = queryTab === "signup" || queryTab === "signin" ? queryTab : defaultTab;
  const [activeTab, setActiveTab] = useState<AuthTab>(resolvedDefaultTab);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<AuthTab | null>(null);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [signInCaptchaToken, setSignInCaptchaToken] = useState<string | null>(null);
  const [signUpCaptchaToken, setSignUpCaptchaToken] = useState<string | null>(null);
  const signInCaptchaRef = useRef<HCaptcha>(null);
  const signUpCaptchaRef = useRef<HCaptcha>(null);
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });
  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [wantsReminders, setWantsReminders] = useState(true);

  useEffect(() => {
    setActiveTab(resolvedDefaultTab);
    setServerError(null);
    setCaptchaError(null);
  }, [resolvedDefaultTab]);

  if (user) {
    const intent = getIntentRaw();
    if (intent) {
      clearIntentRaw();
      return <Navigate to={intent.path} replace />;
    }
    return <Navigate to="/analytics" />;
  }

  const resetCaptchaState = () => {
    setCaptchaError(null);
    setSignInCaptchaToken(null);
    setSignUpCaptchaToken(null);
    signInCaptchaRef.current?.resetCaptcha();
    signUpCaptchaRef.current?.resetCaptcha();
  };

  const handleTabChange = (nextTab: AuthTab) => {
    setActiveTab(nextTab);
    setServerError(null);
    resetCaptchaState();
  };

  const handleSignInInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignInData((prev) => ({ ...prev, [name]: value }));
    setServerError(null);
  };

  const handleSignUpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData((prev) => ({ ...prev, [name]: value }));
    setServerError(null);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      toast.error("Google Sign In Failed", { description: error.message || "Failed to sign in with Google." });
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsFacebookLoading(true);
    try {
      const { error } = await signInWithFacebook();
      if (error) throw error;
    } catch (error: any) {
      toast.error("Facebook Sign In Failed", { description: error.message || "Failed to sign in with Facebook." });
      setIsFacebookLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setCaptchaError(null);
    if (!signInCaptchaToken) {
      toast.error("Captcha Required", { description: "Please complete the hCaptcha verification before signing in." });
      return;
    }
    setIsSubmitting("signin");
    try {
      await signIn(signInData.email, signInData.password, signInCaptchaToken);
    } catch (error: any) {
      setServerError(error.message || "Failed to sign in.");
      signInCaptchaRef.current?.resetCaptcha();
      setSignInCaptchaToken(null);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setCaptchaError(null);
    if (!agreedToTerms) {
      toast.error("Terms Required", { description: "Please agree to the Terms of Service and Privacy Policy." });
      return;
    }
    if (!signUpCaptchaToken) {
      toast.error("Captcha Required", { description: "Please complete the hCaptcha verification." });
      return;
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error("Password Mismatch", { description: "Passwords do not match." });
      return;
    }
    const policyError = getPasswordPolicyError(signUpData.password);
    if (policyError) {
      toast.error("Password Requirements", { description: policyError });
      return;
    }
    setIsSubmitting("signup");
    try {
      // Reminders default to ON server-side; remember an opt-out and apply it
      // once the session exists (EmailPrefSync).
      if (wantsReminders) {
        localStorage.removeItem(PENDING_EMAIL_OPTOUT_KEY);
      } else {
        localStorage.setItem(PENDING_EMAIL_OPTOUT_KEY, "true");
      }
      await signUp(signUpData.email, signUpData.password, signUpCaptchaToken);
      toast("Account Created!", { description: "Please check your email to verify your account." });
      signUpCaptchaRef.current?.resetCaptcha();
      setSignUpCaptchaToken(null);
    } catch (error: any) {
      setServerError(error.message || "Failed to create account.");
      signUpCaptchaRef.current?.resetCaptcha();
      setSignUpCaptchaToken(null);
    } finally {
      setIsSubmitting(null);
    }
  };

  const inputBaseClass =
    "w-full h-11 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 pl-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--brand-from))] placeholder:font-medium transition-all duration-200 outline-none focus:ring-2 focus:ring-[hsl(var(--brand-from)/0.25)] focus:border-[hsl(var(--brand-from))] disabled:opacity-50 disabled:cursor-not-allowed";

  const isLoading = loading;
  const isBusy = isLoading || isGoogleLoading || isSubmitting !== null;
  const renderCaptcha = ({
    captchaRef,
    token,
    onVerify,
  }: {
    captchaRef: React.RefObject<HCaptcha | null>;
    token: string | null;
    onVerify: (token: string) => void;
  }) => (
    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">Complete the security check</span>
        <span className={token ? "text-primary font-medium" : "text-muted-foreground"}>
          {token ? "Verified" : "Required"}
        </span>
      </div>
      <div className="flex justify-center overflow-hidden">
        <HCaptcha
          ref={captchaRef}
          sitekey={HCAPTCHA_SITE_KEY}
          theme="light"
          onVerify={(value) => {
            onVerify(value);
            setCaptchaError(null);
            setServerError(null);
          }}
          onExpire={() => onVerify("")}
          onError={() => {
            setCaptchaError("Captcha failed to load. Check your hCaptcha site key in Supabase/Auth settings or disable captcha for local testing.");
          }}
        />
      </div>
      {captchaError && <p className="text-xs text-destructive">{captchaError}</p>}
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col lg:grid lg:grid-cols-2">
      <SEOHead title="Sign In" noindex />
      {/* Left Panel - Desktop Only */}
      <JoinSection />

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
            <div className="relative inline-flex items-center justify-center mb-4">
              {/* Soft brand glow */}
              <div className="absolute inset-0 rounded-2xl bg-brand-gradient blur-xl opacity-50 scale-125" aria-hidden="true" />
              <div className="relative w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand">
                <Brain className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Welcome to MCQSAI</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {activeTab === "signin" ? "Sign in to continue your learning journey" : "Create an account to get started"}
            </p>
          </div>

          {/* Social OAuth */}
          <div className="space-y-2.5">
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isFacebookLoading || isLoading}
              className="w-full h-11 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] flex items-center justify-center gap-3 text-sm font-medium text-[hsl(var(--foreground))] hover:shadow-md hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--brand-from)/0.4)] transition-all duration-200 disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
              ) : (
                <><GoogleIcon /> Continue with Google</>
              )}
            </button>

            <button
              onClick={handleFacebookLogin}
              disabled={isFacebookLoading || isGoogleLoading || isLoading}
              className="w-full h-11 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] flex items-center justify-center gap-3 text-sm font-medium text-[hsl(var(--foreground))] hover:shadow-md hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--brand-from)/0.4)] transition-all duration-200 disabled:opacity-50"
            >
              {isFacebookLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
              ) : (
                <><FacebookIcon /> Continue with Facebook</>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1" />
            <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Segmented Tab Toggle */}
          <div className="bg-[hsl(var(--muted))] rounded-full p-1 flex mb-6 relative">
            <button
              type="button"
              onClick={() => handleTabChange("signin")}
              className={`flex-1 relative z-10 text-sm font-semibold py-2 rounded-full transition-colors duration-200 ${activeTab === "signin" ? "text-brand-gradient" : "text-muted-foreground"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className={`flex-1 relative z-10 text-sm font-semibold py-2 rounded-full transition-colors duration-200 ${activeTab === "signup" ? "text-brand-gradient" : "text-muted-foreground"}`}
            >
              Sign Up
            </button>
            <motion.div
              layoutId="auth-tab-indicator"
              className="absolute top-1 bottom-1 rounded-full bg-[hsl(var(--background))] shadow-sm"
              style={{ width: "calc(50% - 4px)" }}
              animate={{ left: activeTab === "signin" ? "4px" : "calc(50%)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg border border-destructive/20 mb-4">
              {serverError}
            </div>
          )}

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
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                    <input
                      name="email" type="email" placeholder="yourname@example.com"
                        value={signInData.email} onChange={handleSignInInputChange}
                        className={inputBaseClass} required disabled={isBusy}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                      <input
                        name="password" type={showSignInPassword ? "text" : "password"} placeholder="••••••••"
                        value={signInData.password} onChange={handleSignInInputChange}
                        className={`${inputBaseClass} pr-10`} required disabled={isBusy}
                      autoComplete="current-password"
                    />
                      <button type="button" onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-xs font-bold text-[hsl(var(--primary))] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                  {renderCaptcha({
                    captchaRef: signInCaptchaRef,
                    token: signInCaptchaToken,
                    onVerify: (token) => setSignInCaptchaToken(token || null),
                  })}

                {/* Submit */}
                <button
                    type="submit" disabled={isBusy || !signInCaptchaToken}
                  className="w-full h-11 rounded-xl bg-brand-gradient text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-brand transition-all duration-200 hover:brightness-110 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isSubmitting === "signin" ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing In...</> : "Sign In"}
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
                    <User className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                    <input
                      name="fullName" type="text" placeholder="Enter your full name"
                        value={signUpData.fullName} onChange={handleSignUpInputChange}
                        className={inputBaseClass} required disabled={isBusy}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                    <input
                      name="email" type="email" placeholder="yourname@example.com"
                        value={signUpData.email} onChange={handleSignUpInputChange}
                        className={inputBaseClass} required disabled={isBusy}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                      <input
                        name="password" type={showSignUpPassword ? "text" : "password"} placeholder="Create a password"
                        value={signUpData.password} onChange={handleSignUpInputChange}
                        className={`${inputBaseClass} pr-10`} required disabled={isBusy} minLength={8}
                      autoComplete="new-password"
                    />
                      <button type="button" onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                    <PasswordStrengthIndicator password={signUpData.password} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[hsl(var(--foreground))]">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                    <input
                      name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password"
                        value={signUpData.confirmPassword} onChange={handleSignUpInputChange}
                        className={`${inputBaseClass} pr-10`} required disabled={isBusy} minLength={8}
                      autoComplete="new-password"
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
                    <Link to="/terms-of-service" className="text-[hsl(var(--primary))] hover:underline">Terms of Service</Link>{" "}and{" "}
                    <Link to="/privacy-policy" className="text-[hsl(var(--primary))] hover:underline">Privacy Policy</Link>
                  </label>
                </div>

                {/* Streak reminder opt-in */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="reminders"
                    checked={wantsReminders}
                    onCheckedChange={(checked) => setWantsReminders(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="reminders" className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed cursor-pointer">
                    Mujhe streak reminder emails bhejein (2-3 din practice na karne par ek friendly nudge). Kabhi bhi band kar sakte hain.
                  </label>
                </div>


                {/* hCaptcha */}
                {renderCaptcha({
                  captchaRef: signUpCaptchaRef,
                  token: signUpCaptchaToken,
                  onVerify: (token) => setSignUpCaptchaToken(token || null),
                })}

                {/* Submit */}
                <button
                  type="submit" disabled={isBusy || !agreedToTerms || !signUpCaptchaToken}
                  className="w-full h-11 rounded-xl bg-brand-gradient text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-brand transition-all duration-200 hover:brightness-110 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting === "signup" ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</> : "Create Account"}
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

export default SignIn;
