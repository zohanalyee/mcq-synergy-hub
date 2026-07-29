// submit-inquiry — hCaptcha-gated public inquiry submission.
// Verifies the client's hCaptcha token with hCaptcha's siteverify API, then
// inserts into public.user_inquiries using the service role (bypassing RLS
// only after captcha passes). Keeps guest spam out of the inquiry table.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InquiryPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  captcha_token?: string;
}

function getIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip");
}

async function verifyHCaptcha(token: string, remoteIp: string | null): Promise<{ ok: boolean; reason?: string }> {
  const secret = Deno.env.get("HCAPTCHA_SECRET_KEY");
  if (!secret) return { ok: false, reason: "captcha_not_configured" };
  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (remoteIp) form.set("remoteip", remoteIp);
    const res = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = await res.json();
    if (data?.success) return { ok: true };
    return { ok: false, reason: (data?.["error-codes"] || []).join(",") || "captcha_failed" };
  } catch (err: any) {
    return { ok: false, reason: `captcha_error:${err?.message || "unknown"}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body: InquiryPayload = await req.json().catch(() => ({}));
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const subject = (body.subject || "").trim();
    const message = (body.message || "").trim();
    const captchaToken = (body.captcha_token || "").trim();

    // Basic input validation (mirrors the RLS check for defense-in-depth)
    if (!name || name.length > 100)
      return new Response(JSON.stringify({ error: "Name is required (max 100 chars)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return new Response(JSON.stringify({ error: "A valid email is required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!subject || subject.length > 200)
      return new Response(JSON.stringify({ error: "Subject is required (max 200 chars)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!message || message.length > 2000)
      return new Response(JSON.stringify({ error: "Message is required (max 2000 chars)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!captchaToken)
      return new Response(JSON.stringify({ error: "Please complete the captcha." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // hCaptcha verification
    const ip = getIp(req);
    const captcha = await verifyHCaptcha(captchaToken, ip);
    if (!captcha.ok) {
      console.warn(`[submit-inquiry] captcha failed from ${ip} — ${captcha.reason}`);
      return new Response(
        JSON.stringify({ error: "Captcha verification failed. Please try again.", reason: captcha.reason }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert as service role (RLS is already restrictive for anon; this is the trusted path)
    const { error } = await admin
      .from("user_inquiries")
      .insert({ name, email, subject, message, is_public: false });

    if (error) {
      console.error("[submit-inquiry] insert error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to send message. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[submit-inquiry] error:", err?.message || err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
