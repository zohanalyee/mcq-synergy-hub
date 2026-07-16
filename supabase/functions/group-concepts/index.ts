// Phase 3 (LINK-only) — Assigns concept_group_id across content_items + job_test_questions.
// Admin-triggered. Processes ONE subject per invocation to stay under the Edge Function
// execution window. Call repeatedly (or from a cron loop) until all subjects are grouped.
//
// Algorithm (subject-scoped):
//   1. Tier 1: exact fingerprint match  → union.
//   2. Tier 2: Jaccard similarity ≥ 0.60 on token-set → union.
//   3. Assign one concept_group_id per union; write to BOTH tables.
//
// Zero destructive ops. No question is deleted, hidden, merged, or status-changed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JACCARD_THRESHOLD = 0.6;
const STOPWORDS = new Set([
  "the","a","an","of","to","in","on","for","and","or","is","are","was","were","be","been",
  "which","that","this","these","those","it","its","as","by","with","at","from","into",
  "what","who","whom","when","where","how","why","not","no","do","does","did","has","have",
  "had","can","could","should","would","may","might","will","shall","one","following","all",
  "any","some","most","many","other","also","than","then","if","so","such","only","about",
  "there","their","they","them","he","she","his","her","you","your","we","our","i","me","my",
]);

function tokenize(text: string): Set<string> {
  const tokens = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return new Set(tokens);
}

function fingerprint(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const uni = a.size + b.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

// Union-Find
class UF {
  parent: number[];
  constructor(n: number) { this.parent = Array.from({ length: n }, (_, i) => i); }
  find(x: number): number { return this.parent[x] === x ? x : (this.parent[x] = this.find(this.parent[x])); }
  union(a: number, b: number) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.parent[ra] = rb; }
}

async function verifyAdmin(req: Request, supabase: any): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && authHeader?.includes(serviceKey)) return true;
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.replace("Bearer ", "");
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) return false;
  const { data: role } = await supabase
    .from("user_roles").select("role")
    .eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  return !!role;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (!(await verifyAdmin(req, supabase))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const explicitSubject: string | undefined = body.subject;
    const regroup: boolean = body.regroup === true; // if true, re-process rows even if already grouped

    // Discover next subject to process if not provided.
    let subject = explicitSubject;
    if (!subject) {
      const filter = regroup ? "" : ".is.null";
      // Prefer content_items subjects with un-grouped rows.
      const { data: nextCi } = await supabase
        .from("content_items")
        .select("subject")
        .eq("category", "mcq").eq("status", "approved")
        .is("concept_group_id", null)
        .not("subject", "is", null)
        .limit(1);
      if (nextCi && nextCi.length > 0) {
        subject = nextCi[0].subject;
      } else {
        const { data: nextJtq } = await supabase
          .from("job_test_questions")
          .select("subject")
          .eq("admin_approved", true)
          .is("concept_group_id", null)
          .not("subject", "is", null)
          .limit(1);
        if (nextJtq && nextJtq.length > 0) subject = nextJtq[0].subject;
      }
    }

    if (!subject) {
      return new Response(JSON.stringify({ done: true, message: "All subjects already grouped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[group-concepts] processing subject="${subject}" regroup=${regroup}`);

    // Fetch pool for this subject from both tables.
    const ciQuery = supabase
      .from("content_items")
      .select("id, title, concept_group_id")
      .eq("category", "mcq").eq("status", "approved")
      .eq("subject", subject).limit(5000);
    const jtqQuery = supabase
      .from("job_test_questions")
      .select("id, question, concept_group_id")
      .eq("admin_approved", true)
      .eq("subject", subject).limit(5000);

    const [{ data: ciRows }, { data: jtqRows }] = await Promise.all([ciQuery, jtqQuery]);

    type Item = { src: "ci" | "jtq"; id: string; text: string; existingGroup: string | null; tokens: Set<string>; fp: string };
    const items: Item[] = [];
    for (const r of ciRows || []) {
      const text = String(r.title || "");
      if (!text.trim()) continue;
      items.push({ src: "ci", id: r.id, text, existingGroup: r.concept_group_id || null, tokens: tokenize(text), fp: fingerprint(text) });
    }
    for (const r of jtqRows || []) {
      const text = String(r.question || "");
      if (!text.trim()) continue;
      items.push({ src: "jtq", id: r.id, text, existingGroup: r.concept_group_id || null, tokens: tokenize(text), fp: fingerprint(text) });
    }

    if (items.length === 0) {
      return new Response(JSON.stringify({ subject, message: "No items to group" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uf = new UF(items.length);

    // Tier 1: exact fingerprint.
    const fpBuckets = new Map<string, number[]>();
    for (let i = 0; i < items.length; i++) {
      if (!items[i].fp) continue;
      const arr = fpBuckets.get(items[i].fp) || [];
      arr.push(i);
      fpBuckets.set(items[i].fp, arr);
    }
    let tier1Pairs = 0;
    for (const arr of fpBuckets.values()) {
      for (let k = 1; k < arr.length; k++) { uf.union(arr[0], arr[k]); tier1Pairs++; }
    }

    // Tier 2: Jaccard ≥ 0.60 within same subject. O(n²) but bounded by subject pool.
    let tier2Pairs = 0;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (uf.find(i) === uf.find(j)) continue;
        const s = jaccard(items[i].tokens, items[j].tokens);
        if (s >= JACCARD_THRESHOLD) { uf.union(i, j); tier2Pairs++; }
      }
    }

    // Assign group UUIDs per union. Reuse pre-existing group if any member already had one.
    const rootToGroup = new Map<number, string>();
    for (let i = 0; i < items.length; i++) {
      const root = uf.find(i);
      if (items[i].existingGroup && !rootToGroup.has(root)) {
        rootToGroup.set(root, items[i].existingGroup);
      }
    }
    for (let i = 0; i < items.length; i++) {
      const root = uf.find(i);
      if (!rootToGroup.has(root)) rootToGroup.set(root, crypto.randomUUID());
    }

    // Bulk update in chunks.
    const nowIso = new Date().toISOString();
    const ciUpdates: { id: string; concept_group_id: string; concept_grouped_at: string }[] = [];
    const jtqUpdates: { id: string; concept_group_id: string; concept_grouped_at: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      const gid = rootToGroup.get(uf.find(i))!;
      if (items[i].existingGroup === gid) continue; // unchanged
      const rec = { id: items[i].id, concept_group_id: gid, concept_grouped_at: nowIso };
      if (items[i].src === "ci") ciUpdates.push(rec); else jtqUpdates.push(rec);
    }

    // Postgres has no cheap bulk update by id via supabase-js; do per-row updates in small batches.
    async function applyUpdates(table: "content_items" | "job_test_questions", rows: typeof ciUpdates) {
      const CHUNK = 50;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        await Promise.all(chunk.map((r) =>
          supabase.from(table).update({ concept_group_id: r.concept_group_id, concept_grouped_at: r.concept_grouped_at }).eq("id", r.id),
        ));
      }
    }
    await applyUpdates("content_items", ciUpdates);
    await applyUpdates("job_test_questions", jtqUpdates);

    const groupCount = new Set(rootToGroup.values()).size;

    console.log(`[group-concepts] ✅ subject="${subject}" items=${items.length} groups=${groupCount} tier1=${tier1Pairs} tier2=${tier2Pairs} ci_upd=${ciUpdates.length} jtq_upd=${jtqUpdates.length}`);

    return new Response(JSON.stringify({
      subject,
      items: items.length,
      groups: groupCount,
      tier1_pairs: tier1Pairs,
      tier2_pairs: tier2Pairs,
      ci_updated: ciUpdates.length,
      jtq_updated: jtqUpdates.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("[group-concepts] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
