

# Fix: Auto-Fill False "Daily Quota Exhausted"

## Root Cause
The `system_settings` row for key `ai_daily_limit` has `{"max_requests": 5, "max_questions": 500}`. The `get_ai_usage_today()` RPC reads `max_requests` and uses it as the daily limit. With 5 requests made today, the dashboard shows 5/5 = 100% exhausted.

The quota manager in edge functions uses a hardcoded `DAILY_QUOTA_LIMIT = 1400`, but the frontend/RPC uses this separate `system_settings` value of 5.

## Fix
**Single data update** -- change `max_requests` from 5 to 1400 to match the edge function quota manager:

```sql
UPDATE system_settings
SET value = '{"max_requests": 1400, "max_questions": 50000}'::jsonb,
    updated_at = now()
WHERE key = 'ai_daily_limit';
```

No code changes needed. The existing `get_ai_usage_today()` RPC and `AutoFillDashboard` component will immediately show the correct quota (e.g., 5/1400 = 0.4%).

## Result After Fix
- Daily AI Quota card: **5 / 1400** (0% used, 1395 remaining)
- "Daily Quota Exhausted" alert: disappears
- Auto-fill "Run Now" button: re-enabled
- Consistent with QuotaMonitor's display

