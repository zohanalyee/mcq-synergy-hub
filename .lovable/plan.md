## Performance Optimization Plan

Goal: reduce initial JS payload on `/`, eliminate the WebSocket noise, and improve FCP/LCP without touching any visual UI, animation, or color.

### Diagnosis (from Lighthouse + repo audit)

1. `pdf-DUAaMo8u.js` (617 KB) and `charts-YyLb9fyN.js` (152 KB) are reaching the landing page even though their pages (Analytics, PDFSplitter, AttendanceAnalytics, EnhancedCSVUploader, QuestionBank export) are lazy routes. Cause: those pages use **static** `import jsPDF from 'jspdf'` / `import { PDFDocument } from 'pdf-lib'` / `import * as recharts` / `import ExcelJS from 'exceljs'`. Vite's manualChunks groups them into shared `pdf` / `charts` chunks, and rollup adds them to the route's preload graph — so they download via `<link rel="modulepreload">` even when the user is on `/`.
2. `AppearanceContext` opens a Supabase **realtime channel** unconditionally on every page (including `/` for logged-out visitors). This is the source of the `ERR_NAME_NOT_RESOLVED` WebSocket errors and adds setup cost.
3. Google Fonts are loaded without `&display=swap`, so they render-block (Lighthouse: "Render blocking requests, Est savings of 150 ms / 750 ms mobile").
4. Static asset cache TTL is "None" (Lighthouse: "Use efficient cache lifetimes — Est savings 1,065 KiB"). Lovable hosting controls headers; a `_headers` file is the supported override.
5. Minification, gzip/brotli, and tree-shaking are already enabled by Vite + Lovable's CDN — confirmed via build output names. Nothing to change there beyond removing dead imports.

### Changes

1. **Dynamic-import heavy libs at call-sites** (no UI change, only `import` becomes `await import`):
  - `src/services/exportService.ts` — already does runtime work; lazy-load `jspdf`, `pdf-lib`, `html2canvas`, `exceljs` inside the export functions.
  - `src/pages/tools/PDFSplitter.tsx` — `const { PDFDocument } = await import('pdf-lib')` inside the split handler.
  - `src/pages/tools/PDFCompressor.tsx`, `src/pages/tools/PDFMerger.tsx` — same pattern for `pdf-lib`.
  - `src/pages/tools/AttendanceAnalytics.tsx` — lazy-load `jspdf` + `html2canvas` inside the export-PDF handler; keep `recharts` import (it is the page's main UI), but the page is already a lazy route, so the `charts` chunk will only ship when this route is visited.
  - `src/components/admin/EnhancedCSVUploader.tsx` — lazy-load `exceljs` inside the upload/parse handler.
  - `src/pages/tools/AttendanceReportsPage.tsx`, `src/components/ai-coach/WeeklyTrendChart.tsx`, `src/components/admin/analytics/RealtimePulse.tsx`, `src/components/dashboard/*Chart.tsx` — these are already only reached from lazy routes, so no change is needed once the static-import chain to `pdf` chunk is broken. They will continue to ship `charts` only on Analytics/admin/tool routes.
  - Delete the unused `src/components/ui/chart.tsx` (verified: zero imports anywhere) so it cannot accidentally pull `recharts` into a future bundle.
  - Result: `pdf` chunk is created on demand (true async), and is no longer part of the initial route's preload graph. `charts` ships only with Analytics and the two attendance/admin tool routes.
2. **Defer Supabase realtime on the landing page** in `src/contexts/AppearanceContext.tsx`:
  - Skip the `global-appearance` channel subscription when `!user` (logged-out). Logged-out visitors don't need live theme overrides — they already get the latest snapshot from the initial REST fetch. This removes the WebSocket attempt on `/` entirely, fixing `ERR_NAME_NOT_RESOLVED`.
  - For logged-in users, gate subscription behind `requestIdleCallback` (fallback `setTimeout 2000`) so it never competes with FCP.
3. **Font-display: swap** in `index.html`:
  - Append `&display=swap` to the Google Fonts preload+stylesheet URL (currently the URL has `display=swap` already in the request — re-verify and add it explicitly to both the `<link rel="preload">` and `<noscript>` fallback if missing). Keep the existing preconnect hints.
4. **Cache headers** via `public/_headers` (Lovable's static host honours this Netlify-style file for header overrides; the existing `_redirects` comment is just about redirects, not headers):
  ```
   /assets/*
     Cache-Control: public, max-age=31536000, immutable
   /sitemaps/*
     Cache-Control: public, max-age=3600
   /*.js
     Cache-Control: public, max-age=31536000, immutable
   /*.css
     Cache-Control: public, max-age=31536000, immutable
   /*.woff2
     Cache-Control: public, max-age=31536000, immutable
  ```
   Vite emits hashed filenames in `/assets/*`, so 1-year immutable is safe.
5. **Vite config tweak** (`vite.config.ts`) — keep manualChunks but make sure `pdf` chunk only contains true leaf libs by removing `exceljs` from the `pdf` group (it's an Excel lib, unrelated to PDF) and giving it its own `excel` chunk. This prevents users opening a PDF tool from also downloading exceljs and vice-versa:
  ```ts
   if (id.includes('pdf-lib') || id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
   if (id.includes('exceljs')) return 'excel';
  ```

### Out of scope / not changed

- No UI, copy, animation, color, or layout edits.
- Minification / brotli are already handled by Vite + Lovable CDN; nothing to toggle.
- Source maps for production are intentionally off (size).
- GA4 script remains async-loaded as today.

### Files to edit

- `src/services/exportService.ts`
- `src/pages/tools/PDFSplitter.tsx`
- `src/pages/tools/PDFCompressor.tsx`
- `src/pages/tools/PDFMerger.tsx`
- `src/pages/tools/AttendanceAnalytics.tsx`
- `src/components/admin/EnhancedCSVUploader.tsx`
- `src/contexts/AppearanceContext.tsx`
- `index.html` (font-display)
- `vite.config.ts` (split exceljs)
- `public/_headers` (new)
- `src/components/ui/chart.tsx` (delete; unused)

### Expected impact

- Landing route initial JS drops by ~770 KB transferred (the `pdf` + `charts` chunks no longer in the preload graph).
- Mobile FCP/LCP should improve by 1–3 s on slow 4G (no more 617 KB `pdf` chunk on critical path).
- `ERR_NAME_NOT_RESOLVED` realtime errors disappear for logged-out users.
- Repeat visits cached for a year on hashed assets (Lighthouse "Use efficient cache lifetimes" passes).

&nbsp;

&nbsp;

**Please execute the Performance Optimization Plan now.**

Follow the checklist strictly:

1. Use **Dynamic Imports** (static → dynamic) for all heavy libraries (`jspdf`, `pdf-lib`, `html2canvas`, `exceljs`).
2. Implement the **AppearanceContext Realtime deferral** for logged-out users.
3. Update `index.html` for **font-display: swap** using the preload method.
4. Create the `public/_headers` file for the 1-year immutable cache.
5. Configure **Vite chunks** to separate `excel` from the `pdf` bundle.
6. Delete the unused `chart.tsx`.

## **Reminder:** *Do NOT change any UI, animations, or colors. We want the exact same look but with 'Bullet-Fast' performance. Go ahead and deploy!*