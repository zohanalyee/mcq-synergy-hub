import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { requireAdminOrService } from '../_shared/adminGuard.ts'

// indexnow-submit-recent
// Collects URLs for content published/updated in the last N minutes across the
// 4 confirmed content types and pushes them to IndexNow in a single batch.
//   - Jobs & Scholarships (time-sensitive → highest priority)
//   - Mock Tests
//   - Blog Posts
//   - Board/Topic pages (>= 5 approved MCQs)
// Slug logic mirrors scripts/inject-meta.mjs / src/lib so URLs match live routes.
// Designed to be invoked by pg_cron every ~15 min, or manually with { minutes }.

const HOST = 'mcqsai.com'
const BASE_URL = `https://${HOST}`
const INDEXNOW_KEY = '92c4599546070b0df41f558aeeb6c31e'
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/indexnow'

// ---------- slug helpers (mirror inject-meta.mjs) ----------
function toSlug(name: string) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
function generateSlugUrl(title: string, id: string) {
  const slug = String(title || '')
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60).replace(/-+$/g, '')
  return slug ? `${slug}-${id}` : id
}
function orgSuffix(organization?: string) {
  if (!organization) return ''
  const paren = String(organization).match(/\(([^)]+)\)/)
  if (paren && paren[1]) return toSlug(paren[1])
  const acronym = (String(organization).match(/[A-Z]/g) || []).join('')
  if (acronym.length >= 2) return acronym.toLowerCase()
  return toSlug(organization).split('-').slice(0, 2).join('-')
}
// deno-lint-ignore no-explicit-any
function jobTestSlug(test: any, all: any[]) {
  const base = toSlug(test.title)
  const collisions = all.filter((t) => toSlug(t.title) === base)
  if (collisions.length <= 1) return base
  const suffix = orgSuffix(test.organization)
  const withOrg = suffix ? `${base}-${suffix}` : base
  const orgCollisions = collisions.filter((t) => `${base}-${orgSuffix(t.organization)}` === withOrg)
  if (orgCollisions.length <= 1) return withOrg
  const index = orgCollisions.findIndex((t) => t.id === test.id)
  return index <= 0 ? withOrg : `${withOrg}-${index + 1}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const unauthorized = await requireAdminOrService(req)
  if (unauthorized) return unauthorized



  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let minutes = 20
  try {
    const body = await req.json().catch(() => ({}))
    if (body?.minutes && Number.isFinite(+body.minutes)) minutes = Math.min(+body.minutes, 1440)
  } catch { /* default */ }
  const sinceISO = new Date(Date.now() - minutes * 60_000).toISOString()

  const urls = new Set<string>()
  const stats: Record<string, number> = {}

  // ---- Mock Tests (need full set for collision-aware slugs) ----
  try {
    const { data: allTests } = await supabase
      .from('job_tests')
      .select('id,title,organization,updated_at,created_at')
    const all = allTests || []
    const recent = all.filter((t) =>
      (t.updated_at && t.updated_at >= sinceISO) || (t.created_at && t.created_at >= sinceISO))
    for (const t of recent) urls.add(`${BASE_URL}/mock-tests/${jobTestSlug(t, all)}`)
    stats.mockTests = recent.length
  } catch (e) { stats.mockTests = -1; console.warn('mockTests', e) }

  // ---- Blog Posts ----
  try {
    const { data } = await supabase
      .from('blog_posts')
      .select('slug,updated_at,created_at')
      .eq('status', 'published')
      .or(`updated_at.gte.${sinceISO},created_at.gte.${sinceISO}`)
    for (const p of data || []) if (p.slug) urls.add(`${BASE_URL}/blog/${p.slug}`)
    stats.blog = (data || []).length
  } catch (e) { stats.blog = -1; console.warn('blog', e) }

  // ---- Jobs & Scholarships (content_items + external_opportunities) ----
  try {
    const [{ data: ci }, { data: eo }] = await Promise.all([
      supabase.from('content_items')
        .select('id,title,updated_at,created_at')
        .in('category', ['job', 'scholarship'])
        .eq('status', 'approved')
        .or(`updated_at.gte.${sinceISO},created_at.gte.${sinceISO}`),
      supabase.from('external_opportunities')
        .select('id,title,updated_at,created_at')
        .in('type', ['job', 'scholarship'])
        .eq('status', 'approved')
        .or(`updated_at.gte.${sinceISO},created_at.gte.${sinceISO}`),
    ])
    for (const r of [...(ci || []), ...(eo || [])]) urls.add(`${BASE_URL}/opportunity/${generateSlugUrl(r.title, r.id)}`)
    stats.opportunities = (ci || []).length + (eo || []).length
  } catch (e) { stats.opportunities = -1; console.warn('opportunities', e) }

  // ---- Board/Topic pages (>=5 approved MCQs, recently updated content) ----
  try {
    const { data } = await supabase.rpc('get_indexable_board_topic_paths', { p_min_approved_mcqs: 5 })
    const cutoff = sinceISO.slice(0, 10) // RPC lastmod is a date
    for (const r of data || []) {
      if (r.path && r.lastmod && String(r.lastmod) >= cutoff) urls.add(`${BASE_URL}${r.path}`)
    }
    stats.boardTopics = (data || []).filter((r: { lastmod?: string }) => r.lastmod && String(r.lastmod) >= cutoff).length
  } catch (e) { stats.boardTopics = -1; console.warn('boardTopics', e) }

  const urlList = Array.from(urls).slice(0, 10000)

  if (urlList.length === 0) {
    return new Response(JSON.stringify({ ok: true, submitted: 0, stats, sinceISO }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION, urlList }),
  })
  const text = await res.text()
  const ok = res.status === 200 || res.status === 202

  return new Response(
    JSON.stringify({ ok, submitted: urlList.length, status: res.status, stats, sinceISO, message: text || undefined }),
    { status: ok ? 200 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
