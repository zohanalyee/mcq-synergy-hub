

# Redesign Authentication Page to Premium SaaS UI

## Overview
Complete overhaul of `src/pages/Auth.tsx` into a premium split-screen authentication experience with polished micro-interactions, matching top-tier AI platform aesthetics.

## Layout Architecture

```text
┌──────────────────────────────────────────────────────────┐
│ Desktop (lg+): 50/50 Split Screen                        │
│ ┌─────────────────────┬──────────────────────────────┐   │
│ │  LEFT PANEL          │  RIGHT PANEL                 │   │
│ │  Deep blue/indigo    │  Clean white bg              │   │
│ │  bg with subtle      │                              │   │
│ │  pattern overlay     │  [Logo Icon]                 │   │
│ │                      │  Welcome to AI-MCQs Point    │   │
│ │  Welcome message     │                              │   │
│ │  + brand imagery     │  [Continue with Google]      │   │
│ │  + feature bullets   │  ──── OR ────                │   │
│ │                      │  [Sign In | Sign Up] toggle  │   │
│ │                      │  [Form Fields w/ icons]      │   │
│ │                      │  [Submit Button]             │   │
│ │                      │  [Forgot password / Terms]   │   │
│ │                      │  [← Back to Home]            │   │
│ └─────────────────────┴──────────────────────────────┘   │
│                                                          │
│ Mobile/Tablet: Centered card on gradient bg              │
│ (Left panel hidden, form card only)                      │
└──────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. File: `src/pages/Auth.tsx` (full rewrite)

**Layout:**
- Outer: `min-h-screen flex` with `lg:grid lg:grid-cols-2`
- Left panel (hidden on mobile): Deep blue-to-indigo gradient (`bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800`) with subtle dot/grid pattern overlay, welcome text, brand icon, and 3-4 feature bullet points with icons
- Right panel: White/light background (`bg-slate-50`), vertically centered form container (`max-w-[420px]`)
- Mobile: Full-screen centered card on `bg-gradient-to-b from-slate-50 to-blue-50`

**Header:**
- BrainCircuit icon inside a circular blue container (`w-12 h-12 bg-blue-600 rounded-xl`)
- Bold h1: "Welcome to AI-MCQs Point"
- Subtitle: "Sign in to continue your learning journey"

**Google Button:**
- White bg, subtle border, official Google 'G' SVG icon (already exists)
- `hover:shadow-md hover:bg-slate-50 transition-all`

**Divider:**
- Horizontal line with centered "OR" text (`text-xs text-muted-foreground uppercase`)

**Segmented Tab Toggle (replaces Radix Tabs):**
- Custom pill-shaped container (`bg-slate-100 rounded-full p-1`)
- Two buttons; active state slides a `bg-white shadow-sm rounded-full` indicator behind the active tab using `framer-motion layoutId`
- State: `activeTab: 'signin' | 'signup'`

**Input Fields:**
- Left icons (User, Mail, Lock) that turn `text-blue-500` on focus via `group/peer` CSS
- Eye/EyeOff toggle on all password fields (sign-in password too, not just sign-up)
- Focus ring: `focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`
- Clean rounded-lg styling with `h-11`

**Submit Button:**
- `bg-gradient-to-r from-blue-600 to-indigo-600 text-white`
- `hover:shadow-lg hover:scale-[1.01] transition-all duration-200`
- Full width, `h-11`, rounded-lg

**Footer:**
- "Forgot password?" right-aligned above Sign In button
- Terms checkbox on Sign Up form
- "← Back to Home" link at bottom

### 2. Left Panel Content
- Large BrainCircuit or BookOpen icon with glow effect
- "Join AI-MCQs Point" heading
- "Your gateway to academic excellence" subtitle
- 3 feature bullets with check icons (AI-powered tests, Detailed analytics, Personalized learning)
- Subtle animated floating circles/dots as background decoration

### 3. Animations (framer-motion)
- Left panel elements stagger in on load
- Form fades in with slight y-offset
- Tab switch: `layoutId` animated pill indicator
- Form content: `AnimatePresence` with fade transition between sign-in/sign-up

### 4. Preserved Logic
- All existing auth handlers (`handleSignIn`, `handleSignUp`, `handleGoogleLogin`) unchanged
- Password strength indicator on sign-up
- Terms checkbox validation
- All toast notifications
- All redirects (verify-email-sent, complete-profile, etc.)

### Files Changed
- `src/pages/Auth.tsx` — Full rewrite with new layout and styling

No new dependencies needed. All icons from lucide-react, animations from framer-motion (already installed).

