import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { requireAdminOrService } from '../_shared/adminGuard.ts'

// IndexNow instant push-indexing (Bing, Yandex, Seznam, Naver).
// POST { urls: string[] } — each must be an absolute https://mcqsai.com/... URL.
// The key file MUST be publicly reachable at https://mcqsai.com/<KEY>.txt and
// contain exactly the key string, otherwise IndexNow rejects the submission.

const HOST = 'mcqsai.com'
const BASE_URL = `https://${HOST}`
const INDEXNOW_KEY = '92c4599546070b0df41f558aeeb6c31e'
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_URLS = 10000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const unauthorized = await requireAdminOrService(req)
  if (unauthorized) return unauthorized

  try {
    const body = await req.json().catch(() => ({}))
    const rawUrls: unknown = body?.urls ?? (body?.url ? [body.url] : [])

    if (!Array.isArray(rawUrls) || rawUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Provide { urls: string[] } (or { url: string }).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Keep only same-host absolute https URLs; dedupe; cap at IndexNow limit.
    const urls = Array.from(
      new Set(
        rawUrls
          .filter((u): u is string => typeof u === 'string')
          .map((u) => u.trim())
          .filter((u) => {
            try {
              const parsed = new URL(u)
              return parsed.protocol === 'https:' && parsed.host === HOST
            } catch {
              return false
            }
          }),
      ),
    ).slice(0, MAX_URLS)

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ error: `No valid https://${HOST}/ URLs in request.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })

    // IndexNow returns 200/202 on success with an empty body.
    const text = await res.text()
    const ok = res.status === 200 || res.status === 202

    return new Response(
      JSON.stringify({ ok, submitted: urls.length, status: res.status, message: text || undefined }),
      {
        status: ok ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error)?.message ?? 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
