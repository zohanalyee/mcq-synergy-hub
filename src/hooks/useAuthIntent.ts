import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const INTENT_KEY = 'auth_intent';
const REDIRECT_KEY = 'redirect_after_auth';
const THIRTY_MINUTES = 30 * 60 * 1000;

interface AuthIntent {
  action: string;
  path: string;
  params?: any;
  timestamp: number;
}

const isDev = () => {
  try {
    return import.meta.env.DEV;
  } catch {
    return false;
  }
};

const log = (...args: any[]) => {
  if (isDev()) console.log('[AuthIntent]', ...args);
};

export const saveIntentRaw = (intent: Omit<AuthIntent, 'timestamp'>) => {
  try {
    const full: AuthIntent = { ...intent, timestamp: Date.now() };
    localStorage.setItem(INTENT_KEY, JSON.stringify(full));
    localStorage.setItem(REDIRECT_KEY, intent.path);
    log('Saved:', full);
  } catch (e) {
    log('Save failed (storage full?):', e);
  }
};

export const getIntentRaw = (): AuthIntent | null => {
  try {
    const saved = localStorage.getItem(INTENT_KEY);
    if (!saved) return null;
    const intent = JSON.parse(saved) as AuthIntent;
    if (Date.now() - intent.timestamp > THIRTY_MINUTES) {
      clearIntentRaw();
      log('Intent expired');
      return null;
    }
    return intent;
  } catch {
    clearIntentRaw();
    return null;
  }
};

export const clearIntentRaw = () => {
  localStorage.removeItem(INTENT_KEY);
  localStorage.removeItem(REDIRECT_KEY);
};

export const clearAllIntents = clearIntentRaw;

export const getIntentDebugInfo = () => ({
  intent: getIntentRaw(),
  redirect: localStorage.getItem(REDIRECT_KEY),
});

export const useAuthIntent = () => {
  const navigate = useNavigate();

  const saveIntent = useCallback((intent: Omit<AuthIntent, 'timestamp'>) => {
    saveIntentRaw(intent);
  }, []);

  const getIntent = useCallback(() => getIntentRaw(), []);
  const clearIntent = useCallback(() => clearIntentRaw(), []);

  const executeIntent = useCallback(() => {
    const intent = getIntentRaw();
    if (!intent) {
      navigate('/dashboard');
      return;
    }

    clearIntentRaw();
    log('Executing:', intent);

    toast({
      title: 'Welcome back! 🎉',
      description: `Continuing where you left off...`,
    });

    // Small delay for toast to show
    setTimeout(() => {
      try {
        navigate(intent.path, { state: intent.params, replace: true });
      } catch {
        log('Navigation failed, falling back to dashboard');
        navigate('/dashboard');
      }
    }, 300);
  }, [navigate]);

  return { saveIntent, getIntent, clearIntent, executeIntent };
};
