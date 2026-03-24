

# Fix RTL Text Rendering for Urdu/Sindhi

## Problem
English words (MCQs, AI, MDCAT) embedded in RTL text cause overlapping, broken flow, and poor readability due to missing bidirectional text isolation.

## Solution

### 1. Create `RTLText` utility component
**New file: `src/components/RTLText.tsx`**

A reusable component that automatically detects English words in RTL text and wraps them with `<bdi>` (bidirectional isolate) elements. This is the browser-native solution for mixed-direction text -- no CSS hacks needed.

- Regex splits text on English/number sequences
- Wraps each English segment in `<bdi dir="ltr" style="unicode-bidi: isolate">`
- Supports rendering as any HTML element (h1, p, span, etc.)

### 2. Add `tr()` helper to LanguageContext
**File: `src/contexts/LanguageContext.tsx`**

Add a `tr(key)` method that works like `t(key)` but returns React nodes with English words properly isolated. Components can use `tr()` instead of `t()` for any text that may contain English words in RTL mode.

### 3. Update CSS for RTL typography
**File: `src/index.css`**

Enhance existing `.rtl-text` and `.font-nastaliq` classes:
- Add `unicode-bidi: plaintext` to `.rtl-text` for better bidi algorithm handling
- Increase line-height on `.font-nastaliq` from 2.2 to 2.4 for nuqta spacing
- Add `.bidi-isolate` utility class

### 4. Update Hero section
**File: `src/pages/Index.tsx`**

- Wrap the `titleSuffix` span (which contains "MCQs" in Sindhi/Urdu) with proper bidi isolation
- Use `tr()` for subtitle text
- Apply bidi isolation to the badge text

### 5. Update other RTL-affected components
- **`src/components/dashboard/DashboardHeader.tsx`** -- use RTLText for greeting
- **`src/components/Footer.tsx`** -- use `tr()` for footer text containing English terms
- **`src/components/exam/QuestionCard.tsx`** -- already has `rtl-text` class, add `unicode-bidi: plaintext`

### Technical Approach
Using the HTML `<bdi>` element is the W3C-recommended approach for bidirectional text isolation. It tells the browser's Unicode Bidirectional Algorithm to treat the enclosed text as an independent directional run, preventing English words from disrupting RTL flow. No `dir="rtl"` on `<html>` is needed -- the existing selective RTL approach is preserved.

