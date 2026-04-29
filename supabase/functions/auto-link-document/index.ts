import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { document_id, metadata } = await req.json();

    if (!document_id || !metadata) {
      throw new Error('document_id and metadata are required');
    }

    // Authorization: only the document owner OR an admin may reclassify a document
    const { data: docRow, error: docFetchError } = await supabase
      .from('documents')
      .select('user_id')
      .eq('id', document_id)
      .maybeSingle();

    if (docFetchError || !docRow) {
      return new Response(
        JSON.stringify({ success: false, error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: adminRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    const isAdmin = !!adminRow;

    if (docRow.user_id !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: you do not own this document' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const confidence = metadata.confidence || 0.5;
    const createdEntities: string[] = [];

    // Helper: find or create educational system
    async function findOrCreateSystem(name: string): Promise<{ id: string; created: boolean }> {
      const { data: existing } = await supabase
        .from('educational_systems')
        .select('id')
        .ilike('name', name)
        .maybeSingle();

      if (existing) return { id: existing.id, created: false };

      const { data: created, error } = await supabase
        .from('educational_systems')
        .insert({
          name,
          type: 'academic',
          description: `AI-detected: ${name}`,
          is_active: true,
          auto_created: true,
          approved: false,
          created_by_ai: true
        })
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create system "${name}": ${error.message}`);

      await supabase.from('lms_approvals').insert({
        entity_type: 'system',
        entity_id: created.id,
        entity_name: name,
        ai_metadata: { confidence, reasoning: metadata.reasoning },
        status: 'pending'
      });

      createdEntities.push(`system:${name}`);
      return { id: created.id, created: true };
    }

    // Helper: find or create level
    async function findOrCreateLevel(name: string, systemId: string): Promise<{ id: string; created: boolean }> {
      const { data: existing } = await supabase
        .from('levels')
        .select('id')
        .ilike('name', name)
        .eq('system_id', systemId)
        .maybeSingle();

      if (existing) return { id: existing.id, created: false };

      const { data: created, error } = await supabase
        .from('levels')
        .insert({
          name,
          system_id: systemId,
          order_index: 0,
          auto_created: true,
          approved: false,
          created_by_ai: true
        })
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create level "${name}": ${error.message}`);

      await supabase.from('lms_approvals').insert({
        entity_type: 'level',
        entity_id: created.id,
        entity_name: name,
        ai_metadata: { system: metadata.system, confidence, reasoning: metadata.reasoning },
        status: 'pending'
      });

      createdEntities.push(`level:${name}`);
      return { id: created.id, created: true };
    }

    // Helper: find or create subject
    async function findOrCreateSubject(name: string, levelId: string): Promise<{ id: string; created: boolean }> {
      const { data: existing } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', name)
        .eq('level_id', levelId)
        .maybeSingle();

      if (existing) return { id: existing.id, created: false };

      const { data: created, error } = await supabase
        .from('subjects')
        .insert({
          name,
          description: `AI-detected subject: ${name}`,
          level_id: levelId,
          auto_created: true,
          approved: false,
          created_by_ai: true
        })
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create subject "${name}": ${error.message}`);

      await supabase.from('lms_approvals').insert({
        entity_type: 'subject',
        entity_id: created.id,
        entity_name: name,
        ai_metadata: { system: metadata.system, level: metadata.level, confidence, reasoning: metadata.reasoning },
        status: 'pending'
      });

      createdEntities.push(`subject:${name}`);
      return { id: created.id, created: true };
    }

    // Helper: find or create topic
    async function findOrCreateTopic(name: string, subjectId: string): Promise<{ id: string; created: boolean }> {
      const { data: existing } = await supabase
        .from('topics')
        .select('id')
        .ilike('name', name)
        .eq('subject_id', subjectId)
        .maybeSingle();

      if (existing) return { id: existing.id, created: false };

      const { data: created, error } = await supabase
        .from('topics')
        .insert({
          name,
          description: `AI-detected topic: ${name}`,
          subject_id: subjectId,
          auto_created: true,
          approved: false,
          created_by_ai: true,
          ai_suggested_name: name,
          ai_confidence: confidence
        })
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create topic "${name}": ${error.message}`);

      await supabase.from('lms_approvals').insert({
        entity_type: 'topic',
        entity_id: created.id,
        entity_name: name,
        ai_metadata: metadata,
        status: 'pending'
      });

      createdEntities.push(`topic:${name}`);
      return { id: created.id, created: true };
    }

    // Build hierarchy
    const system = await findOrCreateSystem(metadata.system);
    const level = await findOrCreateLevel(metadata.level, system.id);
    const subject = await findOrCreateSubject(metadata.subject, level.id);
    const topic = await findOrCreateTopic(metadata.topic, subject.id);

    // Link document to resolved hierarchy
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        system_id: system.id,
        level_id: level.id,
        subject_id: subject.id,
        topic_id: topic.id,
      })
      .eq('id', document_id);

    if (updateError) {
      console.error('Failed to link document:', updateError);
      throw new Error(`Failed to link document: ${updateError.message}`);
    }

    const requiresApproval = createdEntities.length > 0;

    console.log('Auto-link result:', {
      document_id,
      system: { id: system.id, created: system.created },
      level: { id: level.id, created: level.created },
      subject: { id: subject.id, created: subject.created },
      topic: { id: topic.id, created: topic.created },
      createdEntities,
      requiresApproval
    });

    return new Response(
      JSON.stringify({
        success: true,
        system_id: system.id,
        level_id: level.id,
        subject_id: subject.id,
        topic_id: topic.id,
        requires_approval: requiresApproval,
        created_entities: createdEntities
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('auto-link-document error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
