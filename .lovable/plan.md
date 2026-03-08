

## Rebrand to "AI-MCQs Point" with Animated Logo & SEO

### Files to Edit

**1. `src/components/header/HeaderLogo.tsx`** — Main navbar logo
- Replace `BookOpen` with `BrainCircuit` + `Sparkles` icon combo
- Add `animate-pulse` and glow `drop-shadow` on icon container
- Split text: "AI-" with gradient (`from-blue-500 to-indigo-600`, `bg-clip-text text-transparent font-extrabold`) + "MCQs Point" in `font-bold tracking-tight text-foreground`
- Add `hover:scale-105 transition-transform duration-300` on wrapper

**2. `src/components/AppSidebar.tsx`** — Sidebar logo (line ~114)
- Same icon + text treatment as HeaderLogo
- Update footer copyright (line ~237): "© 2025 AI-MCQs Point"

**3. `src/components/header/MobileMenu.tsx`** — Mobile menu logo (line ~62)
- Same icon + text treatment

**4. `index.html`** — SEO meta tags
- Title: `AI-MCQs Point - Smart Test Preparation & Syllabus Builder`
- Description: `Prepare smarter with AI-MCQs Point. Generate custom tests from Sindh Text Book Board and competitive exams instantly using AI-powered RAG technology.`
- Add keywords meta: `MCQs, Pakistan, STBB, AI Test Prep, Competitive Exams, Quiz Builder`
- Update OG title/description to match
- Update author to "AI-MCQs Point"

**5. Bulk text replacement** across these files (all "MCQs Point" → "AI-MCQs Point"):
- `src/pages/Auth.tsx` (line 116)
- `src/pages/GetStarted.tsx` (line 35)
- `src/pages/Feedback.tsx` (line 19)
- `src/components/FloatingFeedbackButton.tsx` (line 43)
- `src/pages/Index.tsx` (lines 157, 169, 425, 441, 473)

### Logo Visual Spec

```text
┌──────────────────────────────────────┐
│ [🧠✨ glow+pulse]  AI- MCQs Point   │
│  BrainCircuit       gradient  solid  │
│  + Sparkles         blue→indigo      │
│                     extrabold  bold   │
└──────────────────────────────────────┘
hover → scale 1.05
```

