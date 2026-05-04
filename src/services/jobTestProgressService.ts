import { supabase } from "@/integrations/supabase/client";

export interface JobTestProgress {
  unlocked: number;
  total_attempts: number;
  best_score: number;
  weak_topics: string[];
  is_guest?: boolean;
  unlocked_delta?: number;
  qualified?: boolean;
}

export const jobTestIdFromTitle = (title: string): string =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const PROJECT_ID = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function fetchJobTestProgress(jobTestId: string): Promise<JobTestProgress | null> {
  if (!jobTestId || !PROJECT_ID) return null;
  try {
    const url = `https://${PROJECT_ID}.supabase.co/functions/v1/job-test-progress?job_test_id=${encodeURIComponent(jobTestId)}`;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : { Authorization: `Bearer ${ANON_KEY}` }),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as JobTestProgress;
  } catch (e) {
    console.error("[jobTestProgress] fetch failed", e);
    return null;
  }
}

export async function recordJobTestProgress(
  jobTestId: string,
  score: number,
  weakTopics: string[],
): Promise<JobTestProgress | null> {
  try {
    const { data, error } = await supabase.functions.invoke("job-test-progress", {
      body: { job_test_id: jobTestId, score, weak_topics: weakTopics },
    });
    if (error) throw error;
    return data as JobTestProgress;
  } catch (e) {
    console.error("[jobTestProgress] record failed", e);
    return null;
  }
}
