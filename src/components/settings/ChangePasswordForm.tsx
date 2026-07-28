import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PasswordStrengthIndicator, { getPasswordPolicyError } from "@/components/PasswordStrengthIndicator";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const ChangePasswordForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Password Mismatch", description: "Passwords do not match." });
      return;
    }
    const policyError = getPasswordPolicyError(formData.newPassword);
    if (policyError) {
      toast({ variant: "destructive", title: "Password Requirements", description: policyError });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
      if (error) throw error;
      toast({ title: "Success!", description: "Your password has been changed." });
      setFormData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to change password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Change Password</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-pw">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="new-pw" type={showPassword ? "text" : "password"} placeholder="Enter new password" className="pl-10 pr-10" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} required disabled={loading} minLength={8} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={formData.newPassword} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-pw">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="confirm-pw" type="password" placeholder="Confirm new password" className="pl-10" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required disabled={loading} minLength={8} />
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Changing...</> : "Change Password"}
        </Button>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
