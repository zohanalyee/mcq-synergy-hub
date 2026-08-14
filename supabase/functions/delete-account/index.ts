// Self-service account deletion (Meta / Facebook Login "User Data Deletion" compliant).
//
// The caller must present their own valid access token. We resolve the user from
// that token with the anon client (never from the request body), sweep every
// table that holds their personal data, anonymise authored content, and finally
// remove the auth user with the service-role key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Personal / user-owned rows: hard delete.
const OWNED_TABLES = [
  "user_question_mastery",
  "user_question_attempts",
  "user_attempt_history",
  "user_quiz_attempts",
  "user_performance",
  "user_badges",
  "user_notifications",
  "user_ratings",
  "user_feedback",
  "user_generation_preferences",
  "user_appearance_settings",
  "user_custom_syllabus",
  "user_documents",
  "user_ai_topup_log",
  "user_credits",
  "credit_transactions",
  "test_attempts",
  "custom_test_sessions",
  "job_test_progress",
  "job_test_custom_syllabus",
  "saved_syllabus_templates",
  "recommended_tests",
  "content_downloads",
  "email_prefs",
  "email_send_log",
  "campaign_visits",
  "feedback",
  "reviews",
  "contact_submissions",
  "user_roles",
];

// Authored / shared content: keep the content, drop the personal link.
const AUTHORED_TABLES: Array<{ table: string; column: string }> = [
  { table: "content_items", column: "created_by" },
  { table: "content_submissions", column: "created_by" },
  { table: "blog_posts", column: "created_by" },
  { table: "job_test_definitions", column: "created_by" },
  { table: "agent_tasks", column: "created_by" },
  { table: "documents", column: "user_id" },
  { table: "study_audio_tracks", column: "uploaded_by" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Missing authorization token" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ success: false, error: "Invalid or expired session" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const failures: string[] = [];

    for (const table of OWNED_TABLES) {
      const { error } = await admin.from(table).delete().eq("user_id", user.id);
      if (error && error.code !== "42P01" && error.code !== "42703") {
        console.error(`[delete-account] ${table}:`, error.message);
        failures.push(table);
      }
    }

    for (const { table, column } of AUTHORED_TABLES) {
      const { error } = await admin.from(table).update({ [column]: null }).eq(column, user.id);
      if (error && error.code !== "42P01" && error.code !== "42703") {
        console.error(`[delete-account] anonymise ${table}:`, error.message);
      }
    }

    // Profile last (other rows may reference it), then the auth identity itself.
    await admin.from("profiles").delete().eq("id", user.id);

    const { error: authError } = await admin.auth.admin.deleteUser(user.id);
    if (authError) {
      console.error("[delete-account] auth delete failed:", authError.message);
      return json(
        {
          success: false,
          error:
            "Your data was removed but the login could not be deleted. Please email zohaibalichanna@gmail.com so we can finish the request.",
        },
        500,
      );
    }

    console.log(`[delete-account] deleted user ${user.id}; residual tables: ${failures.join(",") || "none"}`);
    return json({ success: true, residual: failures });
  } catch (err) {
    console.error("[delete-account] unexpected error:", err);
    return json({ success: false, error: "Unexpected error while deleting the account" }, 500);
  }
});
