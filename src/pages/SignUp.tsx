
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    toast({
      title: "Registration system removed",
      description: "MCQs Point is now accessible to all users without requiring registration.",
    });
    navigate("/");
  }, [navigate, toast]);

  return null;
};

export default SignUp;
