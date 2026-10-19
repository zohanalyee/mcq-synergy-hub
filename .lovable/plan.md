# Audit: public read access for the Join Alerts setting (report only)

## The exact rule that was added
Migration `supabase/migrations/20261019044532_c6106cba-3354-4250-b470-71c3cce48f6a.sql`:

```sql
GRANT SELECT ON public.system_settings TO anon, authenticated;
CREATE POLICY "Public can read Join Alerts channel URL"
ON public.system_settings FOR SELECT TO anon, authenticated
USING (key = 'whatsapp_channel_url');
```

Every rule on the settings table today (read from the live database). Row-level security is ON:

| Rule | Action | Who | Condition |
|---|---|---|---|
| Admins can view system settings | read | everyone | is_admin() |
| Public can read Join Alerts channel URL | read | anon, signed-in | key = 'whatsapp_channel_url' |
| Admins can insert system settings | add | everyone | is_admin() |
| Admins can update system settings | change | everyone | is_admin() |
| (none) | delete | — | no delete rule, so nobody can delete through the app API |

The table has 15 rows. `paid_ai_daily_ceiling` exists. `whatsapp_channel_url` does not exist yet.

## Live tests as a signed-out visitor (public key, live API)
| Test | Result | Verdict |
|---|---|---|
| (a) read `whatsapp_channel_url` | `[]`, because the row does not exist yet. The rule allows it. | Allowed by the rule. Can't be fully proven until you set the URL. |
| (b) `select=*` on the whole table | `[]` (0 of 15 rows) | Denied |
| (b) `select=*` for `paid_ai_daily_ceiling` | `[]` | Denied |
| (c) add a new row | error 42501 "new row violates row-level security policy" | Denied |
| (c) change `paid_ai_daily_ceiling` | 0 rows changed. Its `updated_at` is still 2026-09-10 08:36. | Denied |
| (c) delete `paid_ai_daily_ceiling` | 0 rows deleted. The row is still there. | Denied |

## Signed-in non-admin user
I could not run this live. This project uses your own Supabase, so I can't sign in a test user. Going by the rules above:
- Reading: a signed-in user gets only the rule that allows `whatsapp_channel_url`. The admin rules need is_admin(), which is false for them, so every other key stays hidden.
- Adding and changing: these need is_admin(), so they are denied.
- Deleting: there is no delete rule, so it is denied.

## Open items
1. After you set the URL in Admin, run test (a) again. It should return exactly 1 row.
2. Optional: test signed-in as a normal account. This needs a test account's login token from you or from the app's sign-in screen.

No changes were made.
