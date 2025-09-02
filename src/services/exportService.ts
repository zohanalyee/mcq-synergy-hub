import { QuestionBankItem } from './questionBankService';
import { GeneratedTest } from './testGenerationService';
import { supabase } from '@/integrations/supabase/client';

export type ExportFormat = 'pdf' | 'word' | 'excel';
export type ExportType = 'questions' | 'test' | 'answers';

export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  includeAnswers: boolean;
  includeExplanations: boolean;
  includeImages: boolean;
  watermark?: string;
  roleBasedAccess: 'student' | 'teacher' | 'admin';
}

export interface ExportRequest {
  questions?: QuestionBankItem[];
  test?: GeneratedTest;
  options: ExportOptions;
  fileName: string;
}

// Export questions to different formats
export const exportQuestions = async (request: ExportRequest): Promise<string | null> => {
  try {
    const { questions, test, options, fileName } = request;
    
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    const questionsToExport = questions || test?.questions || [];
    
    if (questionsToExport.length === 0) {
      console.error("No questions to export");
      return null;
    }

    switch (options.format) {
      case 'pdf':
        content = await generatePDFContent(questionsToExport, test, options);
        mimeType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      case 'word':
        content = await generateWordContent(questionsToExport, test, options);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        break;
      case 'excel':
        content = await generateExcelContent(questionsToExport, test, options);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
      default:
        throw new Error('Unsupported export format');
    }

    // Create blob and download URL
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Track download in database
    await trackDownload({
      downloadType: options.format,
      fileName: `${fileName}.${fileExtension}`,
      contentFilter: {
        questionCount: questionsToExport.length,
        subjects: [...new Set(questionsToExport.map(q => q.subject))],
        topics: [...new Set(questionsToExport.map(q => q.topic))],
        exportType: options.type,
        includeAnswers: options.includeAnswers
      }
    });

    return url;
  } catch (error) {
    console.error("Error exporting questions:", error);
    return null;
  }
};

// Generate PDF content
const generatePDFContent = async (
  questions: QuestionBankItem[], 
  test: GeneratedTest | undefined, 
  options: ExportOptions
): Promise<string> => {
  // This would use a PDF library like jsPDF or PDFKit
  // For now, returning HTML content that can be converted to PDF
  let html = `
    <html>
    <head>
      <title>${test?.title || 'Question Bank Export'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .question { margin: 20px 0; page-break-inside: avoid; }
        .question-number { font-weight: bold; }
        .options { margin: 10px 0; }
        .option { margin: 5px 0; }
        .answer { color: green; font-weight: bold; }
        .explanation { font-style: italic; color: #666; margin-top: 10px; }
        .watermark { position: fixed; bottom: 10px; right: 10px; opacity: 0.3; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${test?.title || 'Question Bank Export'}</h1>
        ${test ? `<p>Time Limit: ${test.timeLimit} minutes | Total Questions: ${test.questions.length}</p>` : ''}
        ${options.watermark ? `<div class="watermark">${options.watermark}</div>` : ''}
      </div>
  `;

  questions.forEach((question, index) => {
    html += `
      <div class="question">
        <p class="question-number">Q${index + 1}. ${question.question}</p>
        <div class="options">
          <div class="option">A) ${question.options.A}</div>
          <div class="option">B) ${question.options.B}</div>
          <div class="option">C) ${question.options.C}</div>
          <div class="option">D) ${question.options.D}</div>
        </div>
        ${options.includeAnswers ? `<p class="answer">Answer: ${question.correctOption}</p>` : ''}
        ${options.includeExplanations && question.explanation ? 
          `<p class="explanation">Explanation: ${question.explanation}</p>` : ''}
      </div>
    `;
  });

  html += '</body></html>';
  return html;
};

// Generate Word document content
const generateWordContent = async (
  questions: QuestionBankItem[], 
  test: GeneratedTest | undefined, 
  options: ExportOptions
): Promise<string> => {
  // This would use a library like docx or similar
  // For now, returning formatted text content
  let content = `${test?.title || 'Question Bank Export'}\n\n`;
  
  if (test) {
    content += `Time Limit: ${test.timeLimit} minutes\n`;
    content += `Total Questions: ${test.questions.length}\n\n`;
  }

  questions.forEach((question, index) => {
    content += `Q${index + 1}. ${question.question}\n\n`;
    content += `A) ${question.options.A}\n`;
    content += `B) ${question.options.B}\n`;
    content += `C) ${question.options.C}\n`;
    content += `D) ${question.options.D}\n\n`;
    
    if (options.includeAnswers) {
      content += `Answer: ${question.correctOption}\n`;
    }
    
    if (options.includeExplanations && question.explanation) {
      content += `Explanation: ${question.explanation}\n`;
    }
    
    content += '\n---\n\n';
  });

  return content;
};

// Generate Excel content
const generateExcelContent = async (
  questions: QuestionBankItem[], 
  test: GeneratedTest | undefined, 
  options: ExportOptions
): Promise<string> => {
  // This would use a library like xlsx
  // For now, returning CSV format
  let csv = 'Question No,Question,Option A,Option B,Option C,Option D';
  
  if (options.includeAnswers) {
    csv += ',Correct Answer';
  }
  
  if (options.includeExplanations) {
    csv += ',Explanation';
  }
  
  csv += ',Subject,Topic,Difficulty\n';

  questions.forEach((question, index) => {
    csv += `"${index + 1}","${question.question}","${question.options.A}","${question.options.B}","${question.options.C}","${question.options.D}"`;
    
    if (options.includeAnswers) {
      csv += `,"${question.correctOption}"`;
    }
    
    if (options.includeExplanations) {
      csv += `,"${question.explanation || ''}"`;
    }
    
    csv += `,"${question.subject}","${question.topic}","${question.difficulty}"\n`;
  });

  return csv;
};

// Track download in database
const trackDownload = async (downloadData: {
  downloadType: string;
  fileName: string;
  contentFilter: any;
}): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase
        .from('content_downloads')
        .insert([{
          user_id: user.id,
          download_type: downloadData.downloadType,
          file_name: downloadData.fileName,
          content_filter: downloadData.contentFilter,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }]);
    }
  } catch (error) {
    console.error("Error tracking download:", error);
  }
};

// Get user's download history
export const getDownloadHistory = async (): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('content_downloads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching download history:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error loading download history:", error);
    return [];
  }
};

// Generate role-based export options
export const getRoleBasedExportOptions = (userRole: 'student' | 'teacher' | 'admin'): Partial<ExportOptions> => {
  const baseOptions: Partial<ExportOptions> = {
    roleBasedAccess: userRole,
    includeImages: true
  };

  switch (userRole) {
    case 'student':
      return {
        ...baseOptions,
        includeAnswers: false,
        includeExplanations: false,
        watermark: 'For Educational Use Only'
      };
    case 'teacher':
      return {
        ...baseOptions,
        includeAnswers: true,
        includeExplanations: true,
        watermark: 'Teacher Copy'
      };
    case 'admin':
      return {
        ...baseOptions,
        includeAnswers: true,
        includeExplanations: true,
        watermark: undefined
      };
    default:
      return baseOptions;
  }
};