import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import { Link } from 'react-router-dom';

const sections = [
  {
    subject: 'General Knowledge & Current Affairs',
    headingClass: 'text-purple-700',
    cardHover: 'hover:bg-purple-50',
    linkClass: 'text-purple-600',
    topics: ['Pakistan Affairs', 'World Affairs', 'Science', 'Technology', 'Sports', 'Current Events']
  },
  {
    subject: 'English Language',
    headingClass: 'text-blue-700',
    cardHover: 'hover:bg-blue-50',
    linkClass: 'text-blue-600',
    topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Essay Writing', 'Precis', 'Translation']
  },
  {
    subject: 'Pakistan Studies & Islamiat',
    headingClass: 'text-green-700',
    cardHover: 'hover:bg-green-50',
    linkClass: 'text-green-600',
    topics: ['Pakistan History', 'Quran', 'Hadith', 'Islamic History', 'Constitution', 'Ideology']
  },
  {
    subject: 'Quantitative Reasoning',
    headingClass: 'text-orange-700',
    cardHover: 'hover:bg-orange-50',
    linkClass: 'text-orange-600',
    topics: ['Arithmetic', 'Algebra', 'Statistics', 'Data Interpretation', 'Logical Reasoning', 'Analytical']
  },
];

const FPSCPastPapers = () => (
  <>
    <SEOHead
      title="FPSC Past Papers MCQs | Federal PSC Test Prep | MCQsAI Pakistan"
      description="FPSC past papers MCQs online free. Federal Public Service Commission previous papers for CSS, Inspectors, Assistants. General Knowledge, English, Pakistan Studies."
      keywords="FPSC past papers, FPSC MCQs, Federal Public Service Commission papers, FPSC test preparation, FPSC past papers with answers"
    />
    <ExamPageSchema
      name="FPSC Past Papers Practice"
      description="Free FPSC past papers practice MCQs — General Knowledge, English, Pakistan Studies, Islamiat, Quantitative Reasoning."
      url="https://mcqsai.com/fpsc-past-papers"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: "FPSC Past Papers", url: "https://mcqsai.com/fpsc-past-papers" },
      ]}
      faqs={[
        { question: "What does FPSC test cover?", answer: "FPSC tests typically cover GK, English, Pakistan Studies, Islamiat and quantitative reasoning." },
        { question: "Is FPSC past paper practice free?", answer: "Yes, completely free on MCQsAI." },
        { question: "Are explanations included?", answer: "Yes, every MCQ includes a detailed explanation." },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">
        FPSC Past Papers — Free MCQ Practice
      </h1>
      <p className="text-muted-foreground mb-8">
        Federal Public Service Commission past papers for all posts. Practice with AI-powered MCQs.
      </p>

      {sections.map(section => (
        <section key={section.subject} className="mb-8">
          <h2 className={`text-xl font-semibold mb-3 ${section.headingClass}`}>
            {section.subject}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {section.topics.map(topic => (
              <Link key={topic} to="/exams/fpsc"
                className={`p-3 border rounded-lg ${section.cardHover} text-center`}>
                <p className="text-sm font-medium">{topic}</p>
                <p className={`text-xs ${section.linkClass} mt-1`}>Practice →</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice FPSC MCQs Free</h2>
        <p className="opacity-90 mb-4">Federal PSC preparation with AI-powered MCQs. No signup needed.</p>
        <Link to="/exams/fpsc"
          className="bg-white text-green-700 px-8 py-3 rounded-full font-semibold inline-block">
          Start Practice →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'PPSC Past Papers', url: '/ppsc-past-papers' },
            { label: 'CSS MCQs Practice', url: '/css-mcqs-practice' },
            { label: 'NTS Test Prep', url: '/exams/nts' },
            { label: 'General Knowledge', url: '/exams/fpsc' },
            { label: 'PMS Preparation', url: '/exams/pms' },
          ].map(link => (
            <Link key={link.url} to={link.url}
              className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-green-50 text-green-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default FPSCPastPapers;
