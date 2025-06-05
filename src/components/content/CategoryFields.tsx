
import { ContentCategory } from "@/interfaces/content";
import JobFields from "./fields/JobFields";
import ScholarshipFields from "./fields/ScholarshipFields";
import MCQQuizFields from "./fields/MCQQuizFields";
import PastPaperFields from "./fields/PastPaperFields";
import VisibilitySettings from "./fields/VisibilitySettings";

interface CategoryFieldsProps {
  category: ContentCategory;
  form: any;
}

const CategoryFields = ({ category, form }: CategoryFieldsProps) => {
  const shouldShowVisibility = ['mcq', 'quiz', 'past_paper'].includes(category);

  const renderCategoryFields = () => {
    switch (category) {
      case 'job':
        return <JobFields form={form} />;
      case 'scholarship':
        return <ScholarshipFields form={form} />;
      case 'mcq':
      case 'quiz':
        return <MCQQuizFields category={category} form={form} />;
      case 'past_paper':
        return <PastPaperFields form={form} />;
      default:
        return <PastPaperFields form={form} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderCategoryFields()}
      {shouldShowVisibility && <VisibilitySettings form={form} />}
    </div>
  );
};

export default CategoryFields;
