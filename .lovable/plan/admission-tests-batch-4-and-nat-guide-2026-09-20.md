# Admission-tests Batch 4 and NAT guide

## Scope

- Add three isolated, ad-free exam guides: `/exams/karachi-university`, `/exams/sindh-university`, and `/exams/nat`.
- Reuse the existing shared admission-test template; do not modify `/exams`, `/exams/mdcat`, existing exam pages, business logic, or sitemap generation.
- Prerender each new route so its verified content and metadata are crawler-visible, while intentionally leaving all three out of sitemaps for now.

## Official-source rules

- Karachi University facts will come only from `uok.edu.pk` official admissions material.
- Sindh University facts will come only from `usindh.edu.pk` and its official admissions portal.
- NAT facts will come only from `nts.org.pk` official NAT pages.
- Any duration, marks, schedule, frequency, eligibility detail, or paper component not explicitly stated by those sources will read “Not yet announced” or “Not officially published.”

## Page content

- Each page will include exam body, duration, marks/questions, frequency, covered subjects, eligibility, preparation tips, official links with a verification date, and related-exam cross-links.
- The NAT page will be a consolidated guide for all officially listed NAT types, with type-level paper-pattern links rather than unsupported separate pages. It will not claim that NAT-IBS exists because that label is absent from the official NTS list.
- No ad components will be added.

## Technical changes

- Create three data-only page components under `src/pages/exams/` using `AdmissionTestPage`.
- Add only the three explicit routes and their lazy/eager registry entries.
- Add the three routes to prerender configuration, before the generic `/exams/:examSlug` route.
- Verify route rendering, metadata, source links, absence from generated sitemap configuration, and project checks.

&nbsp;

This covers Sections 1 and 3 well — approved, please proceed with building.

&nbsp;

But Section 2 (Telegram intake audit) is missing from this response — I need those findings before deciding on removal. Please answer separately:

1. What does the Telegram intake webhook do — jobs/scholarships posting only, or does it also feed MCQ content generation from books/documents?

2. What's failing at the posting level for jobs/scholarships specifically?

3. Where do jobs/scholarships get added otherwise, if this is removed — confirm no gap

4. What's safe to remove vs. what should stay