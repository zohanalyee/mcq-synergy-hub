// Job test progressive unlock — GET fetches progress, POST records attempt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve user from JWT if present
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await admin.auth.getUser(token);
      userId = user?.id ?? null;
    }
    const ip = userId ? null : getIp(req);

    if (req.method === "GET") {
      const url = new URL(req.url);
      const jobTestId = url.searchParams.get("job_test_id");
      if (!jobTestId) {
        return new Response(JSON.stringify({ error: "job_test_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let q = admin.from("job_test_progress").select("*").eq("job_test_id", jobTestId);
      q = userId ? q.eq("user_id", userId) : q.is("user_id", null).eq("ip_address", ip);
      const { data } = await q.maybeSingle();

      const row = data || {
        questions_unlocked: 100,
        total_attempts: 0,
        best_score: 0,
        weak_topics: [],
      };

      return new Response(JSON.stringify({
        unlocked: row.questions_unlocked,
        total_attempts: row.total_attempts,
        best_score: row.best_score,
        weak_topics: row.weak_topics,
        is_guest: !userId,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { job_test_id, score, weak_topics } = body || {};
      if (!job_test_id || typeof score !== "number") {
        return new Response(JSON.stringify({ error: "job_test_id and score required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await admin.rpc("update_job_test_progress", {
        p_user_id: userId,
        p_ip_address: ip,
        p_job_test_id: String(job_test_id),
        p_score: score,
        p_weak_topics: Array.isArray(weak_topics) ? weak_topics : [],
      });

      if (error) throw error;

      return new Response(JSON.stringify({ ...data, is_guest: !userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (e: any) {
    console.error("[job-test-progress]", e);
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
