
# Plan: Premium Glassmorphism SubjectCard Redesign

## Overview
Complete redesign of the SubjectCard component to match a premium "Glassmorphism" aesthetic with highly rounded corners, subtle gradients, floating icon containers, and an action-oriented bottom section.

---

## Visual Design Specifications

### Card Container
| Property | Value |
|----------|-------|
| Border Radius | `rounded-3xl` (24px) |
| Background | Gradient from pastel theme color (10% opacity) → white |
| Border | `border border-white/50` for glass effect |
| Shadow | `shadow-sm` default → `shadow-xl` on hover |
| Hover Transform | `-translate-y-1` (lift effect) |
| Min Height | `180px` to ensure consistent sizing |

### Icon Container (Squircle)
| Property | Value |
|----------|-------|
| Shape | `rounded-2xl` (NOT circular) |
| Background | Solid theme color |
| Icon | White Lucide icon |
| Shadow | `shadow-md` (floating effect) |
| Size | `48px × 48px` |

### Typography
| Element | Style |
|---------|-------|
| Title | `text-base font-bold text-slate-800 dark:text-slate-100` |
| Subtitle | `text-sm text-slate-500` showing "X Chapters Available" |

### Action Area (Bottom)
| Element | Style |
|---------|-------|
| Left Text | `text-xs font-bold uppercase tracking-wide` in theme color, "START MODULE" |
| Right Button | `rounded-full` circle with theme bg + white `ArrowRight` icon |

---

## Dynamic Color Theme Mapping

```text
┌─────────────────────┬─────────────────────┬──────────────┐
│ Subject Contains    │ Theme Color         │ Tailwind     │
├─────────────────────┼─────────────────────┼──────────────┤
│ Sindhi, Urdu        │ Orange/Amber        │ #f59e0b      │
│ Biology, Science    │ Teal/Emerald        │ #14b8a6      │
│ English             │ Blue/Sky            │ #0ea5e9      │
│ Math, Statistics    │ Violet/Indigo       │ #8b5cf6      │
│ Physics             │ Purple              │ #a855f7      │
│ Chemistry           │ Rose/Red            │ #f43f5e      │
│ Computer, CS        │ Emerald             │ #10b981      │
│ Economics           │ Blue                │ #3b82f6      │
│ Default             │ Primary (Blue)      │ #3b82f6      │
└─────────────────────┴─────────────────────┴──────────────┘
```

---

## Files to Modify

### 1. `src/components/SubjectCard.tsx` (Complete Rewrite)

**Changes:**
- Replace entire card structure with new Glassmorphism design
- Add `getSubjectTheme()` helper function for dynamic color mapping
- Use `ArrowRight` icon from lucide-react for action button
- Change icon container from circular to squircle (`rounded-2xl`)
- Add gradient background using inline styles
- Change "Topics" → "Chapters Available"
- Add "START MODULE" action text with arrow button

**New Structure:**
```tsx
<motion.div whileHover={{ y: -4 }} className="cursor-pointer">
  <div className="rounded-3xl p-5 border border-white/50 shadow-sm 
                  hover:shadow-xl transition-all duration-300"
       style={{ background: `linear-gradient(135deg, ${pastelColor} 0%, white 100%)` }}>
    
    {/* Icon Squircle - Top Left */}
    <div className="w-12 h-12 rounded-2xl shadow-md flex items-center justify-center mb-4"
         style={{ backgroundColor: themeColor }}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    
    {/* Content */}
    <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 mb-4">{topicCount} Chapters Available</p>
    
    {/* Action Row */}
    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: themeColor }}>
        Start Module
      </span>
      <div className="w-8 h-8 rounded-full flex items-center justify-center"
           style={{ backgroundColor: themeColor }}>
        <ArrowRight className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
</motion.div>
```

### 2. `src/components/subjects/SubjectGrid.tsx` (Minor Update)

**Changes:**
- Adjust grid gap from `gap-3` to `gap-4` for better spacing with larger rounded cards
- Ensure responsive grid works well with new card proportions

---

## Color Theme Helper Function

```typescript
const getSubjectTheme = (title: string): { main: string; pastel: string } => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('sindhi') || lowerTitle.includes('urdu')) {
    return { main: '#f59e0b', pastel: 'rgba(245, 158, 11, 0.08)' };
  }
  if (lowerTitle.includes('biology') || lowerTitle.includes('science')) {
    return { main: '#14b8a6', pastel: 'rgba(20, 184, 166, 0.08)' };
  }
  if (lowerTitle.includes('english')) {
    return { main: '#0ea5e9', pastel: 'rgba(14, 165, 233, 0.08)' };
  }
  if (lowerTitle.includes('math') || lowerTitle.includes('statistics')) {
    return { main: '#8b5cf6', pastel: 'rgba(139, 92, 246, 0.08)' };
  }
  if (lowerTitle.includes('physics')) {
    return { main: '#a855f7', pastel: 'rgba(168, 85, 247, 0.08)' };
  }
  if (lowerTitle.includes('chemistry')) {
    return { main: '#f43f5e', pastel: 'rgba(244, 63, 94, 0.08)' };
  }
  if (lowerTitle.includes('computer') || lowerTitle.includes('cs')) {
    return { main: '#10b981', pastel: 'rgba(16, 185, 129, 0.08)' };
  }
  if (lowerTitle.includes('economics')) {
    return { main: '#3b82f6', pastel: 'rgba(59, 130, 246, 0.08)' };
  }
  
  // Default: use the color prop passed to the component
  return { main: '#3b82f6', pastel: 'rgba(59, 130, 246, 0.08)' };
};
```

---

## Icon Rendering Enhancement

The component will intelligently render icons:
1. If a valid React icon element is passed → render with white color
2. If no icon → use `BookOpen` as default fallback
3. All icons sized at `w-6 h-6` with `text-white`

---

## Dark Mode Considerations

The design will adapt for dark mode:
- Card background gradient: From pastel theme (8% opacity) → `slate-900`
- Title text: `text-slate-100` in dark mode
- Subtitle text: `text-slate-400` in dark mode
- Border: `border-white/20` in dark mode for subtler effect
- Action area border: `border-slate-700` in dark mode

---

## Animation & Interaction

| Interaction | Effect |
|-------------|--------|
| Hover | Card lifts up (`-translate-y-1`), shadow grows (`shadow-xl`) |
| Icon Container | Subtle scale on hover (`group-hover:scale-105`) |
| Arrow Button | Rotate slightly on hover (`group-hover:rotate-[-45deg]`) |
| Entry Animation | Fade in + slide up with stagger (existing Framer Motion) |

---

## Preserved Functionality

All existing navigation and state-passing logic will be preserved:
- Click navigates to `/subject-content/{id}` with full state payload
- Props for LMS metadata (`levelId`, `levelName`, `systemId`, `systemName`)
- Support for `onClick` override prop
- Purpose-based mode selection (reading vs mcqs)

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/SubjectCard.tsx` | **Rewrite** | Complete redesign with Glassmorphism style |
| `src/components/subjects/SubjectGrid.tsx` | **Update** | Adjust spacing for new card design |

---

## Expected Visual Result

The new cards will have:
- Soft, premium appearance with subtle gradients
- Floating icon containers that pop visually
- Clear call-to-action with "START MODULE" text
- Smooth hover animations creating a floating effect
- Vibrant, subject-specific color theming
- Consistent sizing and spacing across the grid
