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
  status: 'pending' | 'published' | 'rejected';
  publishedAt?: string;
  rejectionReason?: string;
}

class BulkContentService {
  // Check for duplicates based on title and subject/topic for MCQs
  async checkDuplicates(items: ContentSubmission[]): Promise<{ duplicates: string[], unique: ContentSubmission[] }> {
    const duplicates: string[] = [];
    const unique: ContentSubmission[] = [];
    
    try {
      for (const item of items) {
        let query = supabase
          .from('content_submissions')
          .select('id, title')
          .eq('title', item.title)
          .eq('category', item.category);

        // For MCQs, also check subject/topic
        if (item.category === 'mcq' && item.subject && item.topic) {
          query = query.eq('subject', item.subject).eq('topic', item.topic);
        }

        const { data } = await query.limit(1);
        
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
          const { data, error } = await supabase
            .from('content_submissions')
            .insert(batch.map(item => ({
              ...item,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })));

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
      const { data, error } = await supabase
        .from('content_submissions')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .eq('status', 'pending');

      if (error) {
        result.errors.push(error.message);
      } else {
        result.published = data?.length || 0;
      }
    } catch (error: any) {
      result.errors.push(error.message);
    }

    return result;
  }

  // Get pending content for review
  async getPendingContent(category?: string, limit = 100) {
    try {
      let query = supabase
        .from('content_submissions')
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