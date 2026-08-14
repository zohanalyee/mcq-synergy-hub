import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CONFIRM_WORD = 'DELETE';

/**
 * Danger zone: permanent, self-service account deletion.
 * Required for Meta (Facebook Login) user-data-deletion compliance.
 */
const DeleteAccountCard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) throw new Error(error.message);
      if (data && data.success === false) throw new Error(data.error || 'Deletion failed');

      toast.success('Account deleted', {
        description: 'Your account and personal data have been permanently removed.',
      });
      setOpen(false);
      // The auth user no longer exists, so a server-side sign-out will fail.
      // Clear the local session explicitly so no stale token remains.
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        /* ignore */
      }
      try {
        await signOut();
      } catch {
        /* ignore */
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error('Could not delete account', {
        description:
          err?.message ||
          'Something went wrong. Please try again, or email zohaibalichanna@gmail.com for help.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border border-destructive/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your MCQsAI account, profile, test history, and all personal data. This
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li>Your login (email or social sign-in) is removed permanently.</li>
          <li>Profile, test attempts, badges, credits, and email preferences are deleted.</li>
          <li>You will need to create a new account to use MCQsAI again.</li>
          <li>
            Your Facebook, Google, or Microsoft account itself is <span className="text-foreground font-medium">not</span> deleted —
            only its connection to MCQsAI is removed.
          </li>
        </ul>

        <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmText(''); }}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="min-h-11 gap-2">
              <Trash2 className="h-4 w-4" />
              Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-left">
                  <p>This action is permanent and cannot be undone.</p>
                  <p>
                    Your account, profile, and all personal data (test history, progress, badges,
                    credits, email preferences) will be permanently deleted from our systems.
                  </p>
                  <p>
                    Type <span className="font-semibold text-foreground">{CONFIRM_WORD}</span> below
                    to confirm.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-delete" className="text-xs text-muted-foreground">
                Confirmation
              </Label>
              <Input
                id="confirm-delete"
                autoComplete="off"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_WORD}
                className="min-h-11"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-11" disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={confirmText.trim().toUpperCase() !== CONFIRM_WORD || isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete permanently'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-muted-foreground">
          Lost access to your account? Email{' '}
          <a href="mailto:zohaibalichanna@gmail.com" className="underline">
            zohaibalichanna@gmail.com
          </a>{' '}
          and we will process the deletion within 30 days.
        </p>
      </CardContent>
    </Card>
  );
};

export default DeleteAccountCard;
