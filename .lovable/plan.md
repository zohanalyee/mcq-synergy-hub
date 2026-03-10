## Complete Authentication System

### Current State

- **Existing**: `Auth.tsx` (combined sign-in/sign-up with Google OAuth), `SignIn.tsx`, `SignUp.tsx`, `AuthForm.tsx`, `AuthContext.tsx`, `authService.ts`, `Profile.tsx`
- **Missing**: Forgot password, reset password, change password, email verification page, profile completion after OAuth, password strength indicator

### Plan

#### 1. Create `src/pages/ForgotPassword.tsx`

- Email input form
- Calls `supabase.auth.resetPasswordForEmail()` with `redirectTo: window.location.origin + '/reset-password'`
- Shows success state after email sent with "check inbox" message
- Link back to `/auth`

#### 2. Create `src/pages/ResetPassword.tsx`

- Checks for valid recovery session on mount
- New password + confirm password inputs with password strength indicator
- Calls `supabase.auth.updateUser({ password })`
- Redirects to `/auth` on success

#### 3. Create `src/pages/VerifyEmailSent.tsx`

- Simple informational page shown after signup: "Check your email to verify"
- Resend verification button using `supabase.auth.resend({ type: 'signup' })`

#### 4. Create `src/components/PasswordStrengthIndicator.tsx`

- Reusable component: strength bar + text (Weak/Medium/Strong)
- Checks length, mixed case, digits, special chars

#### 5. Update `src/pages/Auth.tsx`

- Add password strength indicator to the Sign Up tab
- Add "Forgot password?" link below password field in Sign In tab
- Add full name field to Sign Up form (stored in `user_metadata`)
- Update `signUp` call to include `emailRedirectTo` and `data: { full_name }`
- Navigate to `/verify-email-sent` after successful signup

#### 6. Create `src/components/settings/ChangePasswordForm.tsx`

- Current password (informational, Supabase doesn't require it for `updateUser`)
- New password + confirm with strength indicator
- Calls `supabase.auth.updateUser({ password })`

#### 7. Update `src/pages/Profile.tsx`

- Add `ChangePasswordForm` component to the profile page

#### 8. Update `src/App.tsx` — Add new routes

- `/forgot-password` → `ForgotPassword`
- `/reset-password` → `ResetPassword`
- `/verify-email-sent` → `VerifyEmailSent`

### Files Created

- `src/pages/ForgotPassword.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/VerifyEmailSent.tsx`
- `src/components/PasswordStrengthIndicator.tsx`
- `src/components/settings/ChangePasswordForm.tsx`

### Files Modified

- `src/pages/Auth.tsx` (add forgot password link, name field, strength indicator, post-signup redirect)
- `src/pages/Profile.tsx` (add change password section)
- `src/App.tsx` (add 3 new routes)

No database changes needed — all flows use Supabase Auth APIs directly. 

Approved with additions!

Implement your plan plus:

1. Add src/pages/VerifyEmail.tsx

   - Verification landing page

   - Checks email_confirmed_at

   - Shows success/error

   - Auto-redirects to dashboard

2. Add src/pages/CompleteProfile.tsx

   - For Google OAuth users

   - Fields: Class, Institution, Phone

   - Updates user_metadata

   - Sets profile_completed: true

3. Add route /verify-email

4. Add route /complete-profile

5. In Auth.tsx signup:

   - Add T&C checkbox (required)

   - Link to /terms and /privacy

6. Update OAuth redirectTo:

   - Google: /complete-profile

   - After profile: /dashboard

Proceed with implementation!

&nbsp;