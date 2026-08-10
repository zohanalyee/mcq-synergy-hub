import React, { useState, useEffect } from 'react';
import ChangePasswordForm from '@/components/settings/ChangePasswordForm';
import EmailPreferencesCard from '@/components/settings/EmailPreferencesCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, UserCircle2, Shield, Target, Crown, Lock, LogOut } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import PageHeader from '@/components/ui/PageHeader';

const TARGET_EXAMS = [
  'Matric (9th-10th)',
  'Intermediate / FSc',
  'O-Levels',
  'A-Levels',
  'MDCAT',
  'ECAT',
  'CSS',
  'PMS',
  'FPSC',
  'PPSC',
  'NTS',
  'IELTS / TOEFL',
  'University / BS',
  'Other',
];

const profileFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  target_exam: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user, profile, updateProfile, uploadAvatar, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [targetExam, setTargetExam] = useState<string>('');
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!user) {
    navigate('/sign-in');
    return null;
  }

  // Load target_exam directly from DB (not in profile context yet)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('target_exam')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.target_exam) setTargetExam(data.target_exam);
    })();
  }, [user?.id]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: profile?.username || '',
      target_exam: '',
    },
    values: {
      username: profile?.username || '',
      target_exam: targetExam,
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSaving(true);
      // Update username via context
      await updateProfile({ username: data.username });
      // Update target_exam directly
      const { error } = await supabase
        .from('profiles')
        .update({ target_exam: targetExam || null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;

      toast('Profile updated', { description: 'Your profile information has been saved.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Update failed', { description: 'There was an error updating your profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large', { description: 'Avatar image must be less than 2MB.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', { description: 'Please upload an image file.' });
      return;
    }
    try {
      setIsUploading(true);
      const url = await uploadAvatar(file);
      if (url) {
        toast('Avatar updated', { description: 'Your profile picture has been updated.' });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Upload failed', { description: 'There was an error uploading your avatar.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Status: Admin > Pro (placeholder) > Free
  const accountStatus = isAdmin
    ? { label: 'Admin', icon: Shield, className: 'bg-brand-gradient text-primary-foreground border-0' }
    : { label: 'Free User', icon: UserCircle2, className: 'bg-secondary/60 text-foreground border-border' };

  return (
    <Header>
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12 space-y-6">
        <PageHeader
          icon={UserCircle2}
          title="Your Profile"
          tagline="Account & preferences"
          description="Manage your profile information, avatar and password."
        />

        {/* Personal Information Card */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCircle2 className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Public details and learning preferences.</CardDescription>
              </div>
              <Badge variant="outline" className={`gap-1.5 px-3 py-1 ${accountStatus.className}`}>
                <accountStatus.icon className="h-3.5 w-3.5" />
                {accountStatus.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-24 w-24 ring-2 ring-border ring-offset-2 ring-offset-background">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-xl bg-brand-gradient-soft">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-1.5 h-3 w-3" />
                      Change
                    </>
                  )}
                </label>
              </div>

              <div className="w-full">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        Target Exam / Education Level
                      </label>
                      <Select value={targetExam} onValueChange={setTargetExam}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your target exam" />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_EXAMS.map((exam) => (
                            <SelectItem key={exam} value={exam}>
                              {exam}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Helps us personalize content & recommendations.
                      </p>
                    </div>

                    <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>

                    <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Reminders */}
        <EmailPreferencesCard />

        {/* Security Card */}

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="destructive" size="sm" onClick={signOut}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </Header>
  );
};

export default Profile;
