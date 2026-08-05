import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

/**
 * Shared authorization guard for internal / operational endpoints.
 *
 * Allows the request when EITHER:
 *  - it is a scheduled (pg_cron / server-to-server) call presenting the
 *    service-role key, OR
 *  - it presents a valid user JWT belonging to a user with the `admin` role.
 *
 * Returns `null` when authorized, or a ready-to-return 401/403 Response.
 */
export async function requireAdminOrService(req: Request): Promise<Response | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization')

  const deny = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return deny(401, 'Unauthorized: missing authorization token')
  }

  // Scheduled / server-to-server call
  if (authHeader.includes(serviceKey)) return null

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData?.user) {
    return deny(401, 'Unauthorized: invalid or expired token')
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: roleData } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!roleData) return deny(403, 'Admin privileges required')

  return null
}
