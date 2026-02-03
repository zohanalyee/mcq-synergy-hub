

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

### Question Bank & Tests
- **Question Bank Service**: Filters by subject, topic, subtopic, difficulty
- **Custom Test Generation**: Pulls from `content_items` (MCQ category)
- **Usage Tracking**: `usage_count`, `last_used_at` fields updated on use
- **Test Sessions**: Saved to `custom_test_sessions` table per user

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

## What Is Pending (Not Yet Built)

### Critical Gap: RAG → MCQ Auto-Generator
| Component | Status | Description |
|-----------|--------|-------------|
| RAG → MCQ Pipeline | **NOT BUILT** | No function converts document chunks into MCQs |
| Topic-Document Linking | **NOT BUILT** | PDFs not linked to LMS topics (missing `topic_id` in documents table) |
| Auto-Generation Trigger | **NOT BUILT** | No trigger to populate Question Bank from RAG |
| Difficulty Distribution | **PARTIAL** | Config exists but not applied to RAG-to-MCQ flow |

### Missing Pieces
1. **Document-to-LMS Mapping**: When admin uploads PDF, no UI to tag it with board/class/subject/topic
2. **RAG-to-MCQ Edge Function**: New function needed to:
   - Take topic_id as input
   - Query RAG for relevant chunks
   - Generate MCQs using Gemini with RAG context
   - Save to content_items with proper FK links
3. **Syllabus Builder RAG Fallback**: Currently pulls only from DB; no fallback to RAG if content missing

---

## Architectural Improvements Recommended

### 1. Add Document-to-LMS Linking
```sql
-- Add to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS 
  topic_id UUID REFERENCES topics(id),
  subject_id UUID REFERENCES subjects(id),
  level_id UUID REFERENCES levels(id),
  system_id UUID REFERENCES educational_systems(id);
```

### 2. Create RAG-to-MCQ Generation Function
New Edge Function: `generate-from-rag`

**Input:**
```json
{
  "topic_id": "uuid",
  "difficulty": "easy|medium|hard",
  "count": 10
}
```

**Flow:**
1. Fetch topic name and related document sections via vector search
2. Build prompt with RAG context
3. Generate MCQs using Gemini (one-time)
4. Save to content_items with topic_id FK
5. Mark as "rag_generated" source

### 3. Tiered AI Strategy (Cost Optimization)

| Task | When to Use AI | Runtime AI? |
|------|----------------|-------------|
| MCQ Generation | Once on admin trigger or nightly cron | NO - cached in DB |
| Student Q&A | Per query (unavoidable) | YES - lightweight |
| Jobs/Scholarships | Once on sync (admin trigger) | NO - cached in external_opportunities |
| Syllabus Content | DB first, RAG fallback only if empty | RARE |

---

## Moltbolt/OpenClaw Integration Strategy

Based on the OpenClaw AI capabilities, here's where it fits:

### Best Use Cases for Moltbolt/OpenClaw

| Feature | Why OpenClaw Works | Implementation |
|---------|-------------------|----------------|
| **Jobs Automation** | Web scraping + summarization is OpenClaw's strength | Replace `fetch-external-jobs` Gemini call with OpenClaw agent that scrapes real job boards |
| **Scholarships Automation** | Same pattern - scrape HEC, Fulbright, etc. | Scheduled agent writes directly to `external_opportunities` table |
| **Content Enrichment** | Generate explanations, summaries for existing MCQs | Batch job - enrich content_items with better explanations |

### What Should NOT Use External AI

| Task | Why Keep Local/Cached |
|------|----------------------|
| Quiz Delivery | Must be instant - serve from DB |
| Test Sessions | Already pulled from cache |
| LMS Navigation | Pure DB queries |
| Student Dashboard | Analytics from DB |

### OpenClaw Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEDULED CRON (Daily 2 AM)                  │
│  ┌──────────────────┐                                           │
│  │ Trigger OpenClaw │                                           │
│  │ via Webhook      │                                           │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │ OpenClaw Agent   │ ← Scrapes LinkedIn, Rozee.pk, HEC, etc.   │
│  │ (Jobs Task)      │                                           │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │ OpenClaw writes  │                                           │
│  │ to Supabase via  │ → external_opportunities (status:pending) │
│  │ REST API         │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle**: OpenClaw runs on schedule → writes to DB → never called at runtime

---

## Execution Order (Prioritized Tasks)

### Phase 1: Complete RAG-to-Question Bank Pipeline (Highest Priority)

1. **Add LMS columns to documents table** (migration)
2. **Update DocumentLibrary UI** to select board/class/subject/topic when uploading
3. **Create `generate-from-rag` Edge Function**
4. **Add "Generate MCQs from Document" button** in Admin Panel
5. **Test end-to-end**: Upload PDF → Tag with topic → Generate MCQs → Verify in Question Bank

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
| LMS Structure | DONE |
| RAG Upload + Processing | DONE |
| RAG Search + Q&A | DONE |
| Question Bank CRUD | DONE |
| MCQ Generation (Gemini) | DONE (paused) |
| RAG → MCQ Auto-Generation | NOT BUILT |
| Document-to-LMS Tagging | NOT BUILT |
| Syllabus Builder RAG Fallback | NOT BUILT |
| OpenClaw Integration | NOT STARTED |
| Scheduled Auto-Fill | DONE (ready to enable) |
| Quota Protection | DONE |

The next logical step is **Phase 1**: Build the RAG-to-MCQ pipeline so uploaded documents actually populate the Question Bank automatically.

