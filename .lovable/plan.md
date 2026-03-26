

# SEO Optimization: Images, Headings, Internal Links, and Breadcrumbs

## Summary
Four improvements to boost SEO and accessibility: fix image alt attributes, enforce heading hierarchy, enhance footer with subject links, and add breadcrumbs to key pages.

---

## 1. Image Alt Attributes

**Current state**: Several `<img>` tags have `alt=""` or generic alts like `"Preview"`.

**Changes**:
- `ScholarshipsManager.tsx` -- change `alt=""` to `alt={scholarship.title}`
- `JobsManager.tsx` -- change `alt=""` to `alt={job.title}`
- `ImageConverter.tsx` -- change `alt=""` to `alt={f.name}` (input) and `alt={r.converted.fileName}` (output)
- `ImageCompressor.tsx` -- change `alt="Preview"` to `alt="Image preview before compression"`, `alt="Original"` to `alt="Original image before compression"`, `alt="Compressed"` to `alt="Compressed image result"`
- `HeaderLogo.tsx` -- the logo uses a Lucide icon (SVG), not `<img>`. Add `aria-label="MCQSAI Logo"` to the logo container div.
- Subject icons are Lucide React components (SVGs) -- add `aria-label` attributes where appropriate in `SubjectCard` or pass through props.

## 2. Heading Hierarchy (h1/h2/h3)

**Current state**: Multiple pages use only `<h1>` with no `<h2>`/`<h3>` structure. The home page (`Index.tsx`) needs audit for section headings.

**Changes**:
- **Index.tsx**: Ensure one `<h1>` for the hero. Demote section titles (Popular Subjects, Features, etc.) to `<h2>`. Card titles within sections become `<h3>`.
- **Subjects.tsx**: Keep one `<h1>` ("Subjects"). Already correct.
- **MockTests.tsx**: Keep one `<h1>`. Section sub-headings to `<h2>`.
- **SubjectContent.tsx**: Keep subject name as `<h1>`. Topic headings as `<h2>`.
- **Tool pages** (ImageConverter, ImageCompressor, Timer, Calendar): Already have single `<h1>` -- verify no duplicates.
- Review `SubjectsHeader.tsx` component -- ensure it doesn't add a second `<h1>` when used alongside page-level `<h1>`.

**Files to modify**: ~8-10 page files for heading adjustments.

## 3. Internal Linking -- Enhanced Footer

**Current state**: Footer has 6 quick links (Subjects, Tools, Scholarships, Jobs, Past Papers, Reviews). No subject-specific links.

**Changes to `Footer.tsx`**:
- Add a new "Popular Subjects" column (replacing or alongside existing columns) with links to top subjects: Biology, Chemistry, Physics, English, Mathematics, Computer Science. These will link to `/subjects` with appropriate search params.
- Add a "Practice Tests" column with links: Mock Tests, Custom Quizzes, Past Papers, Question Bank.

**Subject page cross-linking (`SubjectContent.tsx`)**:
- Add a "Related Practice" section at the bottom of subject content pages linking to Mock Tests and Custom Quizzes pages. This keeps users on-site longer.

## 4. Breadcrumb Navigation

**Current state**: `PageBreadcrumb` component exists and is used only on `SubjectContent.tsx`.

**Changes -- Add breadcrumbs to**:
- `Subjects.tsx` -- Home > Subjects
- `MockTests.tsx` -- Home > Mock Tests
- `TestSession.tsx` -- Home > Mock Tests > Test Session
- `Scholarships.tsx` -- Home > Scholarships
- `Jobs.tsx` -- Home > Jobs
- `PastPapers.tsx` -- Home > Past Papers
- `CustomSyllabus.tsx` -- Home > Custom Syllabus
- `Quizzes.tsx` -- Home > Custom Quizzes
- `Tools.tsx` -- Home > Tools
- Tool sub-pages -- Home > Tools > [Tool Name]

Each page will import `PageBreadcrumb` and pass the appropriate `items` array.

---

## Technical Details

**Files created**: None.

**Files modified** (~18 files):
- `src/components/header/HeaderLogo.tsx` -- add `aria-label`
- `src/components/Footer.tsx` -- add Popular Subjects and Practice Tests columns
- `src/components/admin/jobs/JobsManager.tsx` -- fix alt
- `src/components/admin/scholarships/ScholarshipsManager.tsx` -- fix alt
- `src/pages/tools/ImageConverter.tsx` -- fix alt
- `src/pages/tools/ImageCompressor.tsx` -- fix alt
- `src/pages/Index.tsx` -- heading hierarchy audit
- `src/pages/Subjects.tsx` -- add breadcrumb
- `src/pages/MockTests.tsx` -- add breadcrumb
- `src/pages/TestSession.tsx` -- add breadcrumb
- `src/pages/Scholarships.tsx` -- add breadcrumb
- `src/pages/Jobs.tsx` -- add breadcrumb
- `src/pages/PastPapers.tsx` -- add breadcrumb
- `src/pages/CustomSyllabus.tsx` -- add breadcrumb
- `src/pages/Quizzes.tsx` -- add breadcrumb (if exists as custom quizzes)
- `src/pages/Tools.tsx` -- add breadcrumb
- `src/pages/SubjectContent.tsx` -- add Related Practice section
- Tool sub-pages as needed

