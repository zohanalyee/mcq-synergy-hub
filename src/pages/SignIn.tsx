
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    toast({
      title: "Login system removed",
      description: "MCQs Point is now accessible to all users without requiring a login.",
    });
    navigate("/");
  }, [navigate, toast]);

  return null;
};

export default SignIn;
