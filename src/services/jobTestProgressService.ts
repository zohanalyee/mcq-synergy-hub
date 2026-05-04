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

export async function fetchJobTestProgress(jobTestId: string): Promise<JobTestProgress | null> {
  try {
    const { data, error } = await supabase.functions.invoke("job-test-progress", {
      method: "GET" as any,
      body: undefined,
      headers: {} as any,
      // supabase-js doesn't support GET with query string directly via invoke,
      // so fall back to fetch
    } as any);
    if (!error && data) return data as JobTestProgress;
  } catch {}

  try {
    const projectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/job-test-progress?job_test_id=${encodeURIComponent(jobTestId)}`;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        apikey: (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY,
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
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
