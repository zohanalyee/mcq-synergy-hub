import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/contexts/AuthContext';

export const PENDING_EMAIL_OPTOUT_KEY = 'pending_email_reminder_optout';

/**
 * Applies a signup-time "don't email me" choice once the user session exists.
 * The DB trigger creates the preference row with reminders ON by default, so we
 * only need to write when the user explicitly opted out during sign-up.
 */
const EmailPrefSync = () => {
  const { user } = useAuthSafe();

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(PENDING_EMAIL_OPTOUT_KEY) !== 'true') return;

    (async () => {
      const { error } = await supabase
        .from('email_prefs')
        .upsert({ user_id: user.id, streak_reminders: false }, { onConflict: 'user_id' });
      if (!error) localStorage.removeItem(PENDING_EMAIL_OPTOUT_KEY);
    })();
  }, [user]);

  return null;
};

export default EmailPrefSync;
