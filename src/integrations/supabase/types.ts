export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          ai_provider: string | null
          cost_estimate: number | null
          created_at: string
          difficulty: string | null
          id: string
          metadata: Json | null
          questions_fetched: number
          questions_requested: number
          questions_saved: number
          source_type: string
          subject: string | null
          topic: string | null
          triggered_by_user_id: string | null
        }
        Insert: {
          ai_provider?: string | null
          cost_estimate?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          metadata?: Json | null
          questions_fetched?: number
          questions_requested?: number
          questions_saved?: number
          source_type: string
          subject?: string | null
          topic?: string | null
          triggered_by_user_id?: string | null
        }
        Update: {
          ai_provider?: string | null
          cost_estimate?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          metadata?: Json | null
          questions_fetched?: number
          questions_requested?: number
          questions_saved?: number
          source_type?: string
          subject?: string | null
          topic?: string | null
          triggered_by_user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      content_downloads: {
        Row: {
          content_filter: Json | null
          created_at: string
          download_type: string
          download_url: string | null
          expires_at: string | null
          file_name: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          content_filter?: Json | null
          created_at?: string
          download_type: string
          download_url?: string | null
          expires_at?: string | null
          file_name?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          content_filter?: Json | null
          created_at?: string
          download_type?: string
          download_url?: string | null
          expires_at?: string | null
          file_name?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          apply_link: string | null
          cadre: string | null
          canonical_topic_name: string | null
          category: string
          correct_option: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          department: string | null
          description: string | null
          difficulty: string | null
          exam_type: string | null
          exam_year: string | null
          explanation: string | null
          file_url: string | null
          government_level: string | null
          id: string
          image_url: string | null
          institution: string | null
          is_featured: boolean | null
          last_used_at: string | null
          location: string | null
          marks: number | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          options: Json | null
          question_type: string | null
          questions: Json | null
          reference_material: string | null
          scholarship_type: string | null
          show_in_mock_tests: boolean | null
          show_in_subjects: boolean | null
          show_in_syllabus: boolean | null
          source_document_id: string | null
          source_type: string | null
          status: string
          subject: string | null
          subtopic: string | null
          tags: string[] | null
          time_limit: number | null
          title: string
          topic: string | null
          topic_id: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          apply_link?: string | null
          cadre?: string | null
          canonical_topic_name?: string | null
          category: string
          correct_option?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          difficulty?: string | null
          exam_type?: string | null
          exam_year?: string | null
          explanation?: string | null
          file_url?: string | null
          government_level?: string | null
          id?: string
          image_url?: string | null
          institution?: string | null
          is_featured?: boolean | null
          last_used_at?: string | null
          location?: string | null
          marks?: number | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          options?: Json | null
          question_type?: string | null
          questions?: Json | null
          reference_material?: string | null
          scholarship_type?: string | null
          show_in_mock_tests?: boolean | null
          show_in_subjects?: boolean | null
          show_in_syllabus?: boolean | null
          source_document_id?: string | null
          source_type?: string | null
          status?: string
          subject?: string | null
          subtopic?: string | null
          tags?: string[] | null
          time_limit?: number | null
          title: string
          topic?: string | null
          topic_id?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          apply_link?: string | null
          cadre?: string | null
          canonical_topic_name?: string | null
          category?: string
          correct_option?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          difficulty?: string | null
          exam_type?: string | null
          exam_year?: string | null
          explanation?: string | null
          file_url?: string | null
          government_level?: string | null
          id?: string
          image_url?: string | null
          institution?: string | null
          is_featured?: boolean | null
          last_used_at?: string | null
          location?: string | null
          marks?: number | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          options?: Json | null
          question_type?: string | null
          questions?: Json | null
          reference_material?: string | null
          scholarship_type?: string | null
          show_in_mock_tests?: boolean | null
          show_in_subjects?: boolean | null
          show_in_syllabus?: boolean | null
          source_document_id?: string | null
          source_type?: string | null
          status?: string
          subject?: string | null
          subtopic?: string | null
          tags?: string[] | null
          time_limit?: number | null
          title?: string
          topic?: string | null
          topic_id?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      content_question_tags: {
        Row: {
          content_id: string | null
          created_at: string
          id: string
          tag_id: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          id?: string
          tag_id?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_question_tags_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_question_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "question_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      content_submissions: {
        Row: {
          apply_link: string | null
          cadre: string | null
          category: string
          correct_option: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          department: string | null
          description: string | null
          difficulty: string | null
          exam_type: string | null
          exam_year: string | null
          explanation: string | null
          file_url: string | null
          government_level: string | null
          id: string
          image_url: string | null
          institution: string | null
          location: string | null
          marks: number | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          options: Json | null
          published_at: string | null
          questions: Json | null
          rejection_reason: string | null
          scholarship_type: string | null
          show_in_mock_tests: boolean | null
          show_in_subjects: boolean | null
          show_in_syllabus: boolean | null
          status: string
          subject: string | null
          tags: Json | null
          time_limit: number | null
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          apply_link?: string | null
          cadre?: string | null
          category: string
          correct_option?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          difficulty?: string | null
          exam_type?: string | null
          exam_year?: string | null
          explanation?: string | null
          file_url?: string | null
          government_level?: string | null
          id?: string
          image_url?: string | null
          institution?: string | null
          location?: string | null
          marks?: number | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          options?: Json | null
          published_at?: string | null
          questions?: Json | null
          rejection_reason?: string | null
          scholarship_type?: string | null
          show_in_mock_tests?: boolean | null
          show_in_subjects?: boolean | null
          show_in_syllabus?: boolean | null
          status?: string
          subject?: string | null
          tags?: Json | null
          time_limit?: number | null
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          apply_link?: string | null
          cadre?: string | null
          category?: string
          correct_option?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          difficulty?: string | null
          exam_type?: string | null
          exam_year?: string | null
          explanation?: string | null
          file_url?: string | null
          government_level?: string | null
          id?: string
          image_url?: string | null
          institution?: string | null
          location?: string | null
          marks?: number | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          options?: Json | null
          published_at?: string | null
          questions?: Json | null
          rejection_reason?: string | null
          scholarship_type?: string | null
          show_in_mock_tests?: boolean | null
          show_in_subjects?: boolean | null
          show_in_syllabus?: boolean | null
          status?: string
          subject?: string | null
          tags?: Json | null
          time_limit?: number | null
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_test_sessions: {
        Row: {
          created_at: string
          difficulty_levels: Json | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          question_count: number
          questions: Json | null
          session_name: string
          subjects: Json | null
          subtopics: Json | null
          time_limit: number
          topics: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          difficulty_levels?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          question_count?: number
          questions?: Json | null
          session_name: string
          subjects?: Json | null
          subtopics?: Json | null
          time_limit?: number
          topics?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          difficulty_levels?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          question_count?: number
          questions?: Json | null
          session_name?: string
          subjects?: Json | null
          subtopics?: Json | null
          time_limit?: number
          topics?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      document_sections: {
        Row: {
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          page_number: number | null
          section_index: number
          token_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          page_number?: number | null
          section_index?: number
          token_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          page_number?: number | null
          section_index?: number
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_url: string
          filename: string
          id: string
          level_id: string | null
          page_count: number | null
          status: string
          subject_id: string | null
          system_id: string | null
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_url: string
          filename: string
          id?: string
          level_id?: string | null
          page_count?: number | null
          status?: string
          subject_id?: string | null
          system_id?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string
          filename?: string
          id?: string
          level_id?: string | null
          page_count?: number | null
          status?: string
          subject_id?: string | null
          system_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "educational_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_systems: {
        Row: {
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          approved: boolean | null
          auto_created: boolean | null
          created_at: string | null
          created_by_ai: boolean | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
        }
        Insert: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          approved?: boolean | null
          auto_created?: boolean | null
          created_at?: string | null
          created_by_ai?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
        }
        Update: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          approved?: boolean | null
          auto_created?: boolean | null
          created_at?: string | null
          created_by_ai?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      external_opportunities: {
        Row: {
          apply_url: string
          created_at: string
          deadline_date: string | null
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          metadata: Json | null
          organization: string | null
          region: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scholarship_scope: string | null
          sector: string | null
          source_name: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          apply_url: string
          created_at?: string
          deadline_date?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          metadata?: Json | null
          organization?: string | null
          region?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scholarship_scope?: string | null
          sector?: string | null
          source_name: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          apply_url?: string
          created_at?: string
          deadline_date?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          metadata?: Json | null
          organization?: string | null
          region?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scholarship_scope?: string | null
          sector?: string | null
          source_name?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string | null
          id: string
          message: string
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      job_categories: {
        Row: {
          created_at: string | null
          description: string | null
          government_level: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          government_level?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          government_level?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      levels: {
        Row: {
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          approved: boolean | null
          auto_created: boolean | null
          created_at: string | null
          created_by_ai: boolean | null
          id: string
          name: string
          order_index: number | null
          system_id: string | null
        }
        Insert: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          approved?: boolean | null
          auto_created?: boolean | null
          created_at?: string | null
          created_by_ai?: boolean | null
          id?: string
          name: string
          order_index?: number | null
          system_id?: string | null
        }
        Update: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          approved?: boolean | null
          auto_created?: boolean | null
          created_at?: string | null
          created_by_ai?: boolean | null
          id?: string
          name?: string
          order_index?: number | null
          system_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "levels_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "educational_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_approvals: {
        Row: {
          admin_notes: string | null
          ai_metadata: Json | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          entity_id: string
          entity_name: string
          entity_type: string
          id: string
          status: string
        }
        Insert: {
          admin_notes?: string | null
          ai_metadata?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          entity_id: string
          entity_name: string
          entity_type: string
          id?: string
          status?: string
        }
        Update: {
          admin_notes?: string | null
          ai_metadata?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          entity_id?: string
          entity_name?: string
          entity_type?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      navigation_items: {
        Row: {
          created_at: string | null
          href: string
          icon: string | null
          id: string
          is_visible: boolean | null
          label: string
          parent_id: string | null
          position: number
          target_audience: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          href: string
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          label: string
          parent_id?: string | null
          position?: number
          target_audience?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          href?: string
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          label?: string
          parent_id?: string | null
          position?: number
          target_audience?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_processing_queue: {
        Row: {
          created_at: string
          current_batch: number | null
          document_id: string
          error_message: string | null
          extracted_text: string | null
          file_url: string
          id: string
          processed_pages: number | null
          status: string
          total_batches: number | null
          total_pages: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_batch?: number | null
          document_id: string
          error_message?: string | null
          extracted_text?: string | null
          file_url: string
          id?: string
          processed_pages?: number | null
          status?: string
          total_batches?: number | null
          total_pages: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_batch?: number | null
          document_id?: string
          error_message?: string | null
          extracted_text?: string | null
          file_url?: string
          id?: string
          processed_pages?: number | null
          status?: string
          total_batches?: number | null
          total_pages?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_processing_queue_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_learning_context: Json | null
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          active_learning_context?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          active_learning_context?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      question_tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      recommended_tests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          question_count: number
          question_ids: Json | null
          reason: string
          session_id: string | null
          status: string
          subject_name: string | null
          topic_name: string
          user_id: string
          weakness_percentage: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          question_count?: number
          question_ids?: Json | null
          reason?: string
          session_id?: string | null
          status?: string
          subject_name?: string | null
          topic_name: string
          user_id: string
          weakness_percentage?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          question_count?: number
          question_ids?: Json | null
          reason?: string
          session_id?: string | null
          status?: string
          subject_name?: string | null
          topic_name?: string
          user_id?: string
          weakness_percentage?: number | null
        }
        Relationships: []
      }
      saved_syllabus_templates: {
        Row: {
          created_at: string | null
          filter_state: Json
          id: string
          name: string
          quiz_settings: Json
          selected_topic_ids: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filter_state?: Json
          id?: string
          name: string
          quiz_settings?: Json
          selected_topic_ids?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filter_state?: Json
          id?: string
          name?: string
          quiz_settings?: Json
          selected_topic_ids?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          approved: boolean | null
          auto_created: boolean | null
          category: string | null
          created_at: string
          created_by_ai: boolean | null
          description: string | null
          icon: string | null
          id: string
          level_id: string | null
          name: string
        }
        Insert: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          approved?: boolean | null
          auto_created?: boolean | null
          category?: string | null
          created_at?: string
          created_by_ai?: boolean | null
          description?: string | null
          icon?: string | null
          id?: string
          level_id?: string | null
          name: string
        }
        Update: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          approved?: boolean | null
          auto_created?: boolean | null
          category?: string | null
          created_at?: string
          created_by_ai?: boolean | null
          description?: string | null
          icon?: string | null
          id?: string
          level_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      subtopics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          topic_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          topic_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subtopics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          content_id: string | null
          created_at: string | null
          id: string
          score: number
          subjects: string[] | null
          test_type: string
          time_taken: number | null
          total_questions: number
          user_id: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          score?: number
          subjects?: string[] | null
          test_type: string
          time_taken?: number | null
          total_questions?: number
          user_id?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          score?: number
          subjects?: string[] | null
          test_type?: string
          time_taken?: number | null
          total_questions?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          ai_confidence: number | null
          ai_suggested_name: string | null
          approved: boolean | null
          auto_created: boolean | null
          created_at: string
          created_by_ai: boolean | null
          description: string | null
          id: string
          name: string
          subject_id: string | null
        }
        Insert: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          ai_confidence?: number | null
          ai_suggested_name?: string | null
          approved?: boolean | null
          auto_created?: boolean | null
          created_at?: string
          created_by_ai?: boolean | null
          description?: string | null
          id?: string
          name: string
          subject_id?: string | null
        }
        Update: {
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          ai_confidence?: number | null
          ai_suggested_name?: string | null
          approved?: boolean | null
          auto_created?: boolean | null
          created_at?: string
          created_by_ai?: boolean | null
          description?: string | null
          id?: string
          name?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_syllabus: {
        Row: {
          added_at: string | null
          id: string
          subject_id: string | null
          topic_id: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          subject_id?: string | null
          topic_id?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          subject_id?: string | null
          topic_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_syllabus_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_custom_syllabus_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_generation_preferences: {
        Row: {
          default_difficulty: string | null
          default_quantity: number | null
          id: string
          last_board_id: string | null
          last_class_id: string | null
          last_subject_id: string | null
          last_topic_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          default_difficulty?: string | null
          default_quantity?: number | null
          id?: string
          last_board_id?: string | null
          last_class_id?: string | null
          last_subject_id?: string | null
          last_topic_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          default_difficulty?: string | null
          default_quantity?: number | null
          id?: string
          last_board_id?: string | null
          last_class_id?: string | null
          last_subject_id?: string | null
          last_topic_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_url: string | null
          color: string | null
          created_at: string
          expires_at: string | null
          icon: string | null
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          color?: string | null
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          color?: string | null
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_question_attempts: {
        Row: {
          attempted_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string
          content_id: string | null
          id: string
          score: number
          time_taken: number | null
          total_questions: number
          user_id: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          content_id?: string | null
          id?: string
          score?: number
          time_taken?: number | null
          total_questions?: number
          user_id?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          content_id?: string | null
          id?: string
          score?: number
          time_taken?: number | null
          total_questions?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_topic_ids: {
        Args: never
        Returns: {
          matched_topics: string[]
          updated_count: number
        }[]
      }
      get_ai_usage_today: {
        Args: never
        Returns: {
          daily_limit: number
          remaining_requests: number
          total_questions_requested: number
          total_questions_saved: number
          total_requests: number
        }[]
      }
      get_autofill_queue: {
        Args: { limit_count?: number }
        Returns: {
          current_count: number
          level_name: string
          questions_needed: number
          subject_id: string
          subject_name: string
          system_name: string
          topic_id: string
          topic_name: string
        }[]
      }
      get_content_inventory_stats: {
        Args: never
        Returns: {
          approved_count: number
          subject: string
          topic: string
        }[]
      }
      get_daily_activity_stats: {
        Args: { days_back?: number }
        Returns: {
          activity_date: string
          test_count: number
          user_count: number
        }[]
      }
      get_hourly_activity_distribution: {
        Args: never
        Returns: {
          hour_of_day: number
          test_count: number
          user_count: number
        }[]
      }
      get_lms_content_inventory: {
        Args: never
        Returns: {
          is_low_content: boolean
          level_name: string
          question_count: number
          subject_name: string
          system_name: string
          topic_id: string
          topic_name: string
        }[]
      }
      get_platform_stats: {
        Args: never
        Returns: {
          mcq_count: number
          subject_count: number
          test_count: number
        }[]
      }
      get_power_users: {
        Args: { limit_count?: number }
        Returns: {
          avg_score: number
          last_active: string
          total_tests: number
          total_time_spent: number
          user_id: string
          username: string
        }[]
      }
      get_recently_active_users: {
        Args: { minutes_ago?: number }
        Returns: number
      }
      get_student_weaknesses: {
        Args: { target_user_id: string }
        Returns: {
          average_score: number
          subject: string
          tests_count: number
        }[]
      }
      get_topic_inventory: {
        Args: {
          board_filter?: string
          class_filter?: string
          subject_filter?: string
        }
        Returns: {
          board_count: number
          board_names: string[]
          canonical_name: string
          display_name: string
          status: string
          subject_name: string
          total_questions: number
        }[]
      }
      get_user_retention_stats: {
        Args: never
        Returns: {
          active_users: number
          avg_session_time: number
          bounce_rate: number
          total_tests: number
          total_users: number
        }[]
      }
      global_context_search: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          id: string
          level_id: string
          level_name: string
          name: string
          result_type: string
          subject_id: string
          subject_name: string
          system_id: string
          system_name: string
          system_type: string
          topic_count: number
        }[]
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      match_document_sections: {
        Args: {
          filter_document_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          page_number: number
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
