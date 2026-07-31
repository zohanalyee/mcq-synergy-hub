import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, MapPin, Briefcase, GraduationCap } from "lucide-react";

const PAKISTANI_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Sargodha', 'Bahawalpur', 'Sukkur', 'Larkana',
  'Mardan', 'Mingora', 'Rahim Yar Khan', 'Sahiwal', 'Okara',
  'Other'
];

const CompleteProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    fullName: "",
    city: "",
    otherCity: "",
    occupation: "",
    userType: "",
    bio: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if already completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed, username')
        .eq('id', user.id)
        .single();

      if (profile?.profile_completed) {
        navigate("/");
        return;
      }

      // Pre-fill name from Google or existing profile
      const name = user.user_metadata?.full_name || profile?.username || user.email?.split('@')[0] || '';
      setUserData(prev => ({ ...prev, fullName: name }));
    };
    getUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData.fullName.trim()) {
      toast.error("Error", { description: "Please enter your name" });
      return;
    }
    if (!userData.city) {
      toast.error("Error", { description: "Please select your city" });
      return;
    }
    if (userData.city === 'Other' && !userData.otherCity.trim()) {
      toast.error("Error", { description: "Please enter your city name" });
      return;
    }
    if (!userData.occupation.trim()) {
      toast.error("Error", { description: "Please enter your occupation" });
      return;
    }
    if (!userData.userType) {
      toast.error("Error", { description: "Please select your profile type" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const finalCity = userData.city === 'Other' ? userData.otherCity.trim() : userData.city;

      const { error } = await supabase
        .from('profiles')
        .update({
          username: userData.fullName.trim(),
          city: finalCity,
          occupation: userData.occupation.trim(),
          user_type: userData.userType,
          bio: userData.bio.trim() || null,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast("Profile Completed! 🎉", { description: "Welcome to MCQSAI" });

      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error("Error", { description: error.message || "Failed to save profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>Help us personalize your experience on AI-MCQs Point 🇵🇰</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Full Name <span className="text-destructive">*</span>
                </Label>
                <Input id="fullName" placeholder="Enter your full name" value={userData.fullName} onChange={(e) => setUserData({ ...userData, fullName: e.target.value })} required disabled={loading} />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> City <span className="text-destructive">*</span>
                </Label>
                <Select value={userData.city} onValueChange={(value) => setUserData({ ...userData, city: value })}>
                  <SelectTrigger><SelectValue placeholder="Select your city" /></SelectTrigger>
                  <SelectContent>
                    {PAKISTANI_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Other City */}
              {userData.city === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="otherCity">Specify your city <span className="text-destructive">*</span></Label>
                  <Input id="otherCity" placeholder="Enter your city name" value={userData.otherCity} onChange={(e) => setUserData({ ...userData, otherCity: e.target.value })} disabled={loading} />
                </div>
              )}

              {/* Occupation */}
              <div className="space-y-2">
                <Label htmlFor="occupation" className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" /> Current Occupation <span className="text-destructive">*</span>
                </Label>
                <Input id="occupation" placeholder="e.g., MDCAT Student, Teacher, Software Engineer" value={userData.occupation} onChange={(e) => setUserData({ ...userData, occupation: e.target.value })} required disabled={loading} />
              </div>

              {/* User Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5" /> I am a <span className="text-destructive">*</span>
                </Label>
                <Select value={userData.userType} onValueChange={(value) => setUserData({ ...userData, userType: value })}>
                  <SelectTrigger><SelectValue placeholder="Select profile type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">🎓 Student (preparing for exams)</SelectItem>
                    <SelectItem value="job_seeker">💼 Job Seeker</SelectItem>
                    <SelectItem value="teacher">👨‍🏫 Teacher / Educator</SelectItem>
                    <SelectItem value="professional">💻 Working Professional</SelectItem>
                    <SelectItem value="other">📝 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">About You (Optional)</Label>
                <Textarea id="bio" placeholder="Tell us a bit about yourself..." value={userData.bio} onChange={(e) => setUserData({ ...userData, bio: e.target.value })} rows={3} disabled={loading} />
                <p className="text-xs text-muted-foreground">This helps us personalize your experience</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Complete Profile & Continue"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                🔒 Your information is private and secure.
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
