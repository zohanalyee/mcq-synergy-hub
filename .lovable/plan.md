

# Pakistani Branding + Language Selector + AI Welcome

## Summary
Add subtle Pakistani branding, a 3-language selector (English/Urdu/Sindhi), and an AI-powered personalized welcome popup. The hero section remains untouched.

## Changes

### 1. Language Context (`src/contexts/LanguageContext.tsx`) -- NEW
- React context storing selected language (`en`, `ur`, `sd`) in localStorage
- Provides `language` and `setLanguage` to the app
- Wrap app in `LanguageProvider` in `App.tsx`

### 2. Language Selector in Header (`src/components/header/HeaderActions.tsx`)
- Add a `Globe` dropdown before the tools menu using `Select` component
- Shows flag emoji + language name for English, Urdu, Sindhi
- Uses `useLanguage()` context to persist selection
- Compact icon-only trigger on mobile

### 3. AI Welcome Component (`src/components/AIWelcome.tsx`) -- NEW
- Floating card (top-right, z-50) shown once per session for logged-in users
- Time-based bilingual greeting (English + Urdu)
- User's first name from profile/metadata
- Quick action buttons: "Start Test" and "View Progress"
- Gradient border, AI sparkle avatar, close button
- Uses `sessionStorage` to prevent repeat shows

### 4. Footer Pakistani Branding (`src/components/Footer.tsx`)
- Add Pakistan flag emoji and "Made in Pakistan" tagline below the existing description
- Subtle green accent color for the tagline

### 5. About Page -- Proudly Pakistani Section (`src/pages/About.tsx`)
- Add a new section after "Our Team" with a green-tinted card
- Three columns: "For Pakistani Students", "By Pakistani Educators", "In Pakistani Languages"

### 6. Page Loader Branding (`src/components/PageLoader.tsx`)
- Add "AI-MCQs Point" text and a small "Pakistan's AI-Powered Platform" subtitle below the spinner

### 7. Hero Section Badge (`src/pages/Index.tsx`)
- Add a small floating "Made in Pakistan 🇵🇰" badge in the hero area (desktop only, absolute positioned top-right)
- Does NOT modify existing hero content

### 8. Integration (`src/App.tsx`)
- Wrap with `LanguageProvider`
- Add `<AIWelcome />` at the app root level (inside auth/router providers)

## Files
| File | Action |
|------|--------|
| `src/contexts/LanguageContext.tsx` | Create |
| `src/components/AIWelcome.tsx` | Create |
| `src/components/header/HeaderActions.tsx` | Edit -- add language selector |
| `src/components/Footer.tsx` | Edit -- add Pakistan tagline |
| `src/pages/About.tsx` | Edit -- add Proudly Pakistani section |
| `src/components/PageLoader.tsx` | Edit -- add branded text |
| `src/pages/Index.tsx` | Edit -- add floating badge |
| `src/App.tsx` | Edit -- wrap LanguageProvider, add AIWelcome |

