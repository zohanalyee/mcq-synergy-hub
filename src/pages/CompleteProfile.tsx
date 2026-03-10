import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User } from "lucide-react";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    fullName: "",
    phone: "",
    classGrade: "",
    institution: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      if (user.user_metadata?.profile_completed) {
        navigate("/dashboard");
        return;
      }
      if (user.user_metadata?.full_name) {
        setUserData((prev) => ({ ...prev, fullName: user.user_metadata.full_name }));
      }
    };
    getUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: userData.fullName,
          phone: userData.phone,
          class: userData.classGrade,
          institution: userData.institution,
          profile_completed: true,
        },
      });
      if (error) throw error;

      toast({ title: "Profile Completed!", description: "Welcome to AI-MCQs Point" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>Help us personalize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Enter your full name" value={userData.fullName} onChange={(e) => setUserData({ ...userData, fullName: e.target.value })} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="Enter your phone number" value={userData.phone} onChange={(e) => setUserData({ ...userData, phone: e.target.value })} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classGrade">Class / Grade</Label>
                <Select value={userData.classGrade} onValueChange={(value) => setUserData({ ...userData, classGrade: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class-9">Class 9</SelectItem>
                    <SelectItem value="class-10">Class 10</SelectItem>
                    <SelectItem value="class-11">Class 11</SelectItem>
                    <SelectItem value="class-12">Class 12</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution">School / Institution</Label>
                <Input id="institution" placeholder="Enter your school or institution" value={userData.institution} onChange={(e) => setUserData({ ...userData, institution: e.target.value })} disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
