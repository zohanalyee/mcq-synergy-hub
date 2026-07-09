# Section D — SEO/AEO Enhancements (Proposed Order)

Sections A–C mukammal aur live-verified hain. Section D ke 4 hisson ka **recommended order** neeche hai — impact vs. effort, aur de-indexing recovery ke context ke hisaab se. Har section alag approval ke saath implement hoga.

## Recommended Order & Rationale

### D1 — Thin-Content Check & Noindex Gate (PEHLE)

**Kyun pehle:** De-indexing ke baad Google dobara crawl kar raha hai. Agar thin/empty pages index hoti hain to "crawl budget waste" + quality signal girta hai. Isko pehle lock karna baaki sab ko boost deta hai.

- Board/topic pages: `<5 approved MCQs` wale already noindex hone chahiye — audit + confirm karna.
- Opportunity/blog pages jinme minimal body content ho, unke liye consistent noindex threshold.
- `inject-meta.mjs` + component-level `robots` meta dono ka alignment verify.
- Sitemap se thin URLs exclude hain ya nahi (≥5 threshold) — cross-check.

### D2 — Schema / JSON-LD Audit & Expansion (DOOSRE)

**Kyun doosre:** Content quality set hone ke baad structured data AEO/rich-results ka sabse bada lever hai.

- Har page type par current JSON-LD audit (Organization, WebSite, Course, Article, BreadcrumbList).
- **MCQ leaf pages par `FAQPage` schema** add — AEO/answer-engine citations ke liye (audit report ki recommendation).
- Mock-test pages: `Quiz` / `LearningResource` schema evaluate.
- `@id` linking + `BreadcrumbList` consistency har template par.
- Single-FAQPage-per-page rule enforce (duplicate schema se bachna).

### D3 — Internal Linking Structure (TEESRE)

**Kyun teesre:** Schema + content solid hone ke baad link-equity distribution se ranking consolidate hoti hai.

- Board hub → class → subject → topic silo linking mazboot karna.
- Related-topics / related-mock-tests contextual link blocks.
- Orphan pages (jo kisi internal link se reachable nahi) identify + fix.
- Breadcrumb navigation har template par (D2 breadcrumb schema ke saath tie).

### D4 — Hreflang / Language Targeting (AAKHIR MEIN)

**Kyun aakhir:** Site English + Urdu/Sindhi translations rakhti hai, lekin routes single-URL hain (client-side language switch). Hreflang tabhi sahi hai jab per-language URLs hon — is liye pehle decide karna hoga:

- Kya alag `?lang=` / `/ur/` URLs banane hain, ya `en-PK` single-locale target rakhna hai?
- Agar single-locale: sirf `<html lang>` + `content-language` correctly set karna (chhota fix).
- Agar multi-URL: bara architecture change — alag scope.

## Execution Notes

- Har section ke start par: current state audit → change → live re-verify (Googlebot UA curl).
- Koi bhi Cloudflare/WAF change is scope mein nahi — sirf codebase + edge/build-time.
- Har section alag se approve karayenge; D1 sabse quick win + safety hai.

## Suggested Kickoff

**D1 (Thin-Content) se shuru karein** — sabse kam risk, foran quality signal improve, aur baaki teeno ke liye clean foundation. Aap chahein to order badal bhi sakte hain (e.g. agar AEO/rich-results priority hai to D2 pehle).

&nbsp;

# **Order approved — D1 se shuru karein.**

D1 (Thin-Content Check): 5-se-kam-MCQ wale board/topic pages, aur minimal-content wale opportunity/blog pages ka noindex audit + fix karein. inject-meta.mjs aur component-level robots meta ka alignment bhi verify karein, aur sitemap se thin URLs exclude hain ya nahi cross-check karein.

Complete hone k baad live Googlebot-UA curl se re-verify karein, phir mujhe bata dein — approve karne k baad D2 (schema/JSON-LD) shuru kar dein.