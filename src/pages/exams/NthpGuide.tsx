import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JoinAlertsLink from '@/components/JoinAlertsLink';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { safeJsonLd } from '@/lib/jsonLd';
import { useExamFacts } from '@/lib/examFacts';
import { withRoundStatus, type ProgramRound } from '@/lib/programStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ExternalLink, ArrowRight } from 'lucide-react';

/**
 * IBA Karachi National Talent Hunt Program (NTHP) guide.
 * Facts verified 16 Oct 2026 from talenthunt.iba.edu.pk, nthp.iba.edu.pk and the
 * official 2027 cycle flyer. Round dates live in exam_pages (slug "nthp") facts.programs;
 * these props are the fallback. NTHP is IBA Karachi — never STS / Sukkur IBA.
 */
const MOCK = '/mock-tests/iba-karachi-nthp-mock-test-2027-english-mathematics-practice';
const BLOG = '/blog/iba-karachi-ogdc-national-talent-hunt-program-2027';
const CHECK = 'Check the official announcement';

const FALLBACK = {
  verifiedOn: '16 October 2026',
  officialUrl: 'https://talenthunt.iba.edu.pk',
  programs: [
    { name: 'Fall 2027', sponsor: 'OGDC', url: 'https://talenthunt.iba.edu.pk/program/details/27', opens: '12 October 2026', closes: '15 December 2026', closesIso: '2026-12-15', next: 'Shortlisted students emailed 1 February 2027; online classes start 15 February 2027.' },
    { name: 'Fall 2028', sponsor: 'Ihsan Trust + Meezan Bank', url: 'https://talenthunt.iba.edu.pk/program/details/28', opens: '12 October 2026', closes: '1 February 2027', closesIso: '2027-02-01', next: 'Stage 1 results 30 March 2027; Stage 2 form (selected only) 15 January – 30 April 2027; final notification 30 June 2027.' },
    { name: 'Fall 2028', sponsor: 'Mari Energies', url: 'https://talenthunt.iba.edu.pk/program/details/29', opens: '12 October 2026', closes: '1 February 2027', closesIso: '2027-02-01', next: 'Stage 1 results 30 March 2027; Stage 2 form (selected only) 15 January – 30 April 2027; final notification 30 June 2027.' },
    { name: 'Fall 2028', sponsor: 'OGDC', url: 'https://talenthunt.iba.edu.pk/program/details/30', opens: '12 October 2026', closes: '1 February 2027', closesIso: '2027-02-01', next: 'Stage 1 results 30 March 2027; Stage 2 form (selected only) 15 January – 30 April 2027; final notification 30 June 2027.' },
  ] as ProgramRound[],
};

const DISTRICTS: { province: string; list: string[] }[] = [
  { province: 'Punjab', list: ['Rahim Yar Khan', 'Attock', 'Chakwal', 'Rawalpindi', 'Jhelum', 'DG Khan'] },
  { province: 'Khyber Pakhtunkhwa', list: ['Karak', 'Lakki Marwat', 'Kohat', 'Orakzai', 'Dara Adam Khel'] },
  { province: 'Balochistan', list: ['Dera Bugti (North)', 'Dera Bugti (South)', 'Jhal Magsi'] },
  { province: 'Sindh', list: ['Ghotki', 'Hyderabad', 'Sanghar', 'Sukkur', 'Khairpur', 'Tando Allah Yar', 'Jamshoro', 'Badin', 'Sujawal', 'Tando Muhammad Khan'] },
];

const SAMPLE_PAPERS = [
  { label: 'NTHP Batch 2019 sample paper', url: 'https://nthp.iba.edu.pk/pdfs/batch2019.pdf' },
  { label: 'NTHP Batch 2018 past sample paper', url: 'https://nthp.iba.edu.pk/pdfs/NTHPBatch2018PastSamplePaper.pdf' },
  { label: 'Sample Paper I', url: 'https://nthp.iba.edu.pk/pdfs/SAMPLETESTPAPERS.pdf' },
  { label: 'Sample Paper II', url: 'https://www.iba.edu.pk/News/past_entry_test/NTHPJAN012012.htm' },
  { label: 'Sample Paper III', url: 'https://nthp.iba.edu.pk/pdfs/Sample_Test_III.pdf' },
  { label: 'Sample Paper IV', url: 'https://nthp.iba.edu.pk/pdfs/Sample_Test_IV.pdf' },
  { label: 'Sample Paper V', url: 'https://nthp.iba.edu.pk/pdfs/Sample_Test_V.pdf' },
  { label: 'Sample Paper VI', url: 'https://nthp.iba.edu.pk/pdfs/Sample_Test_VI.pdf' },
];

const MATH_TOPICS = 'Sets, relations, functions; exponents, surds, logarithms; polynomials (remainder, HCF, factorization, division); linear systems; quadratic equations; absolute-value equations and inequalities; matrices and determinants; sequences and series; permutation, combination, probability; ratio, proportion, variation; percentages; scale and map problems; word problems (age, speed-distance, consecutive integers, area/perimeter); triangles, circles, rectangles; trigonometric ratios and identities; mean, median, mode, standard deviation, variance; rational and irrational numbers, decimals.';
const ENGLISH_TOPICS = 'Parts of speech in context; antonyms; cloze passages (tenses, punctuation); prepositions; short real-life notices; sentence ordering; best heading for a paragraph; poem comprehension; reading comprehension (main idea, inference, vocabulary in context, reference words); advanced vocabulary sentence completion.';

const FAQS = [
  { question: 'What is the last date for the IBA Karachi NTHP OGDC Fall 2027 round?', answer: 'The official IBA Talent Hunt portal lists 15 December 2026 as the closing date of the pre-request form for the Fall 2027 round in collaboration with OGDC.' },
  { question: 'The poster says December 15, 2027. Which date is correct?', answer: 'The official IBA Talent Hunt portal lists 15 December 2026. The printed poster shows 2027, which appears to be a typo. Follow the portal date and check the official announcement if in doubt.' },
  { question: 'Which districts qualify for the NTHP OGDC Fall 2027 round?', answer: 'As per the official poster: Punjab — Rahim Yar Khan, Attock, Chakwal, Rawalpindi, Jhelum, DG Khan; KP — Karak, Lakki Marwat, Kohat, Orakzai, Dara Adam Khel; Balochistan — Dera Bugti (North), Dera Bugti (South), Jhal Magsi; Sindh — Ghotki, Hyderabad, Sanghar, Sukkur, Khairpur, Tando Allah Yar, Jamshoro, Badin, Sujawal, Tando Muhammad Khan. Applicants outside the listed districts are not covered by the Fall 2027 OGDC round.' },
  { question: 'What are the NTHP Fall 2028 rounds and their deadlines?', answer: 'Three Fall 2028 rounds are open: Ihsan Trust + Meezan Bank, Mari Energies, and OGDC. For all three, the Stage 1 pre-application opened on 12 October 2026 and closes on 1 February 2027; selected students are notified on 30 March 2027. The Stage 2 detailed form (selected students only) opens on 15 January 2027 and closes on 30 April 2027, with final notification on 30 June 2027.' },
  { question: 'Is NTHP a degree program?', answer: "No. NTHP is an orientation and aptitude-preparation program for IBA Karachi's undergraduate admission. It is not a degree." },
  { question: 'Is IBA Karachi NTHP the same as Sukkur IBA STHP?', answer: "No. NTHP is run by IBA Karachi. The Sindh Talent Hunt Program (STHP) is a separate program run by Sukkur IBA University." },
  { question: 'What is the NTHP test syllabus?', answer: 'Per the official NTHP website, shortlisted candidates take an MCQ test based on the Matriculation and HSSC-I curriculum of English Grammar & Composition and Mathematics. Suggested topics are guidance only; the test is not limited to them. This is the NTHP assessment test, not the IBA Karachi undergraduate aptitude test.' },
  { question: 'Where can I find NTHP sample or past papers?', answer: 'IBA Karachi publishes sample papers from older NTHP batches on its official NTHP website. This page links to each official file; we do not copy or host them.' },
  { question: 'Is there an interview after the NTHP test?', answer: 'Per the NTHP website, based on test performance and other criteria, candidates are further shortlisted for a panel interview.' },
  { question: 'What was the NTHP 2027 eligibility?', answer: "In the previous main cycle (NTHP Admissions Cycle 2027, now closed), eligibility was financially deserving students with 80% or above marks in the SSC-II (Matric) examination from any Board in Pakistan in 2025. Eligibility for the currently open rounds may differ — check the official announcement." },
  { question: 'Which documents were required for NTHP?', answer: "In the previous main cycle: Matric marksheet; HSSC-I enrollment/admit card (mandatory); applicant's CNIC or B-Form; parent/guardian's CNIC; salary slip and income certificate (affidavit not acceptable; business owners attach FBR income tax return); applicant's birth and domicile certificate, or father's domicile certificate; FBR income tax return (mandatory). For the open rounds, check the official announcement." },
  { question: 'Does NTHP guarantee a scholarship?', answer: 'No. Per the official disclaimer, NTHP does not guarantee an NTHP scholarship or financial assistance. A limited number of scholarships are available for candidates who pass the IBA Aptitude Test after the orientation, and IBA may change policies at its discretion.' },
  { question: 'Is NTHP in-person or online?', answer: 'The previous main cycle offered 3 weeks of in-person training on the IBA Karachi campus. The OGDC Fall 2027 round lists online classes starting 15 February 2027. Check each round on the official portal.' },
  { question: 'What is the eligibility and fee for the open NTHP rounds?', answer: `${CHECK}. The official portal pages for the open rounds do not state these on this page's verified-on date.` },
  { question: 'Where can I practise for the NTHP test?', answer: 'You can take the free MCQsAI IBA Karachi NTHP mock test in English and Mathematics. It is an independent practice test based on the published NTHP syllabus, not an official IBA paper.' },
];

const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="text-xl md:text-2xl font-bold text-foreground mb-3">{children}</h2>
);

const NthpGuide = () => {
  const f = useExamFacts('nthp', FALLBACK);
  const rounds = withRoundStatus(f.programs);

  return (
    <Header>
      <SEOHead
        title="IBA Karachi NTHP 2027-28: Dates, Syllabus, Districts | MCQsAI"
        description="IBA Karachi NTHP: OGDC Fall 2027 apply by 15 Dec 2026, Fall 2028 rounds, eligible districts, test syllabus (English & Maths) and official sample papers."
        keywords="IBA Karachi NTHP, NTHP 2027, NTHP 2028, NTHP last date, NTHP districts, NTHP OGDC, NTHP Mari Energies, NTHP Ihsan Trust Meezan Bank, NTHP sample paper"
        url="https://mcqsai.com/exams/nthp"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })),
          }),
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Admission Tests', path: '/exams' },
          { name: 'IBA Karachi NTHP', path: '/exams/nthp' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <nav className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/exams" className="hover:text-primary">Admission Tests</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">IBA Karachi NTHP</span>
        </nav>

        <header>
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-primary shrink-0" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              IBA Karachi National Talent Hunt Program (NTHP) 2027–2028: Dates, Districts &amp; Test Syllabus
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Facts verified on {f.verifiedOn} from the official IBA Karachi Talent Hunt portal, the NTHP website and the official 2027 cycle flyer.
          </p>
          <JoinAlertsLink placement="nthp" />
        </header>

        <section aria-labelledby="what">
          <H2 id="what">What is IBA Karachi NTHP?</H2>
          <p className="text-muted-foreground leading-relaxed">
            The National Talent Hunt Program (NTHP) is an orientation and aptitude-preparation program run by the Institute of
            Business Administration (IBA) Karachi for students who want to apply to IBA Karachi's undergraduate programs. It is
            not a degree. NTHP candidates get a test-fee exemption for one round of IBA Karachi's undergraduate admission test, and a
            limited number of NTHP scholarships are available for those who pass the IBA Aptitude Test. Each NTHP round is run in
            collaboration with a sponsor — currently OGDC, Mari Energies, and Ihsan Trust with Meezan Bank.
          </p>
        </section>

        <section aria-labelledby="dates">
          <H2 id="dates">NTHP open rounds — dates table</H2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-2.5">Round</th>
                  <th className="p-2.5">Sponsor</th>
                  <th className="p-2.5">Opens</th>
                  <th className="p-2.5">Last date</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Next steps</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <tr key={r.url} className="border-t align-top">
                    <td className="p-2.5 font-medium text-foreground">{r.name}</td>
                    <td className="p-2.5">{r.sponsor}</td>
                    <td className="p-2.5">{r.opens}</td>
                    <td className="p-2.5 font-medium text-foreground">{r.closes}</td>
                    <td className="p-2.5">{r.closed ? 'Applications closed' : 'Open'}</td>
                    <td className="p-2.5 text-muted-foreground">{r.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Fall 2027 OGDC: the printed poster shows "December 15, 2027"; the official portal lists 15 December 2026. Eligibility,
            documents, fee, test dates, centres and class format for these rounds: {CHECK.toLowerCase()}.
          </p>
        </section>

        <section aria-labelledby="districts">
          <H2 id="districts">Fall 2027 OGDC round — eligible districts (as per official poster)</H2>
          <div className="grid sm:grid-cols-2 gap-3">
            {DISTRICTS.map((d) => (
              <Card key={d.province}>
                <CardHeader className="p-3 pb-1"><CardTitle className="text-base">{d.province}</CardTitle></CardHeader>
                <CardContent className="p-3 pt-0">
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {d.list.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-2 text-sm text-foreground">Applicants outside the listed districts are not covered by the Fall 2027 OGDC round.</p>
          <p className="text-sm text-muted-foreground">Districts for the Fall 2028 rounds: {CHECK.toLowerCase()}.</p>
        </section>

        <section aria-labelledby="stages">
          <H2 id="stages">Fall 2028 rounds — two-stage process</H2>
          <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
            <li>Stage 1 pre-application: opened 12 October 2026, deadline 1 February 2027. Selected students notified on 30 March 2027.</li>
            <li>Stage 2 detailed form (selected students only): opens 15 January 2027, deadline 30 April 2027. Final notification on 30 June 2027.</li>
          </ol>
          <p className="mt-2 text-sm text-muted-foreground">The same schedule applies to the Ihsan Trust + Meezan Bank, Mari Energies and OGDC Fall 2028 rounds.</p>
        </section>

        <section aria-labelledby="benefits">
          <H2 id="benefits">Benefits of NTHP</H2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Orientation and preparation for IBA Karachi's undergraduate admission.</li>
            <li>Test-fee exemption for one round of the IBA Karachi admission test.</li>
            <li>A limited number of NTHP scholarships for candidates who pass the IBA Aptitude Test (not guaranteed).</li>
          </ul>
        </section>

        <section aria-labelledby="apply">
          <H2 id="apply">How to apply</H2>
          <p className="text-muted-foreground mb-2">Apply only on the official IBA Karachi Talent Hunt portal, using the page for your round:</p>
          <ul className="space-y-1 text-sm">
            {rounds.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  {r.name} — {r.sponsor} (official portal) <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="syllabus">
          <H2 id="syllabus">NTHP test syllabus (English &amp; Mathematics)</H2>
          <p className="text-xs text-muted-foreground mb-3">
            Per the official IBA NTHP website and official sample papers, verified {f.verifiedOn} —{' '}
            <a href="https://nthp.iba.edu.pk/nthp_test_preparation.php" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">source</a>.
            This is the NTHP assessment test, not the IBA Karachi undergraduate aptitude test.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Shortlisted candidates take an MCQ test based on the Matriculation and HSSC-I curriculum of English Grammar &amp;
            Composition and Mathematics. Based on performance and other criteria, they are further shortlisted for a panel
            interview. Suggested topics are guidance only; the test is not limited to them.
          </p>

          <h3 className="mt-5 font-semibold text-foreground">Pattern in the official sample papers (older batches)</h3>
          <p className="text-xs text-muted-foreground mb-2">Patterns differ between sample papers and may differ from the current test. Check the official announcement for this year.</p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-2.5">Paper</th><th className="p-2.5">Mathematics</th><th className="p-2.5">English</th><th className="p-2.5">Negative marking</th></tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="p-2.5">Batch 2018 sample</td><td className="p-2.5">50 MCQs, 70 min</td><td className="p-2.5">45 MCQs, 50 min</td><td className="p-2.5">No</td></tr>
                <tr className="border-t"><td className="p-2.5">Sample Paper VI</td><td className="p-2.5">45 MCQs, 60 min</td><td className="p-2.5">40 MCQs, 45 min</td><td className="p-2.5">Yes</td></tr>
                <tr className="border-t"><td className="p-2.5">Current test</td><td className="p-2.5" colSpan={3}>{CHECK}</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-5 font-semibold text-foreground">Topics seen in the sample papers</h3>
          <p className="text-sm text-muted-foreground"><strong className="text-foreground">Mathematics:</strong> {MATH_TOPICS}</p>
          <p className="mt-2 text-sm text-muted-foreground"><strong className="text-foreground">English:</strong> {ENGLISH_TOPICS}</p>
          <p className="mt-2 text-sm text-muted-foreground">Sample Paper VI is noticeably harder in English (advanced vocabulary and long passages) than the Batch 2018 sample.</p>
        </section>

        <section aria-labelledby="papers">
          <H2 id="papers">Official NTHP sample papers (published by IBA Karachi, older batches)</H2>
          <ul className="grid sm:grid-cols-2 gap-1 text-sm">
            {SAMPLE_PAPERS.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
                  {s.label} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="previous">
          <H2 id="previous">Previous cycle for reference: NTHP Admissions Cycle 2027 (closed)</H2>
          <p className="text-sm font-medium text-foreground mb-3">
            This is the main NTHP round for IBA Karachi's Fall 2027 admission cycle, which has closed. Eligibility, documents and
            format for the currently open rounds may differ: check the official announcement for each round.
          </p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Sponsors:</strong> Ihsan Trust and Meezan Bank.</p>
            <p><strong className="text-foreground">Eligibility in that cycle:</strong> financially deserving students with 80% or above marks in the SSC-II (Matric) examination from any Board of Secondary Education in Pakistan in 2025.</p>
            <p><strong className="text-foreground">Programme:</strong> 3 weeks of in-person training on the IBA Karachi campus; IBA Aptitude Test preparation; academic coaching and counselling; mock examination; exemption from IBA's undergraduate test fee for Round 1 or Round 2 (any one) of the Fall 2027 cycle.</p>
            <div>
              <strong className="text-foreground">Documents in that cycle:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Matric marksheet</li>
                <li>HSSC-I enrollment / admit card (mandatory)</li>
                <li>Applicant's CNIC or B-Form</li>
                <li>Parent / guardian's CNIC</li>
                <li>Salary slip and income certificate (affidavit not acceptable; business owners attach FBR income tax return)</li>
                <li>Applicant's birth certificate and domicile certificate, or father's domicile certificate</li>
                <li>FBR income tax return (mandatory)</li>
              </ul>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left"><tr><th className="p-2.5">Step (2027 cycle)</th><th className="p-2.5">Date</th><th className="p-2.5">Status</th></tr></thead>
                <tbody>
                  {[
                    ['Stage 1 pre-application', '15 January – 11 March 2026'],
                    ['Selected students emailed', '30 March 2026'],
                    ['Stage 2 detailed form with documents — deadline', '30 April 2026'],
                    ['Final notification', '30 June 2026'],
                    ['Physical classes', 'Mid-July 2026'],
                  ].map(([a, b]) => (
                    <tr key={a} className="border-t"><td className="p-2.5">{a}</td><td className="p-2.5">{b}</td><td className="p-2.5">Closed</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p><strong className="text-foreground">Official disclaimer:</strong> NTHP does not guarantee an NTHP scholarship or financial assistance. A limited number of scholarships are available for candidates who pass the IBA Aptitude Test after the orientation. IBA may change policies at its discretion.</p>
            <div>
              <strong className="text-foreground">IBA Karachi undergraduate programs listed on the flyer:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>School of Business Sciences: BBA, BS Accounting and Finance, BS Business Analytics</li>
                <li>School of Economics &amp; Social Sciences: BS Economics, BS Economics and Mathematics, BS Social Sciences and Liberal Arts</li>
                <li>School of Mathematics &amp; Computer Science: BS Computer Science, BS Mathematics</li>
              </ul>
            </div>
            <p>Contact: <a href="mailto:nthp@iba.edu.pk" className="text-primary hover:underline">nthp@iba.edu.pk</a></p>
          </div>
        </section>

        <section aria-labelledby="practice">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-2">
              <H2 id="practice">Practise for the NTHP test</H2>
              <p className="text-sm text-muted-foreground">Independent practice test based on the published NTHP syllabus, not an official IBA paper.</p>
              <Button asChild>
                <Link to={MOCK}>Practice NTHP mock test <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
              <p className="text-sm"><Link to={BLOG} className="text-primary hover:underline">Read our IBA Karachi &amp; OGDC NTHP 2027 article</Link></p>
            </CardContent>
          </Card>
        </section>

        <div role="note" className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
          Not to be confused with Sukkur IBA STHP: the Sindh Talent Hunt Program is a different program run by Sukkur IBA University.{' '}
          <Link to="/exams/sthp" className="font-medium text-primary hover:underline">Sukkur IBA STHP guide</Link>
        </div>

        <section aria-labelledby="faqs">
          <H2 id="faqs">IBA Karachi NTHP — frequently asked questions</H2>
          <div className="space-y-4">
            {FAQS.map((q) => (
              <article key={q.question}>
                <h3 className="font-semibold text-foreground">{q.question}</h3>
                <p className="text-sm text-muted-foreground mt-1">{q.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="sources">
          <H2 id="sources">Official sources</H2>
          <ul className="space-y-1 text-sm">
            <li><a href="https://talenthunt.iba.edu.pk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">IBA Karachi Talent Hunt portal — talenthunt.iba.edu.pk</a></li>
            <li><a href="https://nthp.iba.edu.pk/nthp_test_preparation.php" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">IBA Karachi NTHP website — test preparation</a></li>
            <li><a href="https://www.iba.edu.pk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">IBA Karachi — iba.edu.pk</a></li>
          </ul>
          <p className="mt-3 text-sm"><Link to="/exams" className="text-primary hover:underline">All admission tests in Pakistan</Link></p>
        </section>

        <p className="text-xs text-muted-foreground border-t pt-4">
          MCQsAI is an independent practice platform, not affiliated with IBA Karachi, Sukkur IBA University, OGDC, Mari Energies, Ihsan Trust or Meezan Bank.
        </p>
      </div>
      <Footer />
    </Header>
  );
};

export default NthpGuide;
