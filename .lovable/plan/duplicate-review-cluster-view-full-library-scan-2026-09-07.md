# Duplicate Review: Cluster View + Full Library Scan

## Aap ka masla (confirm ho gaya)

Abhi Review Queue ek waqt mein sirf **ek flagged sawal + ek "original"** dikhata hai — pair. Lekin database mein duplicates sirf jodi mein nahi hain:

- 240 sawal `flagged_duplicate` hain (review ke intezaar mein)
- Same text ke **111 groups** hain jin mein total **306 sawal** hain — kuch groups mein 3, 4 ya zyada copies hain
- Isi liye jab aap ek pair ke dono sawal approve karte hain, us group ki teesri/chauthi copy phir queue mein aa jati hai — lagta hai kaam dobara aa gaya

## Kya banayenge

### 1. Cluster (Group) Review — pair ki jagah poora group

Queue ab "1 sawal" ke bajaye **groups** dikhayegi:

- Har card: sawal ka text + "4 copies" jaisa badge, subject/difficulty
- Group kholne par ek hi screen par us group ke **saare** sawal side-by-side (status badge ke saath: approved / pending / flagged)
- Ek click actions poore group par:
  - **Keep One** — jo copy aap chunein woh approved, group ki baaqi copies discard
  - **Keep All (Not Duplicate)** — poora group approved (jab system galat samjha ho)
  - **Discard Group** — nayi copies hataayen, purani approved copy jaisi hai waisi rahe
- Group ka faisla hone ke baad woh queue se hamesha ke liye nikal jayega — dobara nahi aayega

### 2. "Scan Library" button — pura data scan

Queue ke top par **Scan Library** button:

- Poore MCQ bank (approved + pending + flagged) par same-text scan chalta hai
- Jo bhi group mile jismein 2+ copies hain, woh review list mein aa jata hai — chahe copies pehle se approved hon
- Result summary: kitne groups, kitne extra sawal, kitne pehle se approved duplicate
- Scan sirf **rakhta hai review ke liye**, khud se kuch delete nahi karta — faisla aap ka

### 3. Progress aur yaad-dahani

- Header par counters: total groups, review ho chuke, baaqi
- Har group par "review ho gaya" ka nishan, taake aap ko yaad rakhna na pade

## Technical notes

- Nayi SECURITY DEFINER RPC `get_duplicate_clusters(limit, offset)`: normalized title (FORCE-SAVE tag hata kar, lowercase, trim) par `GROUP BY`, `HAVING count(*) > 1`, har group ke members JSON mein (id, title, options, correct_option, status, subject, difficulty, created_at, show_in_* flags). Admin-only (`is_admin()` guard).
- `DuplicateReviewQueue.tsx` cluster-based ho jayega: left = group list, right = group members comparison. Existing `handleKeepNew` / `handleDiscardNew` logic reuse hogi (status update / delete), sirf group ke upar apply hogi.
- Reviewed groups ka nishan: `system_settings` mein ek `duplicate_review_dismissed` key (normalized-title hashes ki list) — koi naya table nahi.
- Duplicate-detection pipeline (generate-test), difficulty, subject tags, aur baaqi flow ko touch nahi karenge — sirf review UI + read-only scan RPC.

&nbsp;

Plan approved. Proceed with the cluster-review rebuild (get_duplicate_clusters RPC, cluster-based DuplicateReviewQueue.tsx with Keep One / Keep All / Discard Group actions, Scan Library button, progress counters). Verify after: run Scan Library once to confirm it surfaces all 111 existing groups correctly, and test Keep One / Discard Group on a real cluster to confirm the whole group leaves the queue permanently.