
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormData = z.infer<typeof formSchema>;

interface AuthFormProps {
  mode: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const { signIn, signUp, loading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      if (mode === 'login') {
        await signIn(data.email, data.password);
      } else {
        await signUp(data.email, data.password);
      }
    } catch (error: any) {
      setServerError(error.message || 'An error occurred during authentication');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {serverError}
          </div>
        )}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="yourname@example.com" 
                  {...field} 
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field} 
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'login' ? 'Signing In...' : 'Signing Up...'}
            </>
          ) : (
            mode === 'login' ? 'Sign In' : 'Sign Up'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AuthForm;
