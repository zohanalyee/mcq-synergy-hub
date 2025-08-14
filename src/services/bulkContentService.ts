import { supabase } from "@/integrations/supabase/client";
import { ContentSubmission } from "@/interfaces/content";
import { CSVProcessingResult } from "./csvProcessorService";

export interface BulkUploadResult {
  successful: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export interface PublishStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  publishedAt?: string;
  rejectionReason?: string;
}

interface ContentItemDB {
  id?: string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  status?: string;
  image_url?: string;
  file_url?: string;
  deadline?: string;
  department?: string;
  government_level?: string;
  cadre?: string;
  scholarship_type?: string;
  institution?: string;
  exam_type?: string;
  exam_year?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  explanation?: string;
  options?: Record<string, any>;
  correct_option?: string;
  time_limit?: number;
  marks?: number;
  questions?: Record<string, any>[];
  show_in_subjects?: boolean;
  show_in_syllabus?: boolean;
  show_in_mock_tests?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

class BulkContentService {
  // Check for duplicates based on title and subject/topic for MCQs
  async checkDuplicates(items: ContentSubmission[]): Promise<{ duplicates: string[], unique: ContentSubmission[] }> {
    const duplicates: string[] = [];
    const unique: ContentSubmission[] = [];
    
    try {
      // For now, we'll implement a simpler duplicate check
      // by using basic queries since the RPC doesn't exist yet
      for (const item of items) {
        const { data } = await supabase
          .from('content_items')
          .select('id')
          .eq('title', item.title)
          .eq('category', item.category)
          .limit(1);
        
        if (data && data.length > 0) {
          duplicates.push(`"${item.title}" already exists`);
        } else {
          unique.push(item);
        }
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      // If we can't check duplicates, assume all are unique
      return { duplicates: [], unique: items };
    }

    return { duplicates, unique };
  }

  // Transform ContentSubmission to database format
  private transformToDbFormat(item: ContentSubmission): ContentItemDB {
    return {
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags || [],
      status: 'pending',
      image_url: item.imageUrl,
      file_url: item.fileUrl,
      deadline: item.deadline,
      department: item.department,
      government_level: item.governmentLevel,
      cadre: item.cadre,
      scholarship_type: item.scholarshipType,
      institution: item.institution,
      exam_type: item.examType,
      exam_year: item.examYear,
      meta_title: item.metaTitle,
      meta_description: item.metaDescription,
      meta_keywords: item.metaKeywords,
      subject: item.subject,
      topic: item.topic,
      difficulty: item.difficulty,
      explanation: item.explanation,
      options: item.options || {},
      correct_option: item.correctOption,
      time_limit: item.timeLimit,
      marks: item.marks,
      questions: item.questions || [],
      show_in_subjects: item.showInSubjects,
      show_in_syllabus: item.showInSyllabus,
      show_in_mock_tests: item.showInMockTests,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Batch insert with duplicate detection
  async batchInsert(items: ContentSubmission[], batchSize = 50): Promise<BulkUploadResult> {
    const result: BulkUploadResult = {
      successful: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    };

    try {
      // Check for duplicates first
      const { duplicates, unique } = await this.checkDuplicates(items);
      result.duplicates = duplicates.length;
      result.errors.push(...duplicates);

      if (unique.length === 0) {
        return result;
      }

      // Process in batches
      for (let i = 0; i < unique.length; i += batchSize) {
        const batch = unique.slice(i, i + batchSize);
        
        try {
          const dbItems = batch.map(item => this.transformToDbFormat(item));
          
          const { data, error } = await supabase
            .from('content_items')
            .insert(dbItems);

          if (error) {
            result.failed += batch.length;
            result.errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
          } else {
            result.successful += batch.length;
          }
        } catch (batchError: any) {
          result.failed += batch.length;
          result.errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${batchError.message}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`System error: ${error.message}`);
    }

    return result;
  }

  // Publish approved content
  async publishContent(ids: string[]): Promise<{ published: number, errors: string[] }> {
    const result = { published: 0, errors: [] };

    try {
      const { error } = await supabase
        .from('content_items')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .eq('status', 'pending');

      if (error) {
        result.errors.push(error.message);
      } else {
        result.published = ids.length;
      }
    } catch (error: any) {
      result.errors.push(error.message);
    }

    return result;
  }

  // Get pending content for review
  async getPendingContent(category?: string, limit = 100): Promise<any[]> {
    try {
      let query = supabase
        .from('content_items')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending content:', error);
      return [];
    }
  }
}

export const bulkContentService = new BulkContentService();