import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle } from 'lucide-react';
import { saveIntentRaw } from '@/hooks/useAuthIntent';

interface Props {
  open: boolean;
  onClose: () => void;
  score: number;
  total: number;
}

const BENEFITS = [
  'Detailed answer explanations',
  'Track your progress over time',
  'AI-powered weak area analysis',
  'Personalized recommendations',
  '100 AI questions daily',
  'Dashboard & AI Coach access',
];

const QuizSignInGate = ({ open, onClose, score, total }: Props) => {
  const [showBasic, setShowBasic] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
          <h2 className="text-2xl font-bold mt-4">Great Job! 🎉</h2>
          <p className="text-muted-foreground mt-2">Sign in to see your detailed results</p>
        </div>

        <div className="space-y-2 mt-6">
          <h3 className="font-semibold text-sm">Unlock with Free Account:</h3>
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-sm">{b}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => setShowBasic(true)}>
            Basic Score Only
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              saveIntentRaw({ action: 'See full quiz results', path: location.pathname });
              navigate('/auth');
            }}
          >
            Sign In Free
          </Button>
        </div>

        {showBasic && (
          <div className="mt-4 p-4 bg-muted rounded-lg text-center">
            <p className="font-semibold">Your Score: {score}/{total}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to see detailed breakdown
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuizSignInGate;
