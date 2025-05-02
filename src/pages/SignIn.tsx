
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const SignIn = () => {
  const { user } = useAuth();
  
  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm mode="login" />
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center w-full">
              Don't have an account?{" "}
              <Link to="/sign-up" className="text-primary hover:underline">
                Sign Up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
