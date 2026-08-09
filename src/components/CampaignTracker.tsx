import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthSafe } from '@/contexts/AuthContext';
import { attributeSignup, recordCampaignVisit } from '@/lib/campaignTracking';

/**
 * Logs offline-campaign visits (QR banners) once per session and attributes
 * a signup to the campaign that brought the student in.
 */
const CampaignTracker = () => {
  const location = useLocation();
  const auth = useAuthSafe();
  const user = auth?.user ?? null;
  const stamped = useRef<string | null>(null);

  useEffect(() => {
    void recordCampaignVisit(location.pathname, location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user?.id || stamped.current === user.id) return;
    stamped.current = user.id;
    void attributeSignup(user.id);
  }, [user?.id]);

  return null;
};

export default CampaignTracker;
