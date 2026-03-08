

## Global Appearance System (Admin + User Override)

### Concept
Create a **Supabase-backed global appearance settings** table. Admin can set the default appearance for the entire webapp. All users see the admin's settings by default. Any user can override with their own preferences (stored per-user). If a user resets, they fall back to the admin's global defaults.

### Database Changes

**New table: `global_appearance_settings`**
- `id` (uuid, PK)
- `key` (text, unique) — always `'default'` for the single global config
- `settings` (jsonb) — the full AppearanceSettings object
- `updated_by` (uuid, FK to auth.users)
- `updated_at` (timestamptz)

RLS: Anyone authenticated can read. Only admins can update (using `has_role` function).

**New table: `user_appearance_settings`**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, unique)
- `settings` (jsonb)
- `updated_at` (timestamptz)

RLS: Users can read/write only their own row.

### Code Changes

#### 1. `src/contexts/AppearanceContext.tsx`
- On mount: fetch `global_appearance_settings` (the admin default) and `user_appearance_settings` (for the current user)
- If user has saved settings → use those. Otherwise → use admin global defaults. Fallback → hardcoded defaults.
- Subscribe to `global_appearance_settings` changes via Supabase realtime so if admin updates, non-customized users see changes instantly.
- Add `saveToCloud()` — upserts the current user's settings to `user_appearance_settings`.
- Add `saveAsGlobal()` — admin-only, upserts to `global_appearance_settings`.
- Add `resetToGlobal()` — deletes user override, reverts to admin defaults.
- Auto-save to cloud on every change (debounced).

#### 2. `src/components/settings/AppearanceSettings.tsx`
- Add an **"Set as Global Default"** button (visible only to admins, using `useUserRole`)
- Change "Reset to Defaults" to "Reset to Global Defaults" — deletes user override and loads admin settings
- Add a small indicator showing whether user is using "Global" or "Custom" settings

#### 3. `src/components/settings/SettingsDialog.tsx`
- No structural changes, just the admin button flows through AppearanceSettings

### Flow

```text
Admin changes appearance → clicks "Set as Global Default"
  → saves to global_appearance_settings table
  → realtime broadcast updates all connected users without overrides

User changes appearance → auto-saved to user_appearance_settings
  → only affects that user
  → "Reset to Global" removes their override
```

### Files to Create/Edit
1. **Create** Supabase migration for both tables + RLS policies
2. **Edit** `src/contexts/AppearanceContext.tsx` — add Supabase sync, global/user logic, realtime subscription
3. **Edit** `src/components/settings/AppearanceSettings.tsx` — add admin "Set as Global" button, reset to global

