// Background processor for the mock-test generation queue.
// Cron- or admin-triggered. Picks a small batch of pending rows and generates
// DRAFT questions (admin_approved=false) via the existing generate-job-test
// function — gradual "dheere dheere" fill. Approval stays 100% manual.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-trigger",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Keep each run small so generation trickles in without long waits / big spend.
const BATCH_PER_RUN = 2;
const MAX_ATTEMPTS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const isScheduled = !!authHeader && authHeader.includes(serviceKey);
    const isAdminTrigger = req.headers.get("x-admin-trigger") === "true";

    let authorized = isScheduled;

    if (!authorized && isAdminTrigger && authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data } = await userClient.auth.getUser(token);
      if (data?.user) {
        const { data: role } = await userClient
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();
        authorized = !!role;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Grab the oldest pending rows.
    const { data: rows, error: fetchErr } = await admin
      .from("job_test_generation_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(BATCH_PER_RUN);

    if (fetchErr) throw new Error(`Fetch queue failed: ${fetchErr.message}`);

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending queue items" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: any[] = [];

    for (const row of rows) {
      // Claim the row.
      await admin
        .from("job_test_generation_queue")
        .update({ status: "processing", attempts: (row.attempts || 0) + 1 })
        .eq("id", row.id);

      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/generate-job-test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ job_test_id: row.job_test_id, subject: row.subject }),
        });

        const payload = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          throw new Error(payload?.error || `generate-job-test HTTP ${resp.status}`);
        }

        // generate-job-test returns per-subject results; sum accepted.
        let accepted = 0;
        if (typeof payload?.total_accepted === "number") {
          accepted = payload.total_accepted;
        } else if (Array.isArray(payload?.results)) {
          accepted = payload.results.reduce(
            (a: number, r: any) => a + (r?.accepted || 0),
            0,
          );
        }

        await admin
          .from("job_test_generation_queue")
          .update({
            status: "done",
            accepted_count: accepted,
            error_message: null,
            processed_at: new Date().toISOString(),
          })
          .eq("id", row.id);

        results.push({ id: row.id, subject: row.subject, status: "done", accepted });
        console.log(`[jobtest-queue] ✅ ${row.subject} — accepted ${accepted}`);
      } catch (e) {
        const msg = (e as Error).message;
        const attempts = (row.attempts || 0) + 1;
        const finalFail = attempts >= MAX_ATTEMPTS;
        await admin
          .from("job_test_generation_queue")
          .update({
            status: finalFail ? "failed" : "pending",
            error_message: msg,
            processed_at: finalFail ? new Date().toISOString() : null,
          })
          .eq("id", row.id);
        results.push({
          id: row.id,
          subject: row.subject,
          status: finalFail ? "failed" : "retry",
          error: msg,
        });
        console.error(`[jobtest-queue] ❌ ${row.subject}: ${msg}`);
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[jobtest-queue] fatal:", (e as Error).message);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
