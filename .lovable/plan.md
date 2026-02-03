
# Project Architecture Analysis & Remaining Work Plan

## What Is Done (Confirmed Working)

### LMS Structure
- **Educational Systems Table**: AKU-EB, Cambridge/Oxford, Punjab, Sindh boards - all defined
- **Levels**: Classes 4-12 with proper hierarchy
- **Subjects & Topics**: Fully linked with foreign keys (level_id, subject_id)
- **Admin UI**: LMS Structure Manager, Subject Manager, Topic Manager all functional
- **Bulk Syllabus Import**: JSON-based import into any level

### RAG Pipeline (End-to-End Working)
- **PDF Upload**: Admin → Storage bucket (`course_books`) → Document record
- **Server-Side Processing**: `process-book` Edge Function uses `unpdf` (no client crashes)
- **Text Chunking**: 1000 chars with 200 overlap
- **Embeddings**: Gemini `text-embedding-004` (768 dimensions)
- **Vector Storage**: `document_sections` table with pgvector HNSW index
- **Search RPC**: `match_document_sections` with similarity threshold
- **Student Q&A**: `/ask-document` page calling `rag-search` Edge Function with strict grounding
- ✅ **Document-to-LMS Linking**: PDFs can now be tagged with board/class/subject/topic on upload
- ✅ **RAG-to-MCQ Generation**: `generate-from-rag` Edge Function converts document chunks to MCQs

### Question Bank & Tests
- **Question Bank Service**: Filters by subject, topic, subtopic, difficulty
- **Custom Test Generation**: Pulls from `content_items` (MCQ category)
- **Usage Tracking**: `usage_count`, `last_used_at` fields updated on use
- **Test Sessions**: Saved to `custom_test_sessions` table per user
- ✅ **RAG-Generated MCQs**: Questions marked with `source_type: 'rag_generated'` and linked to source document

### AI Generation (Implemented but Paused)
- **`generate-test` Edge Function**: Full MCQ generation with model fallback (gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-pro)
- **Hybrid Deduplication**: Fingerprinting + normalized text matching
- **Job/Syllabus Mapping**: Maps job tests to core subjects for cross-question reuse
- **Database-First Recovery**: Falls back to cached questions on 429/403 errors

### Auto-Fill System (Implemented)
- **`scheduled-autofill` Edge Function**: Nightly cron job ready
- **Content Gap Detection**: `get_autofill_queue` RPC finds topics below threshold
- **Dashboard UI**: Shows daily quota, content gaps, priority queue
- **Settings**: Configurable batch size, threshold, priority (lowest_first/random)

### External Opportunities (Implemented but Paused)
- **`fetch-external-jobs` Edge Function**: Generates mock jobs/scholarships via Gemini
- **Auto-Tagging**: Sector detection (govt/private), region detection, scholarship scope
- **Admin Curation**: Pending/Approved/Rejected workflow

---

## Phase 1 Complete ✅

### RAG → MCQ Auto-Generator (DONE)
| Component | Status | Description |
|-----------|--------|-------------|
| RAG → MCQ Pipeline | ✅ DONE | `generate-from-rag` Edge Function converts document chunks into MCQs |
| Topic-Document Linking | ✅ DONE | Documents table has `topic_id`, `subject_id`, `level_id`, `system_id` columns |
| Auto-Generation Trigger | ✅ DONE | "Generate MCQs" button in Document Library |
| Difficulty Distribution | ✅ DONE | 40% Easy, 40% Medium, 20% Hard distribution |
| Source Tracking | ✅ DONE | `source_type` and `source_document_id` columns added to `content_items` |

### Document Library Updates
- ✅ LMS selector dropdowns (Board → Class → Subject → Topic)
- ✅ Documents table shows LMS link badge with full hierarchy tooltip
- ✅ Generate MCQs button (Sparkles icon) - disabled until document is linked to topic
- ✅ Documents fetched with joined LMS hierarchy names

---

## What Is Pending (Not Yet Built)

### Remaining Tasks
1. **Syllabus Builder RAG Fallback**: Currently pulls only from DB; no fallback to RAG if content missing
2. **OpenClaw Integration**: For automated job/scholarship scraping
3. **Batch RAG Generation**: Trigger MCQ generation for multiple documents at once

---

## Execution Order (Remaining)

### Phase 2: Integrate OpenClaw for Jobs/Scholarships

1. **Sign up for OpenClaw** and get API credentials
2. **Create webhook endpoint** in Supabase (or simple edge function)
3. **Configure OpenClaw agent** with:
   - Task: "Scrape Pakistan job boards for latest government and private jobs"
   - Output: JSON matching `external_opportunities` schema
   - Schedule: Daily or twice-weekly
4. **Disable Gemini-based `fetch-external-jobs`** (or keep as fallback)

### Phase 3: Scale-Ready Optimizations

1. **Implement question pooling**: Pre-generate 100+ questions per topic during off-peak
2. **Add similarity threshold check** before saving new questions (prevent near-duplicates)
3. **Create tiered difficulty generation**: Auto-fill generates mix (40% easy, 40% medium, 20% hard)
4. **Add usage analytics**: Track which topics are most accessed, prioritize those for auto-fill

---

## Quota Protection Summary

| Protection Layer | Implementation |
|------------------|----------------|
| Daily Limit Tracking | `ai_usage_logs` table + `get_ai_usage_today` RPC |
| Model Fallback | Cycles through 3 Gemini models on 429 |
| Database-First | All quiz delivery from cache |
| Scheduled Generation | Nightly cron, not on-demand |
| RAG Rate Limiting | 100ms delay between embedding calls |
| Student Q&A Throttle | Max 500 char query, top-5 chunks only |

---

## Summary Checklist

| Category | Status |
|----------|--------|
| LMS Structure | ✅ DONE |
| RAG Upload + Processing | ✅ DONE |
| RAG Search + Q&A | ✅ DONE |
| Question Bank CRUD | ✅ DONE |
| MCQ Generation (Gemini) | ✅ DONE |
| RAG → MCQ Auto-Generation | ✅ DONE |
| Document-to-LMS Tagging | ✅ DONE |
| Syllabus Builder RAG Fallback | ⏳ PENDING |
| OpenClaw Integration | ⏳ NOT STARTED |
| Scheduled Auto-Fill | ✅ DONE (ready to enable) |
| Quota Protection | ✅ DONE |

**Next step**: Test the RAG-to-MCQ pipeline end-to-end, then proceed to Phase 2 (OpenClaw integration).
