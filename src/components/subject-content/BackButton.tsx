
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  destination?: string;
}

const BackButton = ({ destination = "/subjects" }: BackButtonProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-8">
      <Button 
        variant="ghost" 
        className="mr-4" 
        onClick={() => navigate(destination)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Subjects
      </Button>
    </div>
  );
};

export default BackButton;
