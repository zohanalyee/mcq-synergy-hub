import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

const VerifyEmailSent = () => {
  const { toast } = useToast();
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No email found");

      const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
      if (error) throw error;

      toast({ title: "Email Sent!", description: "Please check your inbox." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to resend email." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              We sent a verification link to your email. Please check your inbox and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleResend} disabled={resending}>
              {resending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resending...</> : "Resend Verification Email"}
            </Button>
            <div className="text-center">
              <Link to="/auth" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmailSent;
