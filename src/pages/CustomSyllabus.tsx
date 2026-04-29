import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { SyllabusBuilder } from "@/components/syllabus-builder/SyllabusBuilder";
import SEOHead from '@/components/SEOHead';
import TypewriterText from '@/components/TypewriterText';
import { ListChecks } from 'lucide-react';

const CustomSyllabus = () => {
  return (
    <Header>
      <SEOHead
        title="Custom Test Syllabus Builder"
        description="Build your own custom test syllabus by selecting specific subjects, topics, and difficulty levels for targeted MCQ practice."
        keywords="syllabus builder, custom test, personalized practice, topic selection, MCQ test builder"
      />
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <PageBreadcrumb items={[{ title: 'Custom Syllabus', href: '/custom-syllabus', isCurrent: true }]} showHomeButton={true} />
        <div className="mt-3 mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
            <ListChecks className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold leading-tight bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              Custom Syllabus Builder
            </h1>
            <TypewriterText
              prefix="Build a custom syllabus to crack "
              phrases={['Sindh Board Exams', 'FPSC & Public Service', 'Cambridge O/A Levels']}
              className="text-sm md:text-base text-muted-foreground mt-1"
              minHeightClass="min-h-[1.75rem]"
            />
          </div>
        </div>
      </div>
      <SyllabusBuilder />
    </Header>
  );
};

export default CustomSyllabus;
