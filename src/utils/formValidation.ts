import { ContentSubmission, ContentCategory } from "@/interfaces/content";

export interface ValidationError {
  field: string;
  message: string;
}

export class FormValidationService {
  // Validate basic content fields
  static validateBasicFields(data: ContentSubmission): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required'
      });
    } else if (data.title.length < 3) {
      errors.push({
        field: 'title',
        message: 'Title must be at least 3 characters long'
      });
    } else if (data.title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Title must be less than 200 characters'
      });
    }

    if (!data.description?.trim()) {
      errors.push({
        field: 'description',
        message: 'Description is required'
      });
    } else if (data.description.length < 10) {
      errors.push({
        field: 'description',
        message: 'Description must be at least 10 characters long'
      });
    }

    return errors;
  }

  // Validate category-specific fields
  static validateCategoryFields(data: ContentSubmission): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (data.category) {
      case 'scholarship':
        if (!data.institution?.trim()) {
          errors.push({
            field: 'institution',
            message: 'Institution is required for scholarships'
          });
        }
        if (!data.scholarshipType?.trim()) {
          errors.push({
            field: 'scholarshipType',
            message: 'Scholarship type is required'
          });
        }
        break;

      case 'job':
        if (!data.department?.trim()) {
          errors.push({
            field: 'department',
            message: 'Department is required for job postings'
          });
        }
        if (!data.governmentLevel?.trim()) {
          errors.push({
            field: 'governmentLevel',
            message: 'Government level is required for job postings'
          });
        }
        break;

      case 'mcq':
        if (!data.subject?.trim()) {
          errors.push({
            field: 'subject',
            message: 'Subject is required for MCQs'
          });
        }
        if (!data.topic?.trim()) {
          errors.push({
            field: 'topic',
            message: 'Topic is required for MCQs'
          });
        }
        if (!data.options || !data.options.A || !data.options.B || !data.options.C || !data.options.D) {
          errors.push({
            field: 'options',
            message: 'All four options (A, B, C, D) are required for MCQs'
          });
        }
        if (!data.correctOption) {
          errors.push({
            field: 'correctOption',
            message: 'Correct answer is required for MCQs'
          });
        }
        break;

      case 'quiz':
        if (!data.subject?.trim()) {
          errors.push({
            field: 'subject',
            message: 'Subject is required for quizzes'
          });
        }
        if (!data.topic?.trim()) {
          errors.push({
            field: 'topic',
            message: 'Topic is required for quizzes'
          });
        }
        if (!data.questions || data.questions.length === 0) {
          errors.push({
            field: 'questions',
            message: 'At least one question is required for quizzes'
          });
        }
        if (!data.timeLimit || data.timeLimit < 1) {
          errors.push({
            field: 'timeLimit',
            message: 'Valid time limit is required for quizzes'
          });
        }
        break;

      case 'past_paper':
        if (!data.examType?.trim()) {
          errors.push({
            field: 'examType',
            message: 'Exam type is required for past papers'
          });
        }
        if (!data.examYear?.trim()) {
          errors.push({
            field: 'examYear',
            message: 'Exam year is required for past papers'
          });
        }
        if (!data.subject?.trim()) {
          errors.push({
            field: 'subject',
            message: 'Subject is required for past papers'
          });
        }
        break;
    }

    return errors;
  }

  // Comprehensive validation
  static validateSubmission(data: ContentSubmission): ValidationError[] {
    const basicErrors = this.validateBasicFields(data);
    const categoryErrors = this.validateCategoryFields(data);
    
    return [...basicErrors, ...categoryErrors];
  }

  // Format validation errors for display
  static formatValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
      return errors[0].message;
    }

    return `Multiple validation errors: ${errors.map(e => e.message).join(', ')}`;
  }
}