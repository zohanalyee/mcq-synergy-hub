import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CreditExhaustedDialog = ({ open, onClose }: Props) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-primary" />
          <h2 className="text-xl font-bold mt-4">Daily AI Limit Reached</h2>
          <p className="text-muted-foreground mt-2">
            You've used all 100 AI questions today!
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mt-4">
          <h3 className="font-semibold text-foreground">Keep Practicing:</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>✅ Thousands of curated questions available</li>
            <li>✅ All subjects & topics covered</li>
            <li>✅ High-quality content</li>
            <li>✅ Completely free forever</li>
          </ul>
        </div>

        <div className="bg-accent/10 border border-accent/20 p-3 rounded-lg mt-3 text-center">
          <p className="text-sm text-foreground">
            ⏰ AI questions reset at midnight
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            💡 Coming Soon: Unlimited AI questions!
          </p>
        </div>

        <Button className="w-full mt-4" onClick={onClose}>Continue Practicing</Button>
      </DialogContent>
    </Dialog>
  );
};

export default CreditExhaustedDialog;
