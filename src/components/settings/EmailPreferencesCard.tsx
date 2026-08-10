import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

/** Streak-reminder email opt-in toggle, shown on the Profile page. */
const EmailPreferencesCard = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('email_prefs')
        .select('streak_reminders')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) setEnabled(data?.streak_reminders ?? true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleToggle = async (next: boolean) => {
    if (!user) return;
    setSaving(true);
    setEnabled(next);
    const { error } = await supabase
      .from('email_prefs')
      .upsert({ user_id: user.id, streak_reminders: next }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      setEnabled(!next);
      toast.error('Preference save nahi hui', { description: error.message });
      return;
    }
    toast.success(next ? 'Reminder emails on kar di gayin' : 'Reminder emails band kar di gayin');
  };

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Email Reminders
        </CardTitle>
        <CardDescription>Choose whether we nudge you when your streak is about to break.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Streak reminder emails</p>
            <p className="text-xs text-muted-foreground">
              2-3 din practice na karne par ek friendly reminder — max 1 email per 5 days.
            </p>
          </div>
          <Switch
            checked={enabled ?? true}
            disabled={enabled === null || saving}
            onCheckedChange={handleToggle}
            aria-label="Toggle streak reminder emails"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailPreferencesCard;
