# Authentication Flow with Intent Preservation

## Current State

- Auth pages: `/auth` (Auth.tsx) and `/signin` (SignIn.tsx) — both are full-page forms with Google OAuth
- After sign-in, Auth.tsx navigates to `/`, SignIn.tsx stays on page (no redirect logic)
- Google OAuth redirects to `/complete-profile`
- `AuthRequiredWrapper` exists but only shows a static "sign in" alert — no intent saving
- No intent preservation system exists anywhere in the codebase
- No `ProtectedAction` component or feature access config

## Plan

### 1. Create `useAuthIntent` hook

**File: `src/hooks/useAuthIntent.ts**`

localStorage-based intent system:

- `saveIntent(action, path, params)` — saves with timestamp
- `getIntent()` — returns intent or null (expires after 30 min)
- `clearIntent()` — removes from storage
- `executeIntent(navigate)` — navigates to saved path or falls back to `/dashboard`

### 2. Create feature access config

**File: `src/config/features.ts**`

Define three tiers:

- `free`: calculators, converters, utilities (guest-allowed)
- `protected`: tests, analytics, AI coach, progress tracking
- `premium`: PDF export, bulk operations, advanced analytics

Export helpers: `requiresAuth(id)`, `allowsGuest(id)`

### 3. Create `ProtectedAction` component

**File: `src/components/auth/ProtectedAction.tsx**`

Wrapper that:

- If user is authenticated → executes action normally (navigate to path)
- If guest-allowed → shows `GuestChoiceModal`
- If auth required → saves intent + redirects to `/auth`

### 4. Create `GuestChoiceModal`

**File: `src/components/auth/GuestChoiceModal.tsx**`

Dialog with two options:

- "Continue as Guest" — proceeds without auth, shows limitations
- "Sign In (Recommended)" — saves intent, redirects to auth

### 5. Update Auth page to execute saved intent

**File: `src/pages/Auth.tsx**`

After successful sign-in (`handleSignIn`):

- Check for saved intent via `getIntent()`
- Navigate to intent path instead of `/`

After Google OAuth return (in `AuthContext.tsx` `onAuthStateChange` SIGNED_IN):

- Check for saved intent, navigate accordingly

### 6. Update `AuthContext.tsx`

In the `onAuthStateChange` handler for `SIGNED_IN`:

- Check `localStorage` for `redirect_after_auth`
- If found, set a flag so the next render cycle can navigate

### 7. Update `SignIn.tsx`

Same intent-execution logic after successful email sign-in.

### 8. Update `AuthRequiredWrapper`

Enhance to save intent before redirecting to auth, so the user returns to the same page after login.

---

## Files to create

1. `src/hooks/useAuthIntent.ts`
2. `src/config/features.ts`
3. `src/components/auth/ProtectedAction.tsx`
4. `src/components/auth/GuestChoiceModal.tsx`

## Files to modify

1. `src/pages/Auth.tsx` — add intent execution after sign-in
2. `src/pages/SignIn.tsx` — add intent execution after sign-in
3. `src/contexts/AuthContext.tsx` — check intent on SIGNED_IN event
4. `src/components/content/AuthRequiredWrapper.tsx` — save intent before redirect

## Authentication Flow with Intent Preservation

Implement your proposed plan with these additions:

### Additional Requirements:

1. **Toast Notifications:**

   - After auth with intent: "Welcome back! Continuing where you left off..."

   - Guest mode: "Guest Mode Active. Sign in to save progress"

   - Intent expired: "Session expired. Please start again"

2. **Loading States:**

   - Show "Redirecting to [action]..." after successful auth

   - Show spinner during navigation

3. **Enhanced Feature Config:**

```typescript

export const FEATURE_CONFIG = {

  'gpa-calculator': {

    id: 'gpa-calculator',

    name: 'GPA Calculator',

    tier: 'free',

    requiresAuth: false,

    guestAllowed: true,

  },

  'mcq-test': {

    id: 'mcq-test',

    name: 'MCQ Test',

    tier: 'protected',

    requiresAuth: true,

    guestAllowed: false,

    guestMessage: 'Sign in to save results and track progress',

  },

  'ai-coach': {

    id: 'ai-coach',

    name: 'AI Coach',

    tier: 'protected',

    requiresAuth: true,

    guestAllowed: false,

    guestMessage: 'Sign in to get personalized recommendations',

  },

};

```

4. **Debug Logging (dev only):**

   - Log intent save/restore/execute in development

   - Use `process.env.NODE_ENV === 'development'`

5. **Error Handling:**

   - Handle localStorage quota exceeded

   - Handle navigation errors

   - Fallback to dashboard if intent path is invalid

6. **GuestChoiceModal Polish:**

   - Show feature-specific message from FEATURE_CONFIG

   - Show comparison table: Guest vs Signed In

   - Make "Sign In" button primary (recommended)

7. **ProtectedAction Enhancements:**

   - Accept optional `onGuestAction` callback

   - Accept optional `guestMessage` override

   - Support both click and navigate actions

8. **Testing Helpers:**

   - Add `clearAllIntents()` function for testing

   - Add `getIntentDebugInfo()` for admin panel

### Implementation Priority:

**Phase 1 (Core - 3 hours):**

1. Create useAuthIntent hook

2. Create features.ts config

3. Update Auth.tsx for intent execution

4. Update AuthContext.tsx

**Phase 2 (Components - 2 hours):**

5. Create ProtectedAction component

6. Create GuestChoiceModal

7. Update AuthRequiredWrapper

**Phase 3 (Polish - 1 hour):**

8. Add toast notifications

9. Add loading states

10. Add debug logging

11. Error handling

**Phase 4 (Testing - 1 hour):**

12. Test auth required flows

13. Test guest allowed flows

14. Test intent expiration

15. Test error cases

Total: 7 hours

### Testing Checklist:

**Core Flows:**

- [ ] Click "Start Test" → redirected to /auth → sign in → auto-redirect to test

- [ ] Click "GPA Calculator" → guest choice modal → continue as guest → calculator opens

- [ ] Click "GPA Calculator" → guest choice modal → sign in → auth page → calculator opens

- [ ] Already signed in → click anything → works directly

**Edge Cases:**

- [ ] Intent expires after 30 min → shows expired toast

- [ ] localStorage full → shows error, continues without intent

- [ ] Invalid intent path → fallback to dashboard

- [ ] User closes guest modal → intent still saved

- [ ] Multiple intents saved → uses latest

**UI/UX:**

- [ ] Toast shows after auth with intent

- [ ] Loading indicator during redirect

- [ ] Guest modal shows feature-specific message

- [ ] Debug logs only in development

- [ ] Mobile responsive modals

Proceed with implementation!