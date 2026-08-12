// Background processor for the mock-test generation queue.
// Cron- or admin-triggered. Picks a small batch of pending rows and generates
// DRAFT questions (admin_approved=false) via the existing generate-job-test
// function — gradual "dheere dheere" fill. Approval stays 100% manual.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Keep each run to ONE row. One subject can take ~60-70s; processing more than
// one row risks Edge Function shutdown before the final row commits done/failed.
const BATCH_PER_RUN = 1;
const MAX_ATTEMPTS = 3;
const STALE_PROCESSING_MS = 8 * 60 * 1000;

async function kickNextIfPending(admin: any, supabaseUrl: string, serviceKey: string) {
  const { count } = await admin
    .from("job_test_generation_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .limit(1);

  if ((count || 0) <= 0) return;

  // Fire-and-forget: the next invocation handles one row, keeping each run
  // under the Edge Function execution window while still draining the queue.
  fetch(`${supabaseUrl}/functions/v1/process-jobtest-queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ chained: true }),
  }).catch((e) => console.error("[jobtest-queue] next-kick failed:", e?.message || e));
}

/**
 * Phase 2 — popularity-first pool growth.
 * When the queue is idle, look at which mock tests users are actually taking
 * (attempts + distinct users, 14-day window) and enqueue per-section pool
 * growth for the most popular tests whose pool is below its growth target.
 * Generation stays background + draft-only; approval remains manual.
 */
async function enqueuePopularTests(
  admin: any,
  maxTests = 3,
  maxRows = 10,
): Promise<{ enqueued: number; considered: number; error?: string }> {
  const { data: pop, error } = await admin.rpc("get_mock_test_popularity", { p_days: 14 });
  if (error) {
    console.error("[jobtest-queue] popularity rpc failed:", error.message);
    return { enqueued: 0, considered: 0, error: error.message };
  }

  const candidates = (pop || [])
    .filter((r: any) => r.definition_id && Number(r.attempts) > 0 && Number(r.pool_deficit) > 0)
    .slice(0, maxTests);

  if (candidates.length === 0) return { enqueued: 0, considered: 0 };

  const { data: active } = await admin
    .from("job_test_generation_queue")
    .select("job_test_id, subject")
    .in("status", ["pending", "processing"]);
  const activeKeys = new Set(
    (active || []).map((r: any) => `${r.job_test_id}|${r.subject}`),
  );

  const rows: any[] = [];
  for (const t of candidates) {
    if (rows.length >= maxRows) break;
    const { data: def } = await admin
      .from("job_test_definitions")
      .select("syllabus, pool_multiplier")
      .eq("id", t.definition_id)
      .maybeSingle();
    const sections = (def?.syllabus?.sections || []) as any[];
    const multiplier = Math.max(1, Number(def?.pool_multiplier ?? t.pool_multiplier ?? 2));

    for (const s of sections) {
      if (rows.length >= maxRows) break;
      const sectionTarget = Number(s?.question_count || 0);
      if (!s?.subject || sectionTarget <= 0) continue;
      if (activeKeys.has(`${t.definition_id}|${s.subject}`)) continue;

      const growTarget = Math.ceil(sectionTarget * multiplier);
      const { count } = await admin
        .from("job_test_questions")
        .select("id", { count: "exact", head: true })
        .eq("job_test_id", t.definition_id)
        .eq("subject", s.subject);
      if ((count || 0) >= growTarget) continue;

      rows.push({
        job_test_id: t.definition_id,
        subject: s.subject,
        target_count: sectionTarget,
        grow_target: growTarget,
        status: "pending",
      });
    }
  }

  if (rows.length === 0) return { enqueued: 0, considered: candidates.length };

  const { error: insErr } = await admin.from("job_test_generation_queue").insert(rows);
  if (insErr) {
    console.error("[jobtest-queue] popularity enqueue failed:", insErr.message);
    return { enqueued: 0, considered: candidates.length, error: insErr.message };
  }

  console.log(
    `[jobtest-queue] 📈 popularity fill queued ${rows.length} section(s) across ${candidates.length} popular test(s)`,
  );
  return { enqueued: rows.length, considered: candidates.length };
}

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

    let authorized = isScheduled;

    const admin0 = createClient(supabaseUrl, serviceKey);

    // Scheduled pg_cron call: presents the shared cron token from system_settings.
    const cronToken = req.headers.get("x-cron-token");
    if (!authorized && cronToken) {
      const { data: setting } = await admin0
        .from("system_settings")
        .select("value")
        .eq("key", "indexnow_cron_token")
        .maybeSingle();
      const expected = typeof setting?.value === "string" ? setting.value : null;
      authorized = !!expected && cronToken === expected;
    }

    // Browser admins invoke with their JWT — verify the admin role.
    if (!authorized && authHeader?.startsWith("Bearer ")) {
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

    const nowIso = new Date().toISOString();
    const staleBeforeIso = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();

    // Recover rows left in processing after a timed-out/shutdown invocation.
    const { data: staleRows, error: staleFetchErr } = await admin
      .from("job_test_generation_queue")
      .select("*")
      .eq("status", "processing")
      .lt("updated_at", staleBeforeIso)
      .limit(20);

    if (staleFetchErr) throw new Error(`Fetch stale queue failed: ${staleFetchErr.message}`);

    for (const stale of staleRows || []) {
      const exhausted = (stale.attempts || 0) >= MAX_ATTEMPTS;
      await admin
        .from("job_test_generation_queue")
        .update({
          status: exhausted ? "failed" : "pending",
          error_message: exhausted
            ? "failed: processing timed out after max attempts"
            : "requeued: previous processing timed out",
          processed_at: exhausted ? nowIso : null,
          updated_at: nowIso,
        })
        .eq("id", stale.id)
        .eq("status", "processing");
      console.log(
        `[jobtest-queue] ♻️ ${stale.subject} — ${exhausted ? "failed" : "requeued"} stale processing row`,
      );
    }

    // Grab the oldest pending row only.
    const { data: rows, error: fetchErr } = await admin
      .from("job_test_generation_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(BATCH_PER_RUN);

    if (fetchErr) throw new Error(`Fetch queue failed: ${fetchErr.message}`);

    if (!rows || rows.length === 0) {
      // Idle queue → popularity-first pool growth (skipped for chained kicks
      // so a drain loop never re-enqueues on itself).
      const body = await req.json().catch(() => ({} as any));
      if (!body?.chained && body?.popularity_fill !== false) {
        const fill = await enqueuePopularTests(admin);
        if (fill.enqueued > 0) {
          await kickNextIfPending(admin, supabaseUrl, serviceKey);
          return new Response(
            JSON.stringify({
              processed: 0,
              message: `Popularity fill queued ${fill.enqueued} section(s)`,
              popularity_fill: fill,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({
            processed: 0,
            message: "No pending queue items",
            popularity_fill: fill,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending queue items" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    const results: any[] = [];

    const row = rows[0];

    // Claim the row conditionally so parallel cron/browser kicks do not process
    // the same subject twice.
    const attempts = (row.attempts || 0) + 1;
    const { data: claimed, error: claimErr } = await admin
      .from("job_test_generation_queue")
      .update({
        status: "processing",
        attempts,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();

    if (claimErr) throw new Error(`Claim queue failed: ${claimErr.message}`);

    if (!claimed) {
      return new Response(
        JSON.stringify({ processed: 0, message: "Queue item already claimed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    {
      const row = claimed;

      // A row could be cancelled between fetch and claim in future variants.
      if (row.status === "cancelled") {
        return new Response(
          JSON.stringify({ processed: 0, message: "Queue item cancelled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Record the processing heartbeat immediately for realtime UI.
      await admin
        .from("job_test_generation_queue")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", row.id);

      // ---- Genuine-deficit guard ----
      // A row may have been enqueued while the subject was short, but the admin
      // (or an earlier queue run) has since filled/approved enough questions.
      // Re-check the LIVE approved count before spending any AI. If the target
      // is already met, skip generation entirely — zero AI call, zero credits.
      // A grow row asks for a bigger pool than the exam-share target; honour it.
      const target = row.grow_target || row.target_count || 0;
      if (target > 0) {
        const { count: approvedCount, error: countErr } = await admin
          .from("job_test_questions")
          .select("*", { count: "exact", head: true })
          .eq("job_test_id", row.job_test_id)
          .eq("subject", row.subject)
          .eq("admin_approved", true);

        if (!countErr && (approvedCount || 0) >= target) {
          await admin
            .from("job_test_generation_queue")
            .update({
              status: "done",
              accepted_count: 0,
              error_message: "skipped: deficit already satisfied",
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          results.push({
            id: row.id,
            subject: row.subject,
            status: "skipped",
            approved: approvedCount || 0,
            target,
          });
          console.log(
            `[jobtest-queue] ⏭️ ${row.subject} — skipped (approved ${approvedCount}/${target}, no deficit)`,
          );
          await kickNextIfPending(admin, supabaseUrl, serviceKey);
          return new Response(
            JSON.stringify({ processed: results.length, results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        // Idempotency guard: if a previous invocation inserted draft questions
        // but timed out before committing queue status, do not spend AI again.
        const { count: totalExistingCount, error: totalCountErr } = await admin
          .from("job_test_questions")
          .select("*", { count: "exact", head: true })
          .eq("job_test_id", row.job_test_id)
          .eq("subject", row.subject);

        if (!totalCountErr && (totalExistingCount || 0) >= target) {
          await admin
            .from("job_test_generation_queue")
            .update({
              status: "done",
              accepted_count: 0,
              error_message: "skipped: generated drafts already cover target; review pending",
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id);
          results.push({
            id: row.id,
            subject: row.subject,
            status: "skipped",
            existing: totalExistingCount || 0,
            target,
          });
          console.log(
            `[jobtest-queue] ⏭️ ${row.subject} — skipped (existing drafts ${totalExistingCount}/${target}, no duplicate AI)`,
          );
          await kickNextIfPending(admin, supabaseUrl, serviceKey);
          return new Response(
            JSON.stringify({ processed: results.length, results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/generate-job-test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            job_test_id: row.job_test_id,
            subject: row.subject,
            ...(row.grow_target ? { grow_target: row.grow_target } : {}),
          }),

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
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);

        results.push({ id: row.id, subject: row.subject, status: "done", accepted });
        console.log(`[jobtest-queue] ✅ ${row.subject} — accepted ${accepted}`);
      } catch (e) {
        const msg = (e as Error).message;
        const attempts = row.attempts || 1;
        const finalFail = attempts >= MAX_ATTEMPTS;
        await admin
          .from("job_test_generation_queue")
          .update({
            status: finalFail ? "failed" : "pending",
            error_message: msg,
            processed_at: finalFail ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
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

    await kickNextIfPending(admin, supabaseUrl, serviceKey);

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
