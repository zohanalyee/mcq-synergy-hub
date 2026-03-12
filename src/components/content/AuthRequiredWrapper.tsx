import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { saveIntentRaw } from "@/hooks/useAuthIntent";

interface AuthRequiredWrapperProps {
  children: ReactNode;
  message?: string;
  showSignInButton?: boolean;
}

const AuthRequiredWrapper = ({ 
  children, 
  message = "Please sign in to access this feature.",
  showSignInButton = true 
}: AuthRequiredWrapperProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const handleSignIn = () => {
    saveIntentRaw({
      action: 'Access feature',
      path: location.pathname + location.search,
    });
    window.location.href = '/auth';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show auth required message for non-authenticated users
  if (!user) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        
        {showSignInButton && (
          <div className="text-center">
            <Button onClick={handleSignIn}>
              Sign In to Continue
            </Button>
          </div>
        )}
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default AuthRequiredWrapper;