import SEOHead from '@/components/SEOHead';
import { Link } from 'react-router-dom';

const sections = [
  {
    subject: 'General Knowledge',
    headingClass: 'text-purple-700',
    cardHover: 'hover:bg-purple-50',
    linkClass: 'text-purple-600',
    topics: ['Pakistan History', 'Geography', 'Current Affairs', 'Islamic Studies', 'World GK', 'Science & Tech']
  },
  {
    subject: 'English',
    headingClass: 'text-blue-700',
    cardHover: 'hover:bg-blue-50',
    linkClass: 'text-blue-600',
    topics: ['Grammar', 'Vocabulary', 'Sentence Correction', 'Comprehension', 'Synonyms', 'Antonyms']
  },
  {
    subject: 'Pakistan Studies',
    headingClass: 'text-green-700',
    cardHover: 'hover:bg-green-50',
    linkClass: 'text-green-600',
    topics: ['Pakistan History', 'Constitution', 'Geography', 'Economy', 'Foreign Policy', 'Current Affairs']
  },
  {
    subject: 'Mathematics',
    headingClass: 'text-orange-700',
    cardHover: 'hover:bg-orange-50',
    linkClass: 'text-orange-600',
    topics: ['Basic Arithmetic', 'Algebra', 'Geometry', 'Percentage', 'Ratio', 'Profit & Loss']
  },
];

const PPSCPastPapers = () => (
  <>
    <SEOHead
      title="PPSC Past Papers MCQs | Free Online Practice | MCQsAI Pakistan"
      description="Solve PPSC past papers MCQs online free. Punjab Public Service Commission previous year papers with answers for all posts. General Knowledge, English, Pakistan Studies."
      keywords="PPSC past papers, PPSC MCQs, PPSC test preparation, Punjab Public Service Commission papers, PPSC past papers with answers"
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">
        PPSC Past Papers — Free MCQ Practice
      </h1>
      <p className="text-muted-foreground mb-8">
        Punjab Public Service Commission past papers with answers. Practice for all PPSC posts.
      </p>

      {sections.map(section => (
        <section key={section.subject} className="mb-8">
          <h2 className={`text-xl font-semibold mb-3 ${section.headingClass}`}>
            {section.subject} MCQs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {section.topics.map(topic => (
              <Link key={topic} to="/exams/ppsc"
                className={`p-3 border rounded-lg ${section.cardHover} text-center`}>
                <p className="text-sm font-medium">{topic}</p>
                <p className={`text-xs ${section.linkClass} mt-1`}>Practice →</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice PPSC MCQs Free</h2>
        <p className="opacity-90 mb-4">AI-powered PPSC preparation. 1000+ MCQs. No signup needed.</p>
        <Link to="/exams/ppsc"
          className="bg-white text-blue-700 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 inline-block">
          Start Practice →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'FPSC Past Papers', url: '/fpsc-past-papers' },
            { label: 'NTS MCQs', url: '/exams/nts' },
            { label: 'CSS MCQs', url: '/css-mcqs-practice' },
            { label: 'SPSC Past Papers', url: '/exams/spsc' },
            { label: 'General Knowledge MCQs', url: '/exams/ppsc' },
          ].map(link => (
            <Link key={link.url} to={link.url}
              className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-blue-50 text-blue-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default PPSCPastPapers;
