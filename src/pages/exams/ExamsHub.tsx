import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { safeJsonLd } from '@/lib/jsonLd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Stethoscope,
  Cpu,
  Scale,
  Building2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ExamEntry {
  name: string;
  description: string;
  path: string;
  /** Optional link to an existing mock test page for this exam. */
  mockPath?: string;
  mockLabel?: string;
}

interface ExamGroup {
  title: string;
  blurb: string;
  icon: typeof GraduationCap;
  items: ExamEntry[];
}

const GROUPS: ExamGroup[] = [
  {
    title: 'Medical Admission Tests',
    blurb: 'MBBS and BDS admission testing across Pakistan, including the provincial MDCAT patterns.',
    icon: Stethoscope,
    items: [
      {
        name: 'MDCAT',
        description:
          'Medical and Dental College Admission Test — Biology, Chemistry, Physics and English, conducted for MBBS/BDS admissions.',
        path: '/exams/mdcat',
        mockPath: '/mdcat-syllabus',
        mockLabel: 'Syllabus & weightage',
      },
      {
        name: 'MDCAT Past Papers',
        description: 'Paper pattern, marks distribution and past-paper style practice for MDCAT candidates.',
        path: '/mdcat-past-papers',
      },
    ],
  },
  {
    title: 'Engineering Admission Tests',
    blurb: 'Entry tests for engineering and technology programmes at public and private universities.',
    icon: Cpu,
    items: [
      {
        name: 'ECAT',
        description:
          'Engineering College Admission Test — Mathematics, Physics, Chemistry and English for engineering admissions.',
        path: '/exams/ecat',
        mockPath: '/ecat-preparation',
        mockLabel: 'ECAT preparation',
      },
      {
        name: 'NUST Entry Test (NET)',
        description: 'NUST NET pattern practice across Maths, Physics, Chemistry, English and intelligence sections.',
        path: '/nust-entry-test',
      },
      {
        name: 'COMSATS Entry Test',
        description: 'COMSATS NTS-style admission test practice for engineering, CS and business programmes.',
        path: '/comsats-entry-test',
      },
      {
        name: 'Engineering Universities Entry Tests',
        description: 'Combined coverage of UET, GIKI, PIEAS and other engineering university admission tests.',
        path: '/engineering-universities-entry-test',
      },
    ],
  },
  {
    title: 'University & Aptitude Tests',
    blurb: 'University-specific and testing-service aptitude papers used for undergraduate and graduate entry.',
    icon: GraduationCap,
    items: [
      {
        name: 'NTS (NAT & GAT)',
        description:
          'National Testing Service papers — quantitative, analytical and verbal reasoning plus subject knowledge.',
        path: '/exams/nts',
        mockPath: '/mock-tests',
        mockLabel: 'Browse mock tests',
      },
      {
        name: 'Punjab University Entry Test',
        description: 'PU admission test practice — English, General Knowledge, Science and Social Sciences MCQs.',
        path: '/punjab-university-entry-test',
      },
      {
        name: 'Sindh Universities Entry Test',
        description: 'IBA Sukkur, MUET, LUMHS, University of Sindh and Mehran UET admission test preparation.',
        path: '/sindh-universities-entry-test',
      },
      {
        name: 'HEC USAT',
        description: 'Undergraduate Studies Admission Test used by several HEC-affiliated universities for undergraduate entry.',
        path: '/exams/usat',
      },
      {
        name: 'HEC GAT Subject',
        description: 'Graduate Assessment Test (Subject) for MS/MPhil and PhD admissions at Pakistani universities.',
        path: '/exams/hec-gat-subject',
      },
    ],
  },
  {
    title: 'University Admission Guides',
    blurb:
      'Individual university entry test guides — pattern, eligibility, subjects and preparation notes for each institution.',
    icon: Building2,
    items: [
      {
        name: 'Sukkur IBA University Entry Test',
        description: 'Entry test guide for undergraduate admissions at Sukkur IBA University.',
        path: '/exams/iba-sukkur',
      },
      {
        name: 'Sukkur IBA STHP',
        description:
          'Sindh Talent Hunt Program guide — eligibility, test pattern and free full-length mock test practice.',
        path: '/exams/sthp',
        mockPath: '/mock-tests/sukkur-iba-sindh-talent-hunt-program-sthp-2027',
        mockLabel: 'STHP mock test',
      },
      {
        name: 'IBA Karachi NTHP 2027–28',
        description:
          'IBA Karachi National Talent Hunt Program — round dates, eligible districts, NTHP test syllabus and official sample papers.',
        path: '/exams/nthp',
        mockPath: '/mock-tests/iba-karachi-nthp-mock-test-2027-english-mathematics-practice',
        mockLabel: 'NTHP mock test',
      },
      {
        name: 'LUMS Admission Test',
        description: 'LUMS undergraduate admission assessment — pattern, eligibility and preparation guidance.',
        path: '/exams/lums',
      },
      {
        name: 'Aga Khan University (AKU)',
        description: 'AKU admission test guide for medical and nursing programme applicants.',
        path: '/exams/aku',
      },
      {
        name: 'GIKI Entry Test',
        description: 'Ghulam Ishaq Khan Institute engineering admission test pattern and subject breakdown.',
        path: '/exams/giki',
      },
      {
        name: 'UET Lahore Admission',
        description: 'UET Lahore engineering admission route, merit basis and ECAT-linked preparation.',
        path: '/exams/uet-lahore',
      },
      {
        name: 'NUMS Entry Test',
        description: 'National University of Medical Sciences admission test guide for MBBS/BDS applicants.',
        path: '/exams/nums',
      },
      {
        name: 'PIEAS Entry Test',
        description: 'PIEAS engineering and applied sciences admission test pattern and preparation notes.',
        path: '/exams/pieas',
      },
      {
        name: 'Air University Entry Test',
        description: 'Air University admission test guide for engineering, computing and business programmes.',
        path: '/exams/air-university',
      },
      {
        name: 'University of Karachi',
        description: 'Karachi University admission test guide covering eligibility and subject coverage.',
        path: '/exams/karachi-university',
      },
      {
        name: 'University of Sindh',
        description: 'University of Sindh Jamshoro admission test guide — pattern, eligibility and practice.',
        path: '/exams/sindh-university',
      },
      {
        name: 'NTS NAT',
        description: 'National Aptitude Test guide for undergraduate admissions at NTS-affiliated universities.',
        path: '/exams/nat',
      },
    ],
  },

  {
    title: 'Law Admission Test',
    blurb: 'The HEC-mandated law admission test required before LLB enrolment.',
    icon: Scale,
    items: [
      {
        name: 'HEC LAT',
        description:
          'Law Admission Test practice covering English, Pakistan Studies, Islamic Studies, basic mathematics and general knowledge.',
        path: '/exams/lat',
        mockPath: '/mock-tests',
        mockLabel: 'Find the LAT mock test',

      },
    ],
  },
  {
    title: 'Competitive & Public Service Exams',
    blurb: 'Commission exams taken after graduation for federal and provincial service posts.',
    icon: Building2,
    items: [
      {
        name: 'CSS',
        description: 'Central Superior Services examination — compulsory papers plus optional subject groups.',
        path: '/exams/css',
      },
      {
        name: 'PMS',
        description: 'Provincial Management Service examination for BS-17 provincial management posts.',
        path: '/exams/pms',
      },
      {
        name: 'PPSC',
        description: 'Punjab Public Service Commission screening tests for provincial government posts.',
        path: '/exams/ppsc',
      },
      {
        name: 'FPSC',
        description: 'Federal Public Service Commission tests for federal government recruitment.',
        path: '/exams/fpsc',
      },
      {
        name: 'STS (SIBA Testing Services)',
        description:
          'Tests conducted by SIBA Testing Services, the testing service of Sukkur IBA University, for Sindh Police, Sindh High Court and the Sukkur IBA Community Colleges & Schools network.',
        path: '/exams/sts',
        mockPath: '/exams/sts',
        mockLabel: 'Browse STS mock tests',
      },
      {
        name: 'Forces Jobs Tests',
        description: 'Initial tests for Pakistan Army, Navy and Air Force recruitment.',
        path: '/forces-jobs-tests',
      },
    ],
  },
];

const ExamsHub = () => {
  const allItems = GROUPS.flatMap((g) => g.items);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Admission & Competitive Exams in Pakistan',
    description:
      'Directory of admission and competitive exam preparation pages on MCQsAI — MDCAT, ECAT, NTS, HEC LAT, CSS, PMS, PPSC and FPSC.',
    numberOfItems: allItems.length,
    itemListElement: allItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: `https://mcqsai.com${item.path}`,
      description: item.description,
    })),
  };

  return (
    <Header>
      <SEOHead
        title="All Exams in Pakistan 2026 — Admission & Competitive Test Prep"
        description="Every exam we cover in one place: MDCAT, ECAT, NUST NET, NTS NAT/GAT, HEC LAT, CSS, PMS, PPSC and FPSC. Free MCQ practice and syllabus guides for Pakistani students."
        keywords="admission tests Pakistan, entry test preparation, MDCAT, ECAT, NTS, HEC LAT, CSS, PPSC, FPSC, PMS, exam list Pakistan"
        url="https://mcqsai.com/exams"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Exams', path: '/exams' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Exams</span>
        </nav>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Exams in Pakistan — Admission & Competitive Test Preparation
            </h1>
          </div>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-3xl">
            Pick your exam to see its pattern, eligibility, subject breakdown and preparation tips, then practise
            free MCQs with AI-generated tests. Coverage spans medical and engineering admission tests, university
            aptitude papers, the HEC law admission test, and federal and provincial commission exams.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/mock-tests">
                <ArrowRight className="w-4 h-4 mr-2" />
                Take a mock test
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/custom-syllabus">Build a custom syllabus</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-10">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <div className="flex items-center gap-2 mb-2">
                <group.icon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">{group.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{group.blurb}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {group.items.map((item) => (
                  <Card key={item.name + item.path} className="h-full">
                    <CardContent className="pt-5 pb-4 flex flex-col h-full">
                      <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{item.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
                          to={item.path}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline min-h-[44px]"
                        >
                          Open {item.name}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        {item.mockPath && (
                          <Link
                            to={item.mockPath}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary min-h-[44px]"
                          >
                            {item.mockLabel || 'Mock test'}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        <RelatedContent entitySlug="exams" title="Continue Preparing" />
      </div>
      <Footer />
    </Header>
  );
};

export default ExamsHub;
