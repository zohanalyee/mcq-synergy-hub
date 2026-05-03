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
          <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          <h2 className="text-xl font-bold mt-4">Daily AI Limit Reached</h2>
          <p className="text-muted-foreground mt-2">
            You've used all 100 AI questions today!
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
          <h3 className="font-semibold text-green-900 dark:text-green-100">Keep Practicing:</h3>
          <ul className="mt-2 space-y-1 text-sm text-green-800 dark:text-green-200">
            <li>✅ Thousands of curated questions available</li>
            <li>✅ All subjects & topics covered</li>
            <li>✅ High-quality content</li>
            <li>✅ Completely free forever</li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-3 text-center">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            ⏰ AI questions reset at midnight
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            💡 Coming Soon: Unlimited AI questions!
          </p>
        </div>

        <Button className="w-full mt-4" onClick={onClose}>Continue Practicing</Button>
      </DialogContent>
    </Dialog>
  );
};

export default CreditExhaustedDialog;
