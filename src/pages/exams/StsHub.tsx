import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JoinAlertsLink from '@/components/JoinAlertsLink';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { safeJsonLd } from '@/lib/jsonLd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import stsSyllabus from '@/generated/stsSyllabus.json';
import { ArrowRight, BookOpen, ExternalLink, GraduationCap, Lightbulb, ShieldCheck, Timer } from 'lucide-react';

/**
 * STS (SIBA Testing Services) Test Preparation hub.
 * Links every existing STS-conducted mock test. No invented facts: dates, fees,
 * negative marking and passing marks differ per advertisement, so the page
 * points to the official STS announcement instead of stating figures.
 */
type T = [label: string, slug: string];
const S = (l: string) => l.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const list = (labels: string[]): T[] => labels.map((l) => [l, S(l)]);

const GROUPS: { title: string; note: string; tests: T[] }[] = [
  {
    title: 'Sindh High Court & District Courts',
    note: 'Court posts tested by STS for the High Court of Sindh and district courts.',
    tests: [
      ['Junior Office Associate (BPS-13)', 'junior-office-associate-bps-13'],
      ['Security Officer (BPS-17) – High Court of Sindh', 'security-officer-bps-17-bps-17-high-court-of-sindh'],
      ['Personal Assistant to Judge (BPS-17)', 'personal-assistant-to-judge-personal-assistant-to-officer-bps-17-high-court-of-sindh'],
      ['Private Secretary (Protocol) (BPS-18)', 'private-secretary-protocol-bps-18-high-court-of-sindh'],
      ['Assistant Accountant (BPS-15)', 'assistant-accountant-bps-15'],
      ['Junior Translator (BPS-15)', 'junior-translator-bps-15'],
      ['Caretaker (BPS-14)', 'caretaker-bps-14'],
      ['Telephone Operator (BPS-14)', 'telephone-operator-bps-14'],
      ['Library Associate (BPS-13)', 'library-associate-bps-13'],
      ['Junior Clerk (BPS-11) – STS', 'junior-clerk-bps-11-siba-testing-services-sts'],
    ],
  },
  {
    title: 'Sindh Police & SSU',
    note: 'Police and support posts tested by STS.',
    tests: [
      ['Police Constable (Commandos) & Driver Constable (BPS-07)', 'police-constable-commandos-driver-police-constable-bps-07'],
      ['Junior Clerk (BPS-11)', 'junior-clerk-bps-11-sts'],
      ['Electrician (BPS-06)', 'electrician-bps-06'],
    ],
  },
  {
    title: 'Sukkur IBA Community Colleges & Schools – Teaching',
    note: 'EST, HST, Subject Specialist and ECE teaching posts.',
    tests: [
      ...list(['Elementary School Teacher - Biology', 'Elementary School Teacher - Chemistry', 'Elementary School Teacher - Computer', 'Elementary School Teacher - English', 'Elementary School Teacher - Islamiat', 'Elementary School Teacher - Mathematics', 'Elementary School Teacher - Physics', 'Elementary School Teacher - Science', 'Elementary School Teacher - Sindhi', 'Elementary School Teacher - Social Studies', 'Elementary School Teacher - Urdu']),
      ...list(['HST - Biology', 'HST - Chemistry', 'HST - Computer', 'HST - English', 'HST - Physics']),
      ...list(['Subject Specialist - Biology', 'Subject Specialist - Business Administration', 'Subject Specialist - Chemistry', 'Subject Specialist - Computer', 'Subject Specialist - English', 'Subject Specialist - General Science', 'Subject Specialist - Islamiat', 'Subject Specialist - Mathematics', 'Subject Specialist - Pakistan Studies', 'Subject Specialist - Physics', 'Subject Specialist - Sindhi', 'Subject Specialist - Urdu']),
      ['ECE Teacher (Female)', 'ece-female'],
      ['Physical Training Instructor', 'physical-training-instructor'],
    ],
  },
  {
    title: 'Sukkur IBA Community Colleges & Schools – Admin & Support',
    note: 'Management, accounts, office, lab and library posts.',
    tests: list(['School Manager', 'Academic Coordinator', 'District Coordinator', 'Administrative Officer', 'Administrative & Accounts Officer', 'Accounts Officer', 'Accountant', 'Auditor', 'Procurement Officer', 'Admission & Examination Officer', 'Office Assistant', 'Office Assistant (Admission & Examination)', 'Office Assistant (P.A Cum Computer Operator)', 'Receptionist (Female)', 'Assistant Hostel Warden (Male)', 'Assistant Hostel Warden (Female)', 'Lab Assistant - Biology', 'Lab Assistant - Chemistry', 'Lab Assistant - Computer', 'Lab Assistant - Electrical / Electronics', 'Lab Assistant - Physics', 'Library Assistant', 'Nurse - Male / Female']),
  },
  {
    title: 'Licensing, Admission & Talent Programs',
    note: 'Teaching licence, nursing entrance and the Sukkur IBA talent hunt.',
    tests: [
      ['Sindh Teaching License – EST', 'sindh-teaching-license-exam-elementary-school-teacher-est'],
      ['Sindh Teaching License – SST', 'sindh-teaching-license-exam-secondary-school-teacher-sst'],
      ['BSc Nursing 4-Year Generic Entrance (STS)', 'bsc-nursing-4-years-generic-program-entrance-exam-sts'],
      ['Sukkur IBA STHP 2027', 'sukkur-iba-sindh-talent-hunt-program-sthp-2027'],
    ],
  },
];

type SyllabusItem = { topic: string; percentage: number | null };
const SYLLABUS = stsSyllabus as Record<string, SyllabusItem[]>;
/** Hub-level verification date (owner-confirmed). Set as 'D Month YYYY'; line hidden while null. */
const SYLLABUS_VERIFIED_ON: string | null = null;

const TOTAL = GROUPS.reduce((n, g) => n + g.tests.length, 0);

const FAQS = [
  { question: 'What is STS and how is it related to Sukkur IBA University?', answer: 'Sukkur IBA University is the parent institution. STS (SIBA Testing Services) is its testing service and conducts recruitment and admission screening tests. The Sukkur IBA Community Colleges & Schools network — 20+ colleges and schools along with 50+ cluster schools — operates separately under the same university, and STS conducts its recruitment tests too.' },
  { question: 'Does the STS test have negative marking?', answer: 'It depends on the advertisement. Some STS tests state negative marking and some do not, so read the official advertisement and roll number slip for your post. This page does not publish a single figure.' },
  { question: 'What are the passing marks in an STS test?', answer: 'Passing marks are set per post and are given in the official STS advertisement. Check the official STS website for your test.' },
  { question: 'Where do I apply and download my STS roll number slip?', answer: 'Applications and roll number slips are handled on the official STS portal, apply.sts.net.pk. Always confirm dates there.' },
  { question: 'How can I practise STS tests for free?', answer: `MCQsAI has ${TOTAL} free timed STS-style mock tests on this page, grouped by department. Each test shows solved preview MCQs and follows the subject weightage stored for that post.` },
];

const StsHub = () => {
  const url = 'https://mcqsai.com/exams/sts';
  return (
    <Header>
      <SEOHead
        title="STS Test Preparation 2026-27 – Syllabus & Mock Tests | MCQsAI"
        description="STS syllabus and free mock tests for IBA Community Colleges & Schools, Sindh High Court, Sindh Police and STEDA posts. Practice MCQs by post."
        keywords="STS test preparation, SIBA Testing Services mock test, STS past papers, STS test syllabus, Sukkur IBA community colleges test, junior office associate mock test, STS police constable test, EST HST STS test"
        url={url}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'STS Test Preparation Hub', url,
        provider: { '@type': 'Organization', name: 'MCQsAI', url: 'https://mcqsai.com' },
        mainEntity: { '@type': 'ItemList', numberOfItems: TOTAL, itemListElement: GROUPS.flatMap((g) => g.tests).map(([name, slug], i) => ({ '@type': 'ListItem', position: i + 1, name, url: `https://mcqsai.com/mock-tests/${slug}` })) },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
      }) }} />
      <BreadcrumbSchema items={[{ name: 'Home', path: '/' }, { name: 'Admission Tests', path: '/exams' }, { name: 'STS Test Preparation', path: '/exams/sts' }]} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link><span className="mx-2">/</span>
          <Link to="/exams" className="hover:text-primary">Admission Tests</Link><span className="mx-2">/</span>
          <span className="text-foreground">STS Test Preparation</span>
        </nav>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">SIBA Testing Services (STS) Test Preparation – Syllabus &amp; Mock Tests</h1>
          </div>
          <JoinAlertsLink placement="sts" />
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            SIBA Testing Services (STS) is the testing service of Sukkur IBA University. It conducts recruitment and screening tests for Sindh government bodies such as the Sindh High Court and Sindh Police, and for the Sukkur IBA Community Colleges &amp; Schools network, which operates separately under the same university.
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-3xl mt-3">
            Every free STS-style mock test on MCQsAI is in one place — {TOTAL} timed tests for courts, police, the schools network, teaching licence and admission tests. Pick your post, practise under a real countdown, and check the official STS announcement for dates, fees and rules.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {[`${TOTAL} free mock tests`, 'Timed like the real test', 'Solved preview MCQs'].map((t) => (
              <span key={t} className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">{t}</span>
            ))}
          </div>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-3">Most practised STS tests</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {([
            ['Junior Office Associate (BPS-13)', '/mock-tests/junior-office-associate-bps-13'],
            ['Police Constable & Driver (BPS-07)', '/mock-tests/police-constable-commandos-driver-police-constable-bps-07'],
            ['EST Mathematics', '/mock-tests/elementary-school-teacher-mathematics'],
            ['Sukkur IBA STHP 2027 guide', '/exams/sthp'],
          ] as const).map(([l, to]) => (
            <Link key={to} to={to} className="group rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors">
              <Timer className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">{l}</p>
              <span className="text-xs text-primary inline-flex items-center gap-1 mt-1">Start practice <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span>
            </Link>
          ))}
        </div>

        <div className="space-y-6 mb-10">
          {GROUPS.map((g) => (
            <Card key={g.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-primary" />{g.title}
                  <span className="text-xs font-normal text-muted-foreground">({g.tests.length})</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{g.note}</p>
              </CardHeader>
              <CardContent>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {g.tests.map(([label, slug]) => (
                    <li key={slug}>
                      <Link to={`/mock-tests/${slug}`} className="block text-sm p-2.5 rounded-lg bg-muted/50 text-foreground hover:text-primary transition-colors">
                        {label} Mock Test
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mb-10" aria-labelledby="sts-syllabus-by-cadre">
          <h2 id="sts-syllabus-by-cadre" className="text-xl font-semibold text-foreground mb-1">Syllabus by cadre</h2>
          <p className="text-sm text-muted-foreground mb-1">Syllabus as per STS announcement. Subjects and weightage for each post, as stored for its mock test.</p>
          {SYLLABUS_VERIFIED_ON && <p className="text-sm font-medium text-foreground mb-1">Syllabus verified on {SYLLABUS_VERIFIED_ON}</p>}
          <p className="text-xs text-muted-foreground mb-4">Test dates, fees, negative marking and passing marks: check the STS portal at <a href="https://sts.net.pk" target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">sts.net.pk</a>.</p>
          <div className="space-y-6">
            {GROUPS.map((g) => (
              <Card key={`syl-${g.title}`}>
                <CardHeader><CardTitle className="text-lg">{g.title} – Syllabus</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-3">
                  {g.tests.filter(([, slug]) => SYLLABUS[slug]?.length).map(([label, slug]) => (
                    <div key={slug} className="p-3 rounded-lg bg-muted/50">
                      <h3 className="text-sm font-semibold text-foreground mb-1.5">{label}</h3>
                      <ul className="text-sm text-muted-foreground space-y-0.5 mb-2">
                        {SYLLABUS[slug].map((i) => (
                          <li key={i.topic}>{i.topic}{i.percentage != null ? ` – ${i.percentage}%` : ''}</li>
                        ))}
                      </ul>
                      <Link to={`/mock-tests/${slug}`} className="text-xs text-primary hover:underline inline-flex items-center gap-1">Practice {label} mock test <ArrowRight className="w-3 h-3" /></Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="w-5 h-5 text-primary" />Paper pattern</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>STS papers are MCQ-based. The subjects and their weightage are set separately for each post in its official advertisement — commonly English, General Knowledge / Pakistan Affairs, Islamiat, Mathematics or analytical reasoning, and a post-specific subject portion.</p>
              <p className="font-medium text-foreground">Syllabus as per STS announcement — see “Syllabus by cadre” above. Source: <a href="https://sts.net.pk" target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">sts.net.pk</a>.</p>
              <p>Each MCQsAI mock test uses the subject weightage stored for that post. Test dates, fees, negative marking and passing marks: check the official STS announcement.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="w-5 h-5 text-primary" />Preparation tips</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
                <li>Download your advertisement and note the subject list for your post.</li>
                <li>Take one full timed mock test first to find weak subjects.</li>
                <li>Revise weak topics, then retake the test under the countdown.</li>
                <li>If your advertisement mentions negative marking, avoid blind guessing.</li>
                <li>Confirm the test date and centre on your roll number slip.</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-3">Frequently asked questions</h2>
        <div className="space-y-3 mb-10">
          {FAQS.map((f) => (
            <Card key={f.question}><CardContent className="pt-4">
              <h3 className="font-semibold text-foreground text-base mb-1">{f.question}</h3>
              <p className="text-sm text-muted-foreground">{f.answer}</p>
            </CardContent></Card>
          ))}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 flex flex-wrap gap-3 items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Official sources:{' '}
              <span className="block mb-2">MCQsAI is an independent practice platform and is not affiliated with STS or Sukkur IBA University.</span>
              <a href="https://www.sts.net.pk" target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline inline-flex items-center gap-1">STS website <ExternalLink className="w-3 h-3" /></a>{' · '}
              <a href="https://apply.sts.net.pk" target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline inline-flex items-center gap-1">apply.sts.net.pk <ExternalLink className="w-3 h-3" /></a>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline"><Link to="/exams/iba-sukkur">Sukkur IBA admission test</Link></Button>
              <Button asChild><Link to="/mock-tests">All mock tests</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </Header>
  );
};

export default StsHub;
