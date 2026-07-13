## Goal

Do teen cheezein, jaisa aapne approve kiya:

1. **Root-cause guard** — background job-test generation sirf tab AI call kare jab genuine deficit ho; stale/already-filled rows par AI skip.
2. **Spend-limit setup guidance** — workspace/project-level alert + block limits set karne ke exact steps.
3. Cron frequency abhi unchanged (guard ke baad review karenge).

## Findings jinpe plan bana hai

- `scheduled-autofill` (nightly 2 AM) **pehle se deficit-guarded** hai: "already ran today" skip, `get_autofill_queue` sirf below-threshold topics deta hai, aur direct `GEMINI_API_KEY` use karta hai — **Lovable credits consume nahi karta**. Yahan change ki zaroorat nahi.
- `process-jobtest-queue` (har 5 min) sirf tab chalta hai jab queue mein `pending` row ho (admin enqueue karta hai). Lekin ye row process karte waqt **deficit re-check nahi karta** — agar enqueue ke baad woh subject already fill/approve ho gaya, tab bhi `generate-job-test` call ho jata hai (bekar AI call). **Yahi guard add karna hai.**
- `indexnow-submit-recent` sirf search-engine ping hai — koi AI/credit nahi.

## Part 1 — Deficit guard in `process-jobtest-queue`

File: `supabase/functions/process-jobtest-queue/index.ts`

Har queued row ko `generate-job-test` call karne se **pehle**:

1. Us row ke `job_test_id` + `subject` ke liye current **approved** question count query karo:
  ```text
   count(job_test_questions) where job_test_id = row.job_test_id
                                 and subject   = row.subject
                                 and admin_approved = true
  ```
2. Agar `approved_count >= row.target_count` (aur target_count > 0):
  - AI call **skip** karo.
  - Row ko `status='done'`, `accepted_count=0`, `error_message='skipped: deficit already satisfied'`, `processed_at=now()` set karo.
  - `results` mein `status:'skipped'` push karo aur log karo.
3. Warna existing behavior — `generate-job-test` call (jo khud bhi deficit-only generate karta hai per existing precheck).

Edge case: agar `target_count` null/0 ho to purana behavior rakho (skip-guard tabhi lage jab target defined ho), taake koi legitimate row block na ho.

Iska asar: queue drain karte waqt jo rows already-satisfied ho chuki hain unpe **zero AI call** — bekar generation/credits khud ruk jayenge. Approval abhi bhi 100% manual rahega; sirf generation skip hoti hai.

Deploy: function auto-deploy ho jayega; ek smoke-invoke se 200 confirm karenge.

## Part 2 — Spend-limit setup guidance (koi code change nahi)

Aapko exact steps doonga (screenshots-style, UI-only):

**A. Workspace/member credit limits**

- Settings → Workspace → **Default monthly member credit limit** (sab members ke liye default cap).
- Settings → People → kisi member par **Set credit limit** (per-person override, jaise apne account par).

**B. Spend alerts / hard block (agar aapke role ke paas billing permission hai)**

- Notification limit: jab usage kisi threshold se upar jaye to turant alert.
- Block limit: threshold par pahunchte hi further build/AI spend rok do.
- Recommended thresholds aapke current data ke hisaab se: monthly 100-credit billing grant hai; alert ~70 par, block ~95 par set karne ka suggest karoonga. Daily 5-credit allowance ke liye ~4 par alert.

**C. Silent background spend note**

- Is billing period mein **Project Monitoring ne ~9.9 credits** liye (automated scanner, bina prompt). Isko Lovable project settings se manage/disable karne ka rasta bataunga agar aap chahen.

## Out of scope (abhi nahi)

- Cron frequency change (5-min / 15-min) — guard ke baad agar spend high rahe tab.
- `scheduled-autofill` / `indexnow` mein koi change — already safe.

## Verification

- `process-jobtest-queue` ko ek already-filled test ke queue row ke saath test karke confirm karenge ke woh `skipped` return kare, koi `generate-job-test` call na ho (edge logs se).
- Typecheck pass.
  &nbsp;

Add a genuine-deficit guard to process-jobtest-queue (skip AI when approved_count >= target_count), plus give exact workspace/member spend-limit setup steps. scheduled-autofill/indexnow already safe; cron frequency unchanged for now.

&nbsp;

**Bohat achi report hai** — "Project Monitoring" wala scanner hi asal wajah lagta hai (9.9 credits bina prompt ke). Please:

1. Mujhe exact steps dein Project Monitoring ko DISABLE ya manage karne ke — main isay band karna chahta hoon agar yeh sirf ek generic background scanner hai jo meri actual SEO/mock-test kaam ke liye zaroori nahi.

2. Deficit-guard (process-jobtest-queue) implement kar dein jaisa propose kiya hai, aur smoke-test se confirm kar dein 200/skipped response aa raha hai.

3. Spend-limit setup steps bhi de dein (workspace default limit + alert ~70, block ~95 monthly; daily ~4) — main khud jaake set kar loonga.                                                  

&nbsp;

   Project Monitoring exactly kya karta hai (kya scan/check karta hai), aur yeh kis ne aur kab enable kiya tha mere project par — kya yeh Lovable ka default-on feature hai naye projects ke liye, ya maine/kisi ne isay enable kiya tha? Please exact detail dein, phir main decide karunga disable karna hai ya rakhna hai.