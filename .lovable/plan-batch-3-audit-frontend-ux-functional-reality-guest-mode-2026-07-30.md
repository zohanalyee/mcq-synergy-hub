# Batch 3 Audit — Frontend, UX, Functional Reality, Guest Mode

Report only. No code changed. Findings ko severity ke hisaab se group kiya hai, phir ek phase-wise fix roadmap.

## Critical (user ko dikhne wala nuqsan)

**F3-1. Poori app par koi global Error Boundary nahi hai.**
Sirf blog section (`BlogErrorBoundary`) protected hai. Kisi bhi page par ek JavaScript error aaye to user ko **blank white screen** milta hai — na message, na "Try again". Test session ke beech mein hua to user ka pura attempt gaya. Yeh Batch 1 ke crash-monitoring finding se bhi jud'ta hai.

**F3-2. Guest ka test result tab band hote hi hamesha ke liye khatam.**
Guest sessions `sessionStorage` mein save hote hain (`src/lib/guestSession.ts`). Tab close = data gone. Aur `GuestResultGate` sign-in par sirf *page path* yaad rakhta hai — **score/answers carry-forward nahi hote**. Matlab: guest 20 sawal hal karta hai, sign-up karta hai, aur wapas aa kar dobara zero se shuru karta hai. Yeh sab se bara conversion leak hai (user ki mehnat hi wo cheez hai jo usay account banane par majboor karti hai).

**F3-3. Guest ko result screen par sirf percentage milta hai, seekhne ko kuch nahi.**
Guest gate mein saare 5 benefits "locked" hain — koi ek bhi sawal ka explanation nahi dikhta. Best-practice yeh hai ke 1-2 explanations *free* dikhayein (taste), baqi lock karein. Abhi jo hai wo hard paywall jaisa mehsoos hota hai, isliye bounce rate zyada hoga.

## High (growth / quality par asar)

**F3-4. Guest cap kahin documented ya visible nahi.**
Guest ko 20-question cap chup-chaap lagta hai (`useStartQuickTest.ts`). User ko pehle nahi bataya jata ke "Guests 20 sawal, sign-in par 100" — is se surprise hota hai aur incentive bhi zaya hota hai. Cap ko *feature* bana kar dikhana chahiye, chhupana nahi.

**F3-5. Toast system abhi bhi do jagah bata hua hai.**
105 files `sonner` use karte hain, 24 files `hooks/use-toast`. Group 1C mein consolidation shuru hui thi par 24 files reh gayi hain — in par toast alag style/position mein aata hai (inconsistent brand feel).

**F3-6. Mobile viewport bug: 13 files `h-screen` use karte hain.**
Mobile browsers mein address-bar ki wajah se `h-screen` content ko screen se neeche dhakel deta hai (button kat jata hai). `h-dvh` sahi hai.

**F3-7. Touch targets: sirf 3 files mein 44px minimum enforce hua hai.**
Part-B roadmap mein yeh kaam mock-test player tak mehdood raha. Baqi app (quizzes, tools, board pages) mein chhote buttons mobile par mis-tap karate hain.

## Medium (maintainability / polish)

**F3-8. `App.tsx` mein 156 routes ek hi file mein.**
Lazy-loading theek se laga hua hai (achha), par file itni bari hai ke koi bhi routing change risky ho gaya hai.

**F3-9. 133 files mein `console.log` production build mein ja rahe hain.**
Chhota performance/privacy issue — kabhi kabhi internal data (question IDs, user flow) browser console mein leak hota hai.

**F3-10. 127 files mein `: any` type escape.**
Iska matlab TypeScript ka safety-net band hai — yehi wo jagahen hain jahan "undefined is not a function" jaise runtime crash paida hote hain.

**F3-11. 5 admin `<img>` tags bina `alt` ke.**
Sirf admin panel mein (public SEO par asar nahi), par accessibility audit mein flag hoga.

**F3-12. React Query `staleTime` 5 min global hai.**
Achha default hai, magar live cheezein (queue status, credits) aur static cheezein (board topics) dono ko ek hi rule mil raha hai — kuch jagah data purana dikh sakta hai.

## Guest Mode — Growth lens (summary)

Jo achha hai: guest quick-test chalta hai, `GuestResultGate` bilingual hai aur benefits clear hain, `ProtectedAction` + `FEATURE_CONFIG` se tiers saaf hain.

Jo tut'ta hai: (a) result carry-forward nahi, (b) koi "aap ne 3 test diye — sign up karke save karein" jaisa progressive nudge nahi, (c) cap invisible, (d) zero free explanation. Yeh 4 cheezein theek hongi to guest→signup conversion sab se zyada is se badhega, baqi kisi bhi UI polish se nahi.

## Tajweez karda roadmap (phase-wise, chhoti chhoti steps)

- **Phase 3A — Safety net (sab se pehle, sasta):** Global Error Boundary + friendly "kuch ghalat hua, dobara koshish karein" screen. F3-1.
- **Phase 3B — Guest conversion (sab se zyada faida):** Result carry-forward (sign-up ke baad guest attempt DB mein save), 1 free explanation unlock, cap ko visible banana. F3-2, F3-3, F3-4.
- **Phase 3C — Mobile polish:** `h-screen` → `h-dvh`, 44px touch targets app-wide, toast consolidation. F3-5, F3-6, F3-7.
- **Phase 3D — Housekeeping:** production se console.log strip, routes ko route-groups mein todna, sab se risky `any` jagahon ko type karna, admin alt text. F3-8 se F3-12.

Har phase alag turn mein, aap ke approve karne par.

&nbsp;

&nbsp;

**Roadmap approved — is order mein karein:**

Phase 3A (crash-safety-net) — pehle, sasta hai

Phase 3B (guest-conversion) — ISKO SABSE ZYADA PRIORITY dein, kyunki yeh directly signup/revenue se juda hai — jitni jaldi ho sake implement karein

Phase 3C aur 3D — baad mein, jab budget ho

Phase 3A se shuru kar dein.