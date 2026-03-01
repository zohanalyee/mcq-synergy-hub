

# Fix: "Run Now" Button Not Working

## Root Cause
The `x-admin-trigger` custom header sent by the frontend is **not listed** in the CORS `Access-Control-Allow-Headers`. The browser's CORS preflight rejects it, causing "Failed to fetch".

The scheduled-autofill function's CORS headers allow: `authorization, x-client-info, apikey, content-type, ...` but NOT `x-admin-trigger`.

## Fix: `supabase/functions/scheduled-autofill/index.ts`

### Change 1: Add `x-admin-trigger` to CORS allowed headers
Add the custom header to the existing `corsHeaders` string (line 6).

### Change 2: Add proper admin verification for browser calls
Currently, any request with `x-admin-trigger: true` is allowed — no actual admin check. Add JWT-based admin verification when the call comes from the browser (not service role):

```text
if isAdminCall (has x-admin-trigger header):
  → extract JWT from Authorization header
  → verify user exists via supabase.auth.getUser()
  → check user_roles table for admin role
  → reject if not admin
```

### Change 3: Remove "already ran today" guard for manual runs
The current code skips if any `auto_fill` log exists today (lines 67-81). This blocks the "Run Now" button after the first run. Only apply this guard for scheduled (service-role) calls, not manual admin triggers.

## No frontend changes needed
The `AutoFillDashboard.tsx` already calls the function correctly.

## Files Changed

| Action | File |
|--------|------|
| Modify | `supabase/functions/scheduled-autofill/index.ts` |

## After deployment
Deploy and test the "Run Now" button from the admin panel.

