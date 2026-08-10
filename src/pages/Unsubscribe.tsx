import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/unsubscribe-email`;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(FUNCTIONS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        setState(res.ok ? 'done' : 'error');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Header>
      <SEOHead
        title="Email Reminders Unsubscribe"
        description="Manage your MCQsAI email reminder preferences."
        noindex
      />
      <main className="container mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground mb-6">Email Reminders</h1>
        <Card className="border border-border/60">
          <CardContent className="p-6 space-y-4">
            {state === 'loading' && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Aapki preference update ho rahi hai...
              </p>
            )}
            {state === 'done' && (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Ho gaya — reminder emails band kar di gayi hain.
                </p>
                <p className="text-sm text-muted-foreground">
                  Aap kabhi bhi apni Profile settings se dobara on kar sakte hain.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild className="min-h-[44px]">
                    <Link to="/mock-tests">Practice jaari rakhein</Link>
                  </Button>
                  <Button asChild variant="outline" className="min-h-[44px]">
                    <Link to="/profile">Profile settings</Link>
                  </Button>
                </div>
              </>
            )}
            {state === 'error' && (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <AlertCircle className="h-5 w-5 text-amber-500" /> Yeh link valid nahi lag raha.
                </p>
                <p className="text-sm text-muted-foreground">
                  Aap sign in karke Profile settings se reminders band kar sakte hain.
                </p>
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link to="/profile">Profile settings</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </Header>
  );
};

export default Unsubscribe;
