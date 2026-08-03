import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserX, UserCheck, Check, X } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

interface GuestChoiceModalProps {
  open: boolean;
  onClose: () => void;
  onGuestContinue: () => void;
  onSignIn: () => void;
  action: string;
  guestMessage?: string;
}

const GuestChoiceModal = ({
  open,
  onClose,
  onGuestContinue,
  onSignIn,
  action,
  guestMessage,
}: GuestChoiceModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <BrandMark className="justify-center mb-1" />
          <DialogTitle className="text-center text-lg">
            How would you like to continue?
          </DialogTitle>
          {guestMessage && (
            <p className="text-center text-sm text-muted-foreground mt-1">
              {guestMessage}
            </p>
          )}
        </DialogHeader>

        <div className="grid gap-4 mt-2">
          {/* Guest Option */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <UserX className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Try free</p>
                <p className="text-xs text-muted-foreground">Quick access, no account needed</p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>Instant access</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <X className="w-3.5 h-3.5 text-destructive" />
                <span>Results won't be saved</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <X className="w-3.5 h-3.5 text-destructive" />
                <span>No progress tracking</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={onGuestContinue}>
              Try free
            </Button>
          </div>

          {/* Sign In Option (Recommended) */}
          <div className="border-2 border-primary rounded-lg p-4 space-y-3 relative">
            <span className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              Recommended
            </span>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Sign in to unlock</p>
                <p className="text-xs text-muted-foreground">Full features & progress tracking</p>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>Save all your progress</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>Detailed analytics</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>AI-powered insights</span>
              </div>
            </div>

            <Button className="w-full" onClick={onSignIn}>
              Sign in to unlock {action}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestChoiceModal;
