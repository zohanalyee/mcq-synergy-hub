# Tools Section Audit — MCQsAI (65 live tools)

Visual identity, animations, gradients and aero density are **preserved**. All work below is reliability, correctness, mobile UX, SEO depth and discoverability — no redesign.

---

## 1. Critical issues (ship first)

### C1. QR Generator outputs a fake, non-scannable pattern

`src/pages/tools/QRGenerator.tsx` draws a deterministic hash pattern with finder squares. The on-screen disclaimer literally says *"Visual QR pattern — not scannable"*. This is a trust-killer and a refund-magnet for SEO.  
**Fix:** replace canvas hashing with the `qrcode` npm library (≈12 KB gz, lazy-loaded). Real Reed–Solomon QR, SVG + PNG download, size/error-correction selector, foreground/background colour, optional embedded logo. Add Web Share API button on mobile.

### C2. No QR Scanner tool exists

User asked us to "improve" it — it isn't built. Add `/tools/qr-scanner` using `html5-qrcode` (camera + image upload decode), explicit `getUserMedia` permission prompt with fallback UI ("Allow camera or upload an image"), torch toggle on supported devices, copy-result + open-link buttons, history of last 5 scans in `localStorage`.

### C3. Calculator UX is laggy on mobile

`FloatingCalculator` and `MathTool` use `parseFloat(display)` everywhere, never format thousands, lose precision on chained ops (0.1+0.2 bug), and the on-screen buttons fire `setDisplay` on every render with no `inputMode`.  
**Fix across all calc tools (Calculator, EMI, Loan, Salary, Tip, Discount, Percentage, Marks, GPA, CGPA, Grade, Ratio, BMI, BMR, Age, Date, Duration, Fuel, Speed, Area, Currency):**

- Add `inputMode="decimal"` and `pattern="[0-9]*"` to every numeric `<input>` → native numeric pad on mobile.
- Wrap math in `decimal.js-light` (≈8 KB) for the four big offenders (EMI, Loan, Salary, CGPA).
- Debounce instant-recalc with `useDeferredValue` so typing stays at 60fps.
- Locale-format outputs via `Intl.NumberFormat('en-PK')` (PKR aware).
- Add Copy + Share buttons to every result block (reuse `CopyButton` from `ToolWrapper`).

### C4. Per-tool SEO is half-done

`ToolRouteSEO` injects title/description globally, but it never emits FAQ JSON-LD and `ToolWrapper` only emits `WebApplication`. Google sees 65 near-duplicate pages with no unique structured data.  
**Fix:** add a `faq` field to `ToolDefinition` (3–5 Q/A per tool) and emit `FAQPage` JSON-LD inside `ToolWrapper` (guarded so it only renders here — keeps the de-dup rule from the earlier `StructuredData.tsx` fix intact). Also emit `BreadcrumbList` JSON-LD (Tools › Category › Tool).

### C5. `CalendarTool.tsx` bypasses `ToolWrapper`

No breadcrumb, no FAQ, no related tools, no JSON-LD — thin page. Migrate it to `ToolWrapper` like the other 60+ tools.

---

## 2. Medium-priority fixes


| #   | Tool                                                     | Issue                                                             | Fix                                                                                                |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| M1  | `PDFCompressor`, `PDFMerger`, `PDFSplitter`, `PDFToText` | No progress UI, no error toast on corrupt PDF, no file-size guard | Add `<Progress>` + try/catch + 50 MB client limit + "processed locally, never uploaded" trust line |
| M2  | `ImageCompressor`, `ImageConverter`, `ImageResizer`      | Same — no progress, no EXIF strip notice                          | Same progress pattern + privacy note                                                               |
| M3  | `CurrencyConverter`                                      | Uses hard-coded or stale rates?                                   | Switch to `exchangerate.host` free tier, cache 1 h in `localStorage`, show "Rates updated …"       |
| M4  | `PasswordGenerator`                                      | Likely no entropy meter                                           | Add zxcvbn-style strength bar + copy-with-auto-clear (30 s)                                        |
| M5  | `EquationSolver`                                         | Verify it actually solves (often a thin AI wrapper)               | If broken, swap to `mathjs.evaluate` for arithmetic + symbolic                                     |
| M6  | `WordCounter` / `CharacterCounter`                       | Duplicate utility                                                 | Cross-link them and add reading-time, Urdu/Arabic-aware word split                                 |
| M7  | All tools                                                | Missing `<noscript>` fallback message                             | Add a one-line static H1 + description so prerender/Googlebot-no-JS still sees content             |
| M8  | `ColorPicker`, `RandomNumber`, `NameGenerator`           | No history / no shareable URL                                     | Encode state in querystring → shareable links boost backlinks                                      |
| M9  | `WorldClock`, `IslamicCalendar`, `InternationalCalendar` | Likely render-blocking                                            | Lazy-load with `React.lazy` + skeleton                                                             |
| M10 | Tools index `/tools`                                     | 65 cards mount synchronously                                      | Virtualise with `@tanstack/react-virtual` or paginate per category tab                             |


---

## 3. Low-priority polish

- Add `aria-label` to every icon button (a11y + SEO).
- Add `prefers-reduced-motion` guard around framer entry animations.
- Add a sticky "Back to Tools" on mobile (currently top-only, lost on scroll).
- Add OG image generator per tool (server-side via Edge Function) so social previews stop looking generic.
- Add a "Report an issue" link in every `ToolWrapper` footer → routes to `/feedback?tool={id}`.

---

## 4. SEO coverage matrix (after C4 lands)

Every tool will carry: unique `<title>`, meta description, canonical (via `GlobalCanonical`), single H1 (already in `ToolWrapper`), `WebApplication` + `FAQPage` + `BreadcrumbList` JSON-LD, 4 related-tool internal links, How-to-use list, MCQ cross-sell CTA.

Add to `scripts/generate-sitemaps.mjs`: dedicated `tools.xml` with `<priority>0.7</priority>` for popular tools, `0.5` for the rest, updated weekly.

---

## 5. High-potential new tools (Pakistan + education intent)

Ranked by search-demand × evergreen value × low build cost:

1. `/tools/qr-scanner` — pairs with fixed QR generator (C2).
2. `/tools/pakistan-tax-calculator` — FY 2025-26 salary tax slabs (FBR). Huge evergreen query.
3. `/tools/zakat-calculator` — Nisab via live gold price, Ramadan traffic spike.
4. `/tools/prayer-times` — geolocation + AlAdhan API, embeddable widget.
5. `/tools/qibla-direction` — device-orientation API.
6. `/tools/aggregate-calculator` — MDCAT/ECAT/NUST/UHS weighted aggregate (matric+FSc+entry test). Direct funnel into existing MDCAT/ECAT SEO pages.
7. `/tools/merit-calculator` — generic university merit (open/closed merit lookups).
8. `/tools/scholarship-eligibility-checker` — funnels into `/scholarships`.
9. `/tools/job-test-score-predictor` — funnels into `/jobs` + job-tests.
10. `/tools/cnic-validator` — Luhn-style checksum + DOB extraction.
11. `/tools/iban-validator` (PK IBAN format).
12. `/tools/urdu-keyboard` — phonetic transliteration → copyable Urdu.
13. `/tools/text-to-speech` (Urdu + English via Web Speech API, free).
14. `/tools/study-pomodoro` — branded Pomodoro with subject tagging → cross-link to MCQ tests.
15. `/tools/plagiarism-snippet-checker` — simple n-gram Google search opener (no AI cost).
16. `/tools/citation-generator` — APA/MLA/Harvard for thesis students.
17. `/tools/markdown-to-html` & `/tools/json-formatter` — dev-side evergreen.
18. `/tools/internet-speed-test` — embedded via fast.com iframe alternative.

---

## 6. Performance bottlenecks

- `ToolRouteSEO` runs on every route change including non-tool routes (early return is fine, but it imports `ALL_TOOLS` eagerly → 65 icon imports in initial bundle). **Fix:** lazy import the registry only inside the `/tools/*` branch.
- `toolsConfig` icons in `FloatingToolsRenderer` are always mounted even when no floating tool is open. **Fix:** dynamic-import the component map.
- Tools index page bundles every tool icon. **Fix:** split icon imports per category, render-on-tab.

---

## 7. Quick wins vs long-term

**Quick wins (≤ 1 day each, ship in one sprint):**

- C1 (real QR), C3 (`inputMode` + locale format), C4 (FAQ JSON-LD), C5 (CalendarTool migrate), M3 (live rates), M7 (`<noscript>` H1), perf icon-tree-shake.

**Medium (2–4 days):**

- C2 (QR scanner), M1/M2 (PDF + image progress + errors), M10 (tools index virtualisation), new tools #1–#6 (high-traffic).

**Long-term (1–2 weeks):**

- New tools #7–#18, per-tool OG images via Edge Function, decimal.js refactor across all calculators, sitemap split + indexability watchdog.

---

## 8. Verification after build

Run in this order:

1. `node scripts/verify-sitemap.mjs` — ensure new tool slugs appear.
2. `node scripts/verify-prerender.mjs` — confirm tool pages prerender with unique titles + FAQ JSON-LD.
3. Browser perf profile on `/tools` and `/tools/qr-generator` (target LCP < 2.0 s mobile, INP < 200 ms).
4. Scan a real QR from the generator with two physical phones (Android + iOS camera app).
5. Re-run Google Rich Results test on 3 sample tool pages — confirm `FAQPage` + `WebApplication` + `BreadcrumbList` detected, no duplicate FAQPage on `/`.
6. Lighthouse mobile audit on 5 representative tools — report deltas.

No changes to auth, Supabase schema, RLS, dashboards, AI systems, branding, colors, gradients or routing structure.

**Important Note: Fix only critical tool issues. No redesign. No new tools yet.**

C1 — Real QR Generator:

Replace fake canvas pattern with qrcode npm library. Real scannable QR. SVG + PNG download.

C2 — QR Scanner:

Add /tools/qr-scanner using html5-qrcode. Camera + image upload. Copy result button.

C3 — Calculator mobile fix:

Add inputMode="decimal" to all numeric inputs. Intl.NumberFormat('en-PK') for outputs.

C4 — FAQ JSON-LD for tools:

Add faq field to ToolDefinition. Emit FAQPage + BreadcrumbList JSON-LD in ToolWrapper.

C5 — CalendarTool migrate:

Move to ToolWrapper like other tools.

M3 — Currency live rates:

Switch to exchangerate.host free API. Cache 1 hour localStorage.

M7 — noscript fallback:

Add static H1 + description to all tools for prerender/Googlebot.

performance icon fixes

Do not change auth, Supabase, dashboards, AI systems, branding, colors, or routing.

Future tools — phased:

Phase

Tools

Next week

Aggregate calculator, Merit calculator

Month 2

Zakat, Tax, Prayer times

Month 3

Urdu keyboard, Pomodoro, Citation

&nbsp;