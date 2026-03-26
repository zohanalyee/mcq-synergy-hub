import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { SyllabusBuilder } from "@/components/syllabus-builder/SyllabusBuilder";
import SEOHead from '@/components/SEOHead';

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
      </div>
      <SyllabusBuilder />
    </Header>
  );
};

export default CustomSyllabus;
