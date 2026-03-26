

# Programmatic SEO for Tools

## Overview
Enhance tool pages with proper SEO metadata, "How to Use" guides, and update the sitemap to include all 53+ tool URLs. The existing architecture already has individual routes per tool -- the work is adding SEO content and sitemap entries.

---

## 1. Add SEO Content Data to toolsData.ts

Extend `ToolDefinition` with two new optional fields:
- `howToUse: string[]` -- array of step strings for each tool
- `seoDescription: string` -- unique long-form meta description

Add these for all 53 tools in `ALL_TOOLS`. Example:
```typescript
{ id: 'age-calculator', ..., 
  seoDescription: 'Calculate your exact age in years, months, and days from your date of birth. Free online age calculator with precise results.',
  howToUse: ['Enter your date of birth', 'Click Calculate', 'View your exact age breakdown'] }
```

## 2. Enhance ToolWrapper with SEO + "How to Use"

**File**: `src/components/tools/ToolWrapper.tsx`

- Import `SEOHead` and `Helmet`
- Add `seoDescription?: string` and `howToUse?: string[]` to props
- Inject `<SEOHead>` with title formula: `{title} - Free Online Tool | MCQsAI`
- Add JSON-LD `WebApplication` schema for rich results
- Render a "How to Use" section (numbered list) below the tool card, above the MCQ CTA
- Already has Related Tools sidebar -- no change needed there

## 3. Update Individual Tool Pages

Each tool page that uses `ToolWrapper` will pass the new `howToUse` and `seoDescription` props. For tools that don't use ToolWrapper (like `CalendarTool`), wrap them or add SEOHead directly.

Since there are 53 tools and modifying each individually is expensive, we'll:
- Store `howToUse` and `seoDescription` in `toolsData.ts` centrally
- Have `ToolWrapper` look up the data by `toolId` from `ALL_TOOLS` automatically (no need to pass props from each page)

## 4. Update Sitemap Edge Function

**File**: `supabase/functions/generate-sitemap/index.ts`

Add a `type=tools` handler that generates URLs for all tool paths. Since tool definitions are static, hardcode the tool slugs (extracted from href) directly in the edge function:

```typescript
if (type === "tools") {
  return new Response(generateToolsSitemap(), { headers: corsHeaders });
}
```

Add `generateToolsSitemap()` function with all 53 tool hrefs at priority 0.6, changefreq monthly.

Add a `<sitemap>` entry for `?type=tools` in the index.

## 5. Internal Linking (Already Done)

The `/tools` page already links to individual tool pages via `tool.href`. No changes needed.

---

## Files Modified

| Action | File |
|--------|------|
| Modify | `src/data/toolsData.ts` -- add `howToUse` + `seoDescription` to interface and all 53 tools |
| Modify | `src/components/tools/ToolWrapper.tsx` -- add SEOHead, JSON-LD schema, "How to Use" section; auto-lookup data by toolId |
| Modify | `supabase/functions/generate-sitemap/index.ts` -- add tools sitemap type with all 53 URLs |

No new routes needed -- all tools already have individual routes in App.tsx.

