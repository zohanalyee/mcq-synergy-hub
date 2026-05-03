import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveIntentRaw } from '@/hooks/useAuthIntent';

interface Props { open: boolean; onClose: () => void; }

const AttendanceAuthDialog = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <div className="text-center">
          <Lock className="w-16 h-16 mx-auto text-primary" />
          <h2 className="text-xl font-bold mt-4">Login Required</h2>
          <p className="text-muted-foreground mt-2">
            School Attendance Management requires authentication
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {[
            'Save attendance records permanently',
            'Access historical data & reports',
            'Sync across all your devices',
            'Maintain student privacy & security',
          ].map(t => (
            <div key={t} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <p className="text-sm">{t}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={() => {
              saveIntentRaw({ action: 'Open School Attendance', path: location.pathname });
              navigate('/auth');
            }}
          >
            Sign In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceAuthDialog;
