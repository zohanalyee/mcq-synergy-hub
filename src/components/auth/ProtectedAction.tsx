import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthIntent } from '@/hooks/useAuthIntent';
import { getFeatureConfig } from '@/config/features';
import GuestChoiceModal from '@/components/auth/GuestChoiceModal';

interface ProtectedActionProps {
  children: ReactNode;
  action: string;
  path: string;
  params?: any;
  featureId?: string;
  requireAuth?: boolean;
  guestAllowed?: boolean;
  guestMessage?: string;
  onGuestAction?: () => void;
}

const ProtectedAction = ({
  children,
  action,
  path,
  params,
  featureId,
  requireAuth,
  guestAllowed,
  guestMessage,
  onGuestAction,
}: ProtectedActionProps) => {
  const { user } = useAuth();
  const { saveIntent } = useAuthIntent();
  const navigate = useNavigate();
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Resolve config from featureId or props
  const config = featureId ? getFeatureConfig(featureId) : null;
  const isAuthRequired = requireAuth ?? config?.requiresAuth ?? true;
  const isGuestAllowed = guestAllowed ?? config?.guestAllowed ?? false;
  const resolvedGuestMessage = guestMessage ?? config?.guestMessage ?? 'Sign in for the full experience';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Already authenticated → go directly
    if (user) {
      navigate(path, { state: params });
      return;
    }

    // Guest allowed → show choice modal
    if (isGuestAllowed && !isAuthRequired) {
      setShowGuestModal(true);
      return;
    }

    // Auth required → save intent and redirect
    saveIntent({ action, path, params });
    navigate('/auth');
  };

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>

      <GuestChoiceModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        onGuestContinue={() => {
          setShowGuestModal(false);
          if (onGuestAction) {
            onGuestAction();
          } else {
            navigate(path, { state: { ...params, guest: true } });
          }
        }}
        onSignIn={() => {
          setShowGuestModal(false);
          saveIntent({ action, path, params });
          navigate('/auth');
        }}
        action={action}
        guestMessage={resolvedGuestMessage}
      />
    </>
  );
};

export default ProtectedAction;
