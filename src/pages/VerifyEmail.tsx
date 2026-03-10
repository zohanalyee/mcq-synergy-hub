import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        setStatus("verified");
        setTimeout(() => navigate("/dashboard"), 2500);
      } else {
        setStatus("error");
      }
    };
    check();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="mx-auto mb-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                <CardTitle>Verifying Email...</CardTitle>
                <CardDescription>Please wait while we verify your email address.</CardDescription>
              </>
            )}
            {status === "verified" && (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Email Verified!</CardTitle>
                <CardDescription>Your email has been verified successfully. Redirecting to dashboard...</CardDescription>
              </>
            )}
            {status === "error" && (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <CardTitle>Verification Failed</CardTitle>
                <CardDescription>The verification link is invalid or has expired.</CardDescription>
              </>
            )}
          </CardHeader>
          {status === "error" && (
            <CardContent className="text-center">
              <Button onClick={() => navigate("/auth")} className="w-full">Back to Login</Button>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
