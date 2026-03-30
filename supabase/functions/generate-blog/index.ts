import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAIWithAutoSwitch } from "../_shared/gemini.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    // Check admin
    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders });
    }

    const { title, topic, keywords = [], targetLength = 1300, taskId } = await req.json();

    if (!title || !topic) {
      return new Response(JSON.stringify({ error: 'title and topic are required' }), { status: 400, headers: corsHeaders });
    }

    const systemPrompt = `You are an expert SEO content writer for MCQSAI, a Pakistani educational platform focused on MCQs, board exams (Sindh, Punjab, KPK, Federal), and competitive tests (MDCAT, ECAT, CSS, PPSC, FPSC).

Write blog posts that are:
- Educational, accurate, and helpful for Pakistani students
- SEO-optimized with natural keyword placement
- Well-structured with H2 and H3 headings (use ## and ### markdown)
- Between ${targetLength - 200} and ${targetLength + 200} words
- Include a compelling introduction and conclusion
- Use simple, clear English accessible to Pakistani students

IMPORTANT: Output ONLY the blog post content in markdown format. No preamble or meta-commentary.`;

    const userPrompt = `Write a comprehensive blog post about: "${title}"

Topic area: ${topic}
${keywords.length > 0 ? `Target keywords to naturally include: ${keywords.join(', ')}` : ''}

Structure the post with:
1. An engaging introduction (2-3 paragraphs)
2. 3-5 main sections with H2 headings
3. Sub-sections with H3 where appropriate
4. Practical tips or actionable advice
5. A conclusion with a call-to-action

The post should be approximately ${targetLength} words.`;

    console.log(`[generate-blog] Generating blog: "${title}" for topic: ${topic}`);

    const result = await callAIWithAutoSwitch(systemPrompt, userPrompt, {
      temperature: 0.8,
      maxOutputTokens: 4096,
    });

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

    // Generate meta description
    const metaDesc = result.text.substring(0, 300).replace(/[#*\n]/g, ' ').trim().substring(0, 155);

    // Save to blog_posts with service role for insert
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: blogPost, error: insertError } = await adminClient
      .from('blog_posts')
      .insert({
        title,
        slug: `${slug}-${Date.now()}`,
        content: result.text,
        category: topic,
        tags: keywords,
        status: 'draft',
        meta_title: title.substring(0, 60),
        meta_description: metaDesc,
        author_name: 'MCQSAI Team',
        created_by: userId,
      })
      .select('id, slug')
      .single();

    if (insertError) {
      console.error('[generate-blog] Insert error:', insertError.message);
      throw new Error(`Failed to save blog post: ${insertError.message}`);
    }

    // Log AI usage
    await adminClient.from('ai_usage_logs').insert({
      source_type: 'blog_generation',
      ai_provider: result.provider,
      cost_estimate: result.cost,
      questions_requested: 1,
      questions_fetched: 1,
      questions_saved: 1,
      subject: topic,
      topic: title,
      triggered_by_user_id: userId,
      metadata: { blog_id: blogPost.id, keywords, word_count: result.text.split(/\s+/).length },
    });

    // Update agent task if taskId provided
    if (taskId) {
      await adminClient
        .from('agent_tasks')
        .update({
          status: 'review',
          output_data: { blog_id: blogPost.id, slug: blogPost.slug, word_count: result.text.split(/\s+/).length },
          completed_at: new Date().toISOString(),
          needs_review: true,
        })
        .eq('id', taskId);
    }

    console.log(`[generate-blog] ✅ Blog saved: ${blogPost.id} (${result.provider})`);

    return new Response(JSON.stringify({
      success: true,
      blog_id: blogPost.id,
      slug: blogPost.slug,
      provider: result.provider,
      word_count: result.text.split(/\s+/).length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[generate-blog] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
