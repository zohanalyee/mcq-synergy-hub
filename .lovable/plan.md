
# UI/UX Improvements: Mobile Responsiveness and Input Visibility

## Problem
1. On mobile, elements are too large at 100% zoom -- users need to zoom to 90% for comfort
2. In the light/white theme, input fields (search boxes, text inputs) blend with the background due to low contrast borders

## Changes

### 1. Global Mobile Scaling (src/index.css)
Add a mobile media query that reduces the base font size to 14px on screens under 768px. This naturally scales all `rem`-based spacing, typography, and components down ~12%, achieving the "90% zoom" effect natively. Also tighten container padding on mobile.

### 2. Input Component (src/components/ui/input.tsx)
- Change `border` to `border-2` for a thicker, more visible border
- Add `shadow-sm` for subtle depth
- Add explicit light-theme border color: `border-gray-300 dark:border-gray-600`
- Add focus enhancement: `focus:border-primary`

### 3. Textarea Component (src/components/ui/textarea.tsx)
Apply the same border and shadow improvements as Input for consistency.

### 4. Select Trigger (src/components/ui/select.tsx)
Apply matching `border-2 shadow-sm border-gray-300 dark:border-gray-600` to the SelectTrigger so dropdowns match input visibility.

### 5. Light Theme Border Color (src/index.css)
Darken the `--border` and `--input` CSS variables in the light theme from `220 13% 91%` to `220 13% 82%` for better contrast across all bordered elements.

---

## Technical Details

### Files modified:
- `src/index.css` -- add mobile font scaling media query + darken light-theme border variables
- `src/components/ui/input.tsx` -- border-2, shadow-sm, explicit gray border colors
- `src/components/ui/textarea.tsx` -- same border improvements
- `src/components/ui/select.tsx` -- SelectTrigger border improvements

### CSS addition (index.css, after line 237):
```css
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
  .container {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}
```

### Light theme variable change (index.css):
```
--border: 220 13% 82%;  (was 91%)
--input: 220 13% 82%;   (was 91%)
```

### Input/Textarea/Select class changes:
Replace `border border-input` with `border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary`
