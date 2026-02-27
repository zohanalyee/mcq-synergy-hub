

# Plan: Operational Notification Bell System

## Phase 1: Database Migration

Create `user_notifications` table with columns: `id`, `user_id`, `type`, `title`, `message`, `icon`, `color`, `action_url`, `related_type`, `related_id`, `is_read`, `read_at`, `created_at`, `expires_at`. Add index on `(user_id, is_read, created_at DESC)`. RLS policies: users SELECT/UPDATE own rows, authenticated users can INSERT (for client-side notification creation).

## Phase 2: Notification Service

**New file: `src/services/notificationService.ts`**

- `NotificationType` enum: `test_completed`, `results_ready`, `badge_earned`, `streak_milestone`, `weakness_detected`, `practice_recommended`
- Template map with icon name, color, title, message builder, action_url builder
- `createNotification(userId, type, data)` function that inserts into `user_notifications` using templates
- Keep it simple -- no test_created/test_started (too noisy), focus on completion events

## Phase 3: Notification Components

**New file: `src/components/notifications/NotificationBell.tsx`**

- Replace the existing dummy bell button in HeaderActions (lines 96-108)
- `useQuery` to fetch latest 15 notifications ordered by `created_at DESC`
- Unread count badge (red dot with number)
- Dropdown with header ("Notifications" + "Mark all read" button)
- List of `NotificationItem` components
- Realtime subscription via `supabase.channel()` for INSERT events on `user_notifications` filtered by user_id
- `markAsRead(id)` and `markAllAsRead()` functions

**New file: `src/components/notifications/NotificationItem.tsx`**

- Icon from lucide-react mapped by notification.icon string
- Color-coded left border (green/blue/yellow/red)
- Title, message, relative timestamp via `date-fns` `formatDistanceToNow`
- Unread indicator (blue dot)
- Click handler: mark as read + navigate to action_url

## Phase 4: Integration Points

**Modified: `src/components/header/HeaderActions.tsx`**

- Replace the dummy Bell button (lines 96-108) with `<NotificationBell />` component
- Remove `hasNotifications` state and the toast-based click handler

**Modified: `src/utils/gamification.ts`**

In `processTestCompletion()`, after saving test attempt and checking badges:
- Create `test_completed` notification
- Create `results_ready` notification with score data
- For each new badge: create `badge_earned` notification
- In `generateWeaknessRecommendations()`: create `weakness_detected` notification when inserting a recommendation

## Phase 5: Route & Page

**New file: `src/pages/Notifications.tsx`**

- Full-page notification list with filters (All / Unread)
- Paginated fetch (load more button)
- Bulk "Mark all as read" action

**Modified: `src/App.tsx`**

- Add route: `/notifications` -> `Notifications` page

## Files Summary

| Action | File |
|--------|------|
| Create | DB migration (user_notifications table + index + RLS) |
| Create | `src/services/notificationService.ts` |
| Create | `src/components/notifications/NotificationBell.tsx` |
| Create | `src/components/notifications/NotificationItem.tsx` |
| Create | `src/pages/Notifications.tsx` |
| Modify | `src/components/header/HeaderActions.tsx` |
| Modify | `src/utils/gamification.ts` |
| Modify | `src/App.tsx` |

## Technical Details

- RLS INSERT policy uses `WITH CHECK (auth.uid() = user_id)` so users can only create notifications for themselves (client-side service calls run as the authenticated user)
- Realtime subscription auto-refreshes the notification list on new inserts
- Notifications auto-expire after 30 days via `expires_at` default
- Icon mapping uses a simple Record from string to lucide component, no dynamic imports needed
- No edge function needed -- notifications are created inline during existing client-side flows (processTestCompletion already runs client-side)

