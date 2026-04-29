import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { SyllabusBuilder } from "@/components/syllabus-builder/SyllabusBuilder";
import SEOHead from '@/components/SEOHead';
import TypewriterText from '@/components/TypewriterText';
import PageHeader from '@/components/ui/PageHeader';
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
        <PageHeader
          title="Custom Syllabus Builder"
          icon={ListChecks}
          colorTheme="amber"
          description={
            <TypewriterText
              prefix="Build a custom syllabus to crack "
              phrases={['Sindh Board Exams', 'FPSC & Public Service', 'Cambridge O/A Levels']}
              minHeightClass="min-h-[1.5rem]"
            />
          }
        />
      </div>
      <SyllabusBuilder />
    </Header>
  );
};

export default CustomSyllabus;
