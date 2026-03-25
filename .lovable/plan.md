

# Fix 401 Unauthorized on `generate-test` Edge Function

## Problem
The `generate-test` edge function returns **401 Unauthorized** on every call. No function logs exist, meaning the request is rejected at the Supabase gateway level before the function code executes.

The `supabase/config.toml` has `verify_jwt = false` for this function, but the deployed function likely has a stale configuration where JWT verification is still enabled at the gateway level. The function itself also has in-code JWT validation (lines 676-714) which handles auth properly -- the issue is the gateway rejecting requests before they reach the function.

## Root Cause
The `config.toml` with `verify_jwt = false` needs to be re-deployed to take effect. The function must be redeployed so the gateway picks up the updated config.

## Plan

### Step 1: Redeploy the edge function
Use `supabase--deploy_edge_functions` to redeploy `generate-test`. This will sync the `verify_jwt = false` config to the gateway, allowing requests through to the function code (which handles its own auth).

### Step 2: Test the function
Use `supabase--curl_edge_functions` to verify the function responds (not 401) after redeployment.

### Step 3: Fix minor browser issues (optional)
- The **CORB warning** on `js?id=G-G8VCGQ5CYL` is a known Chrome behavior with GA4 and is harmless -- no action needed.
- The **form field missing id/name** warning can be addressed by adding `id` attributes to Select components if desired.

## Files Modified
- No code changes needed -- only a redeployment of the existing edge function.

