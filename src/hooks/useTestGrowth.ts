import { useEffect, useRef, useState } from 'react';
import { getJobTests } from '@/services/jobTestService';
import { jobTests as fallbackTests } from '@/data/jobTestsData';
import { toJobTestSlug } from '@/lib/jobTestSlug';
import { isNthpTest, isStsTest } from '@/lib/programStatus';
import { markGuestAttempt } from '@/lib/growthEvents';
import { createAttemptTracker } from '@/lib/growthRules';
import { trackEvent } from '@/utils/analytics';

type Identity = { name: string; path: string | null; test_slug: string; exam_category: string };

/** Resolve public metadata, never send the session ID or user-supplied session name. */
export function useTestGrowth({ ready, finished, guest, sessionName, returnPath, kind }: {
  ready: boolean; finished: boolean; guest: boolean; sessionName?: string; returnPath?: string; kind: 'quiz' | 'practice';
}) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const trackerRef = useRef<ReturnType<typeof createAttemptTracker> | null>(null);
  const finishedRef = useRef(finished);
  finishedRef.current = finished;
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const resolve = async () => {
      let value: Identity = { name: kind === 'quiz' ? 'Quiz' : 'Practice Test', path: null, test_slug: kind, exam_category: kind };
      if (sessionName?.startsWith('Job Test:')) {
        const rows = await getJobTests().catch(() => []);
        const tests = rows.length ? rows : fallbackTests;
        const title = sessionName.replace(/^Job Test:\s*/, '');
        const test = tests.find(row => row.title === title);
        if (test) {
          const slug = toJobTestSlug(test, tests);
          value = { name: test.title, path: `/mock-tests/${slug}`, test_slug: slug,
            exam_category: isNthpTest(test.organization, test.title) ? 'nthp'
              : /\bsthp\b/i.test(test.title) ? 'sthp' : isStsTest(test.organization, test.title) ? 'sts' : 'mock_test' };
        }
      } else if (returnPath && /^\/(boards|exams|mock-tests)\/[^?]+$/.test(returnPath)) {
        // A stable public source page is safe; personalized session URLs never are.
        value = { ...value, path: returnPath, test_slug: returnPath.split('/').filter(Boolean).join('_') };
      }
      if (cancelled) return;
      setIdentity(value);
      if (!trackerRef.current) {
        trackerRef.current = createAttemptTracker({ test_slug: value.test_slug, exam_category: value.exam_category }, trackEvent);
        trackerRef.current.start();
        if (guest) markGuestAttempt();
      }
      if (finishedRef.current) trackerRef.current.finish();
      else if (document.hidden) trackerRef.current.abandon();
    };
    void resolve();
    return () => { cancelled = true; };
  }, [ready, guest, sessionName, returnPath, kind]);

  useEffect(() => { if (finished) trackerRef.current?.finish(); }, [finished]);
  useEffect(() => {
    const abandon = () => { if (!finishedRef.current) trackerRef.current?.abandon(); };
    const visibility = () => document.hidden ? abandon() : trackerRef.current?.resume();
    window.addEventListener('pagehide', abandon);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      abandon(); // SPA navigation does not emit pagehide.
      window.removeEventListener('pagehide', abandon);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return identity;
}