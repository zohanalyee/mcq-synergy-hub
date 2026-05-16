import SEOHead from '@/components/SEOHead';
import { Link } from 'react-router-dom';

const sections = [
  {
    subject: 'Compulsory Subjects',
    headingClass: 'text-purple-700',
    cardHover: 'hover:bg-purple-50',
    linkClass: 'text-purple-600',
    topics: ['English Essay', 'English Precis', 'General Science', 'Current Affairs', 'Pakistan Affairs', 'Islamic Studies', 'Every Day Science', 'Urdu']
  },
  {
    subject: 'Optional — Social Sciences',
    headingClass: 'text-blue-700',
    cardHover: 'hover:bg-blue-50',
    linkClass: 'text-blue-600',
    topics: ['Political Science', 'International Relations', 'Sociology', 'History', 'Economics', 'Public Administration']
  },
  {
    subject: 'Optional — Sciences',
    headingClass: 'text-green-700',
    cardHover: 'hover:bg-green-50',
    linkClass: 'text-green-600',
    topics: ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Statistics', 'Environmental Science']
  },
];

const CSSMCQs = () => (
  <>
    <SEOHead
      title="CSS MCQs Practice Online Free | CSS Exam Preparation | MCQsAI"
      description="Free CSS exam MCQs online. Central Superior Services preparation — General Knowledge, Current Affairs, English, Pakistan Affairs, Islamic Studies MCQs."
      keywords="CSS MCQs, CSS exam preparation, CSS past papers MCQs, Central Superior Services MCQs, CSS test Pakistan"
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">
        CSS MCQs Practice — Free Online
      </h1>
      <p className="text-muted-foreground mb-8">
        Central Superior Services (CSS) exam preparation with comprehensive MCQs. All compulsory and optional subjects covered.
      </p>

      {sections.map(section => (
        <section key={section.subject} className="mb-8">
          <h2 className={`text-xl font-semibold mb-3 ${section.headingClass}`}>
            {section.subject}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {section.topics.map(topic => (
              <Link key={topic} to="/exams/css"
                className={`p-3 border rounded-lg ${section.cardHover} text-center`}>
                <p className="text-sm font-medium">{topic}</p>
                <p className={`text-xs ${section.linkClass} mt-1`}>Practice →</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start CSS Preparation Free</h2>
        <p className="opacity-90 mb-4">AI-powered CSS MCQs. Thousands of questions. No signup needed.</p>
        <Link to="/exams/css"
          className="bg-white text-purple-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice CSS MCQs →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'FPSC Past Papers', url: '/fpsc-past-papers' },
            { label: 'PMS Preparation', url: '/exams/pms' },
            { label: 'Current Affairs MCQs', url: '/exams/css' },
            { label: 'Pakistan Affairs', url: '/exams/fpsc' },
            { label: 'General Knowledge', url: '/exams/nts' },
          ].map(link => (
            <Link key={link.url} to={link.url}
              className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default CSSMCQs;
