import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAIWithAutoSwitch } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 100);
}

function extractJson(text: string): any {
  // Strip code fences
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  // Try to find first {...} block
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  throw new Error('AI returned invalid JSON');
}

const SYSTEM_PROMPT = `You are an expert SEO content writer for MCQSAI, a Pakistani educational platform (MCQs, board exams, MDCAT/ECAT, CSS, PPSC, FPSC, jobs, scholarships).

You MUST respond with a single JSON object — no preamble, no markdown fences — with this exact shape:
{
  "title": "string (max 70 chars, compelling, SEO-optimised)",
  "slug": "string (lowercase, hyphenated, max 80 chars)",
  "excerpt": "string (1-2 sentences, max 180 chars)",
  "content_markdown": "string (700-1400 words, well-structured markdown with ## and ### headings)",
  "category": "string (one of: jobs, scholarships, study-tips, entry-test, competitive, school, forces, general)",
  "tags": ["string", "..."] (5-8 SEO keywords),
  "meta_title": "string (max 60 chars)",
  "meta_description": "string (max 155 chars)"
}

Content rules:
- Pakistan context, simple clear English accessible to students.
- Use ## for main sections, ### for sub-sections.
- Include an engaging intro and conclusion with a soft CTA to practise on MCQSAI.
- Embed target keywords naturally; do NOT keyword-stuff.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub;

    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const mode = body.mode as 'from_content' | 'from_prompt';
    const targetLength = body.target_length ?? 1100;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let userPrompt = '';
    let sourceLabel = '';

    if (mode === 'from_content') {
      const sourceTable = body.source_table as 'external_opportunities' | 'content_items';
      const sourceId = body.source_id as string;
      const angle = (body.angle as string | undefined)?.trim();

      if (!sourceTable || !sourceId || !['external_opportunities', 'content_items'].includes(sourceTable)) {
        return new Response(JSON.stringify({ error: 'source_table and source_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: row, error: rowErr } = await adminClient
        .from(sourceTable)
        .select('*')
        .eq('id', sourceId)
        .maybeSingle();

      if (rowErr || !row) {
        return new Response(JSON.stringify({ error: 'Source record not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      sourceLabel = row.title || 'Opportunity';
      const ctx = JSON.stringify(row, null, 2).substring(0, 6000);

      userPrompt = `Rewrite and expand the following ${sourceTable === 'external_opportunities' ? 'opportunity' : 'content'} into a fully-formed SEO blog post targeting Pakistani students/job-seekers.

Source data:
\`\`\`json
${ctx}
\`\`\`

${angle ? `Angle / focus: ${angle}\n\n` : ''}Approximate length: ${targetLength} words.

Return the JSON object as specified in the system prompt. The "category" should be "jobs" or "scholarships" based on the source. Make the title compelling and search-friendly (include year if relevant, include organisation name).`;
    } else if (mode === 'from_prompt') {
      const presetTopic = (body.preset_topic as string | undefined)?.trim();
      const customInstructions = (body.custom_instructions as string | undefined)?.trim();

      if (!presetTopic && !customInstructions) {
        return new Response(JSON.stringify({ error: 'preset_topic or custom_instructions required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      sourceLabel = presetTopic?.substring(0, 80) || 'Custom prompt';
      userPrompt = `Write an original, Pakistan-context SEO blog post for MCQSAI based on this instruction:

${presetTopic || ''}

${customInstructions ? `Additional admin instructions: ${customInstructions}\n\n` : ''}Approximate length: ${targetLength} words.

Return the JSON object exactly as specified in the system prompt. Naturally embed relevant SEO keywords. Choose the most fitting "category" value.`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid mode. Use from_content or from_prompt.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[generate-blog] mode=${mode} source="${sourceLabel}"`);

    const result = await callAIWithAutoSwitch(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.75,
      maxOutputTokens: 4096,
    });

    let parsed: any;
    try {
      parsed = extractJson(result.text);
    } catch (e: any) {
      console.error('[generate-blog] JSON parse failed:', e.message);
      throw new Error('AI returned malformed output. Please retry.');
    }

    // Sanitise / fill defaults
    const title = String(parsed.title || sourceLabel).substring(0, 120);
    const slug = slugify(String(parsed.slug || title)) || `post-${Date.now()}`;
    const excerpt = String(parsed.excerpt || '').substring(0, 280);
    const content_markdown = String(parsed.content_markdown || '');
    const category = String(parsed.category || 'general').toLowerCase();
    const tags = Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t)).slice(0, 12) : [];
    const meta_title = String(parsed.meta_title || title).substring(0, 60);
    const meta_description = String(parsed.meta_description || excerpt).substring(0, 160);

    // Log AI usage
    await adminClient.from('ai_usage_logs').insert({
      source_type: mode === 'from_content' ? 'blog_from_content' : 'blog_from_prompt',
      ai_provider: result.provider,
      cost_estimate: result.cost,
      questions_requested: 1,
      questions_fetched: 1,
      questions_saved: 0,
      subject: category,
      topic: title.substring(0, 80),
      triggered_by_user_id: userId,
      metadata: {
        mode,
        source_table: body.source_table,
        source_id: body.source_id,
        preset_topic: body.preset_topic ? String(body.preset_topic).substring(0, 120) : undefined,
        word_count: content_markdown.split(/\s+/).length,
      },
    });

    console.log(`[generate-blog] ✅ Returned draft "${title}" (${result.provider})`);

    return new Response(JSON.stringify({
      success: true,
      provider: result.provider,
      draft: {
        title,
        slug,
        excerpt,
        content: content_markdown,
        category,
        tags,
        meta_title,
        meta_description,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[generate-blog] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
