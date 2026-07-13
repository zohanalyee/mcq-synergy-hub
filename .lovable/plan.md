# Queue Cancel/Remove + Stuck-Row Cleanup

## Problem (confirmed)

Test `aeaaeaf0-...` par "2 in queue" isliye dikh raha hai kyunki do rows — **Chemistry** aur **Logical Reasoning** — `status='processing'` mein atki hain (cron ne claim kiya lekin result commit nahi hua). Cron sirf `pending` rows process karta hai, isliye naya deficit-guard inhein auto-clear nahi karega. Manual clear chahiye.

## What I'll build

### 1. Service function — `removeQueueItem` (`src/services/jobTestService.ts`)

- New export `removeQueueItem(id: string)` → `DELETE from job_test_generation_queue where id = <id>`.
- RLS already allows admin (`is_admin()` ALL policy), so delete works for admins.
- Returns `boolean` success.
- (Optional helper) `removeStuckQueueForTest(jobTestId)` to delete all active rows for a test — powers a "Clear all queued" action.

### 2. Analytics dashboard UI (`src/components/admin/job-test/MockTestAnalyticsDashboard.tsx`)

When a test row is expanded (jahan already per-subject deficits dikhte hain), ek naya **"In queue"** block add karunga jo active (`pending`/`processing`) rows list karega:

- Har row: subject naam + status chip (`pending` / `processing`; agar `processing` aur >10 min purani ho to **"stuck"** amber chip).
- Har row k saamne ek **Cancel/Remove** button (X icon), confirm ke baad `removeQueueItem` call karega, phir `load()` se counts + coverage refresh.
- Block ke top par **"Clear all queued"** button (jab 1+ active rows hon).
- Rows lazily fetch: expand par `getQueueForTest(jobTestId)` call, local state mein store, remove/refresh par re-fetch.
- Loading/empty states + `sonner` toast success/error (existing pattern ke mutabiq).

### 3. Immediate cleanup of the 2 stuck rows

Deploy ke baad aap dashboard se X button daba kar clear kar sakte hain. Chahein to main abhi in dono rows ko ek `DELETE` se turant clear kar dun (`id` = Chemistry `aa13f250-...`, Logical Reasoning `c397d428-...`) taake "2 in queue" foran 0 ho jaye — build mode mein confirm karke.

## Out of scope

- Cron frequency / generate-job-test logic unchanged.
- Approval flow untouched (100% manual rehta hai).
- Branding: existing tokens, Card/Badge/Button components, aur density (h-8, gap patterns) hi use honge — koi naya color/font nahi.

## Technical notes

- `getActiveQueueCounts` aur `getQueueForTest` already exist; sirf delete + UI add karna hai.
- Brand consistency: amber "stuck" chip usi `amber-500/*` token scheme ka use karega jo dashboard mein pehle se hai.

Plan approved. Please:

&nbsp;

1. Abhi turant un 2 stuck rows ko clear kar dein (Chemistry aa13f250... aur Logical Reasoning c397d428...) taake is test ka "2 in queue" foran 0 ho jaye.

&nbsp;

2. Phir UI build karein — removeQueueItem service, per-row Cancel/X button, "Clear all queued" button, aur "stuck" amber chip (>10 min processing wale items k liye).

&nbsp;

Build/typecheck clean hone k baad batayen, review kar k publish karunga.