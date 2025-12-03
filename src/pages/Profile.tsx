
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';

const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user, profile, updateProfile, uploadAvatar, signOut } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!user) {
    navigate('/sign-in');
    return null;
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: profile?.username || '',
    },
    values: {
      username: profile?.username || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSaving(true);
      await updateProfile(data);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar image must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadAvatar(file);
      if (url) {
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully."
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your avatar.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Header>
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Your Profile</CardTitle>
            <CardDescription className="text-sm">Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex flex-col items-center space-y-2">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-lg">{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="relative">
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
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Change Picture
                    </>
                  )}
                </label>
              </div>
            </div>
            <div className="w-full">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <Button type="submit" disabled={isSaving}>
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
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-4">Email: {user.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="destructive" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
    </Header>
  );
};

export default Profile;
