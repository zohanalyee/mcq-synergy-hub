

## Replace Dashboard with Analytics as "AI Personal Coach"

The user wants to remove the Dashboard page and replace it with the Analytics page, renaming it "AI Personal Coach". The sidebar screenshot shows "Dashboard" in the profile sheet menu, and the sidebar shows "Analytics" — both should point to the same AI coaching page.

### Changes

**1. `src/App.tsx`**
- Remove the Dashboard import and route (`/dashboard`)
- Change the `/analytics` route to use path `/dashboard` (keeping the same URL so existing links work), pointing to the `Analytics` component
- Remove old Dashboard import

**2. `src/pages/Analytics.tsx`**
- Rename the page title from "AI Coaching Dashboard" to "AI Personal Coach"
- Update heading text accordingly

**3. `src/components/MobileBottomNav.tsx`**
- Line 187: Change the profile sheet menu item from `{ path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }` to `{ path: '/analytics', icon: Brain, label: 'AI Personal Coach' }` with appropriate icon/colors

**4. `src/components/AppSidebar.tsx`**
- Update the icon mapping: rename `'Analytics'` key to `'AI Personal Coach'` (or add a new key) so the sidebar renders the correct icon when the nav item label is updated. Add `Brain` icon import.

**5. `src/pages/SignIn.tsx` & `src/pages/SignUp.tsx`**
- Change `Navigate to="/dashboard"` → `Navigate to="/analytics"`

**6. `src/services/authService.ts`**
- Change Google OAuth `redirectTo` from `/dashboard` to `/analytics`

**7. `src/pages/TestSession.tsx`**
- Update the "Dashboard" button to navigate to `/analytics` and label it "AI Coach"

**8. `src/pages/QuestionBank.tsx`**
- Update breadcrumb from Dashboard → AI Personal Coach with `/analytics` href

**9. Database: `navigation_items` table**
- The sidebar "Analytics" item label should be updated to "AI Personal Coach" via a Supabase query (or the admin can do it manually via NavigationManager). We'll update it via migration.

**10. Delete `src/pages/Dashboard.tsx`** — no longer needed since Analytics replaces it entirely.

### Summary
- `/dashboard` route removed, `/analytics` becomes the primary post-login destination
- All redirects point to `/analytics`
- Label everywhere changes to "AI Personal Coach"
- Dashboard page file deleted

