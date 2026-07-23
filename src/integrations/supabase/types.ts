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
      agent_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          input_data: Json
          needs_review: boolean | null
          output_data: Json | null
          priority: number
          quality_score: Json | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["agent_task_status"]
          task_type: Database["public"]["Enums"]["agent_task_type"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json
          needs_review?: boolean | null
          output_data?: Json | null
          priority?: number
          quality_score?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_task_status"]
          task_type: Database["public"]["Enums"]["agent_task_type"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json
          needs_review?: boolean | null
          output_data?: Json | null
          priority?: number
          quality_score?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["agent_task_status"]
          task_type?: Database["public"]["Enums"]["agent_task_type"]
        }
        Relationships: []
      }
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
      att_staff: {
        Row: {
          created_at: string | null
          department: string | null
          designation: string
          email: string | null
          employee_id: string
          full_name: string
          id: string
          mobile: string | null
          photo_url: string | null
          shift_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          designation: string
          email?: string | null
          employee_id: string
          full_name: string
          id?: string
          mobile?: string | null
          photo_url?: string | null
          shift_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          designation?: string
          email?: string | null
          employee_id?: string
          full_name?: string
          id?: string
          mobile?: string | null
          photo_url?: string | null
          shift_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "att_staff_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      att_students: {
        Row: {
          admission_number: string
          class_id: string | null
          created_at: string | null
          full_name: string
          id: string
          parent_email: string | null
          parent_mobile: string | null
          photo_url: string | null
          roll_number: string | null
          section_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          admission_number: string
          class_id?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          parent_email?: string | null
          parent_mobile?: string | null
          photo_url?: string | null
          roll_number?: string | null
          section_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          admission_number?: string
          class_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          parent_email?: string | null
          parent_mobile?: string | null
          photo_url?: string | null
          roll_number?: string | null
          section_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "att_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "att_students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
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
      blog_posts: {
        Row: {
          author_name: string | null
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          excerpt: string | null
          faqs: Json | null
          highlights: Json | null
          id: string
          image_url: string | null
          internal_links: Json | null
          jobposting: Json | null
          last_updated_at: string | null
          meta_description: string | null
          meta_title: string | null
          og_title: string | null
          prep_blocks: Json | null
          published_at: string | null
          reading_time_minutes: number | null
          schema_type: string | null
          slug: string
          sources: Json | null
          status: string
          structured_tables: Json | null
          tags: string[] | null
          title: string
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          faqs?: Json | null
          highlights?: Json | null
          id?: string
          image_url?: string | null
          internal_links?: Json | null
          jobposting?: Json | null
          last_updated_at?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_title?: string | null
          prep_blocks?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          schema_type?: string | null
          slug: string
          sources?: Json | null
          status?: string
          structured_tables?: Json | null
          tags?: string[] | null
          title: string
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          faqs?: Json | null
          highlights?: Json | null
          id?: string
          image_url?: string | null
          internal_links?: Json | null
          jobposting?: Json | null
          last_updated_at?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_title?: string | null
          prep_blocks?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          schema_type?: string | null
          slug?: string
          sources?: Json | null
          status?: string
          structured_tables?: Json | null
          tags?: string[] | null
          title?: string
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      board_result_announcements: {
        Row: {
          announced_at: string | null
          blog_generated: boolean | null
          blog_id: string | null
          board_name: string
          created_at: string | null
          exam_type: string
          id: string
          result_url: string
          year: number
        }
        Insert: {
          announced_at?: string | null
          blog_generated?: boolean | null
          blog_id?: string | null
          board_name: string
          created_at?: string | null
          exam_type: string
          id?: string
          result_url: string
          year: number
        }
        Update: {
          announced_at?: string | null
          blog_generated?: boolean | null
          blog_id?: string | null
          board_name?: string
          created_at?: string | null
          exam_type?: string
          id?: string
          result_url?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_result_announcements_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      class_attendance_summary: {
        Row: {
          absent_students: number
          attendance_date: string
          attendance_percentage: number
          class_id: string
          class_name: string
          created_at: string | null
          id: string
          present_students: number
          total_students: number
          user_id: string | null
        }
        Insert: {
          absent_students?: number
          attendance_date: string
          attendance_percentage?: number
          class_id: string
          class_name: string
          created_at?: string | null
          id?: string
          present_students?: number
          total_students?: number
          user_id?: string | null
        }
        Update: {
          absent_students?: number
          attendance_date?: string
          attendance_percentage?: number
          class_id?: string
          class_name?: string
          created_at?: string | null
          id?: string
          present_students?: number
          total_students?: number
          user_id?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string | null
          id: string
          institute_name: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          institute_name?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          institute_name?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          user_id?: string | null
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
          concept_group_id: string | null
          concept_grouped_at: string | null
          content_fingerprint: string | null
          correct_option: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          department: string | null
          description: string | null
          difficulty: string | null
          exam_category: string | null
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
          quality_grade: string | null
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
          concept_group_id?: string | null
          concept_grouped_at?: string | null
          content_fingerprint?: string | null
          correct_option?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          difficulty?: string | null
          exam_category?: string | null
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
          quality_grade?: string | null
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
          concept_group_id?: string | null
          concept_grouped_at?: string | null
          content_fingerprint?: string | null
          correct_option?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          difficulty?: string | null
          exam_category?: string | null
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
          quality_grade?: string | null
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
      credit_transactions: {
        Row: {
          action_type: string
          amount: number
          balance_after: number | null
          created_at: string
          details: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          balance_after?: number | null
          created_at?: string
          details?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          balance_after?: number | null
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string
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
      empty_topic_analytics: {
        Row: {
          board_name: string
          class_number: string
          created_at: string
          id: string
          last_viewed_at: string
          page_path: string
          subject_name: string
          topic_name: string
          view_count: number
        }
        Insert: {
          board_name: string
          class_number: string
          created_at?: string
          id?: string
          last_viewed_at?: string
          page_path: string
          subject_name: string
          topic_name: string
          view_count?: number
        }
        Update: {
          board_name?: string
          class_number?: string
          created_at?: string
          id?: string
          last_viewed_at?: string
          page_path?: string
          subject_name?: string
          topic_name?: string
          view_count?: number
        }
        Relationships: []
      }
      external_opportunities: {
        Row: {
          amount: string | null
          apply_url: string
          created_at: string
          deadline_date: string | null
          department: string | null
          description: string | null
          document_url: string | null
          education_level: string | null
          eligibility: string | null
          experience: string | null
          field_of_study: string | null
          id: string
          image_url: string | null
          location: string | null
          metadata: Json | null
          organization: string | null
          positions: number | null
          pre_bid_meeting: string | null
          qualification: string | null
          region: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary: string | null
          scholarship_scope: string | null
          sector: string | null
          source_name: string
          status: string
          tender_category: string | null
          tender_number: string | null
          tender_value: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: string | null
          apply_url: string
          created_at?: string
          deadline_date?: string | null
          department?: string | null
          description?: string | null
          document_url?: string | null
          education_level?: string | null
          eligibility?: string | null
          experience?: string | null
          field_of_study?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          metadata?: Json | null
          organization?: string | null
          positions?: number | null
          pre_bid_meeting?: string | null
          qualification?: string | null
          region?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary?: string | null
          scholarship_scope?: string | null
          sector?: string | null
          source_name: string
          status?: string
          tender_category?: string | null
          tender_number?: string | null
          tender_value?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: string | null
          apply_url?: string
          created_at?: string
          deadline_date?: string | null
          department?: string | null
          description?: string | null
          document_url?: string | null
          education_level?: string | null
          eligibility?: string | null
          experience?: string | null
          field_of_study?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          metadata?: Json | null
          organization?: string | null
          positions?: number | null
          pre_bid_meeting?: string | null
          qualification?: string | null
          region?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary?: string | null
          scholarship_scope?: string | null
          sector?: string | null
          source_name?: string
          status?: string
          tender_category?: string | null
          tender_number?: string | null
          tender_value?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
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
      global_appearance_settings: {
        Row: {
          id: string
          key: string
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          key?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          key?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      holidays: {
        Row: {
          applies_to: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          institute_name: string | null
          name: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          applies_to?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          institute_name?: string | null
          name: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          applies_to?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          institute_name?: string | null
          name?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      institute_settings: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          institute_name: string
          logo_url: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          institute_name: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          institute_name?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
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
      job_test_custom_syllabus: {
        Row: {
          created_at: string
          id: string
          job_test_id: string
          notes: string | null
          sections: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_test_id: string
          notes?: string | null
          sections?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_test_id?: string
          notes?: string | null
          sections?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_test_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          difficulty_distribution: Json
          id: string
          job_title: string
          max_retries: number
          min_questions_per_topic: number
          pool_multiplier: number
          sample_questions: Json | null
          status: string
          syllabus: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          difficulty_distribution?: Json
          id?: string
          job_title: string
          max_retries?: number
          min_questions_per_topic?: number
          pool_multiplier?: number
          sample_questions?: Json | null
          status?: string
          syllabus?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          difficulty_distribution?: Json
          id?: string
          job_title?: string
          max_retries?: number
          min_questions_per_topic?: number
          pool_multiplier?: number
          sample_questions?: Json | null
          status?: string
          syllabus?: Json
          updated_at?: string
        }
        Relationships: []
      }
      job_test_generation_logs: {
        Row: {
          accepted_count: number
          api_calls_made: number
          created_at: string
          difficulty: string | null
          error_message: string | null
          generated_count: number
          generation_time_seconds: number | null
          id: string
          job_test_id: string | null
          rejected_count: number
          rejection_reasons: Json | null
          requested_count: number | null
          status: string
          subject: string
          total_cost_credits: number | null
        }
        Insert: {
          accepted_count?: number
          api_calls_made?: number
          created_at?: string
          difficulty?: string | null
          error_message?: string | null
          generated_count?: number
          generation_time_seconds?: number | null
          id?: string
          job_test_id?: string | null
          rejected_count?: number
          rejection_reasons?: Json | null
          requested_count?: number | null
          status?: string
          subject: string
          total_cost_credits?: number | null
        }
        Update: {
          accepted_count?: number
          api_calls_made?: number
          created_at?: string
          difficulty?: string | null
          error_message?: string | null
          generated_count?: number
          generation_time_seconds?: number | null
          id?: string
          job_test_id?: string | null
          rejected_count?: number
          rejection_reasons?: Json | null
          requested_count?: number | null
          status?: string
          subject?: string
          total_cost_credits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_test_generation_logs_job_test_id_fkey"
            columns: ["job_test_id"]
            isOneToOne: false
            referencedRelation: "job_test_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_test_generation_queue: {
        Row: {
          accepted_count: number
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          job_test_id: string
          processed_at: string | null
          status: string
          subject: string
          target_count: number
          updated_at: string
        }
        Insert: {
          accepted_count?: number
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          job_test_id: string
          processed_at?: string | null
          status?: string
          subject: string
          target_count?: number
          updated_at?: string
        }
        Update: {
          accepted_count?: number
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          job_test_id?: string
          processed_at?: string | null
          status?: string
          subject?: string
          target_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      job_test_progress: {
        Row: {
          best_score: number
          created_at: string
          id: string
          ip_address: unknown
          job_test_id: string
          last_attempt_at: string | null
          questions_unlocked: number
          total_attempts: number
          updated_at: string
          user_id: string | null
          weak_topics: Json
        }
        Insert: {
          best_score?: number
          created_at?: string
          id?: string
          ip_address?: unknown
          job_test_id: string
          last_attempt_at?: string | null
          questions_unlocked?: number
          total_attempts?: number
          updated_at?: string
          user_id?: string | null
          weak_topics?: Json
        }
        Update: {
          best_score?: number
          created_at?: string
          id?: string
          ip_address?: unknown
          job_test_id?: string
          last_attempt_at?: string | null
          questions_unlocked?: number
          total_attempts?: number
          updated_at?: string
          user_id?: string | null
          weak_topics?: Json
        }
        Relationships: []
      }
      job_test_questions: {
        Row: {
          admin_approved: boolean
          concept_group_id: string | null
          concept_grouped_at: string | null
          correct_answer: string
          created_at: string
          difficulty: string
          explanation: string | null
          generation_batch: number | null
          id: string
          job_test_id: string
          last_used_at: string | null
          options: Json
          question: string
          reused_from_content_item_id: string | null
          subject: string
          times_correct: number
          times_used: number
          topic: string | null
          usage_count: number
          validation_score: number | null
        }
        Insert: {
          admin_approved?: boolean
          concept_group_id?: string | null
          concept_grouped_at?: string | null
          correct_answer: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          generation_batch?: number | null
          id?: string
          job_test_id: string
          last_used_at?: string | null
          options: Json
          question: string
          reused_from_content_item_id?: string | null
          subject: string
          times_correct?: number
          times_used?: number
          topic?: string | null
          usage_count?: number
          validation_score?: number | null
        }
        Update: {
          admin_approved?: boolean
          concept_group_id?: string | null
          concept_grouped_at?: string | null
          correct_answer?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          generation_batch?: number | null
          id?: string
          job_test_id?: string
          last_used_at?: string | null
          options?: Json
          question?: string
          reused_from_content_item_id?: string | null
          subject?: string
          times_correct?: number
          times_used?: number
          topic?: string | null
          usage_count?: number
          validation_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_test_questions_job_test_id_fkey"
            columns: ["job_test_id"]
            isOneToOne: false
            referencedRelation: "job_test_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_tests: {
        Row: {
          created_at: string | null
          definition_id: string | null
          description: string | null
          duration: number | null
          id: string
          keywords: string[]
          meta_description: string | null
          organization: string
          questions: number | null
          seo_enhanced_at: string | null
          seo_title: string | null
          syllabus: Json
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          definition_id?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          keywords?: string[]
          meta_description?: string | null
          organization: string
          questions?: number | null
          seo_enhanced_at?: string | null
          seo_title?: string | null
          syllabus?: Json
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          definition_id?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          keywords?: string[]
          meta_description?: string | null
          organization?: string
          questions?: number | null
          seo_enhanced_at?: string | null
          seo_title?: string | null
          syllabus?: Json
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_tests_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "job_test_definitions"
            referencedColumns: ["id"]
          },
        ]
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
      overtime_records: {
        Row: {
          amount: number | null
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          date: string
          id: string
          overtime_hours: number
          rate_multiplier: number | null
          staff_id: string
        }
        Insert: {
          amount?: number | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          date: string
          id?: string
          overtime_hours: number
          rate_multiplier?: number | null
          staff_id: string
        }
        Update: {
          amount?: number | null
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          date?: string
          id?: string
          overtime_hours?: number
          rate_multiplier?: number | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "att_staff"
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          bio: string | null
          city: string | null
          created_at: string | null
          id: string
          occupation: string | null
          profile_completed: boolean | null
          target_exam: string | null
          updated_at: string | null
          user_type: string | null
          username: string | null
        }
        Insert: {
          active_learning_context?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          id: string
          occupation?: string | null
          profile_completed?: boolean | null
          target_exam?: string | null
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Update: {
          active_learning_context?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          occupation?: string | null
          profile_completed?: boolean | null
          target_exam?: string | null
          updated_at?: string | null
          user_type?: string | null
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
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          display_publicly: boolean | null
          id: string
          is_anonymous: boolean | null
          is_verified: boolean | null
          rating: number
          reviewer_initials: string | null
          reviewer_name: string | null
          reviewer_role: string | null
          show_name: boolean | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          display_publicly?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          rating: number
          reviewer_initials?: string | null
          reviewer_name?: string | null
          reviewer_role?: string | null
          show_name?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          display_publicly?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          rating?: number
          reviewer_initials?: string | null
          reviewer_name?: string | null
          reviewer_role?: string | null
          show_name?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
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
      scraper_signals: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_hash: string
          metadata: Json | null
          signal_type: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_hash: string
          metadata?: Json | null
          signal_type: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_hash?: string
          metadata?: Json | null
          signal_type?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      scraping_attempts: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          items_found: number | null
          scraper_used: string
          source_id: string
          success: boolean
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          items_found?: number | null
          scraper_used: string
          source_id: string
          success: boolean
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          items_found?: number | null
          scraper_used?: string
          source_id?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "scraping_attempts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "scraping_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_sources: {
        Row: {
          created_at: string | null
          custom_selectors: Json | null
          firecrawl_crawl_enabled: boolean | null
          firecrawl_max_depth: number | null
          id: string
          is_active: boolean | null
          last_scrape_found: number | null
          last_scrape_saved: number | null
          last_scraped_at: string | null
          last_scraper_used: string | null
          name: string
          needs_firecrawl: boolean | null
          notes: string | null
          scraper_preference: string | null
          scraping_frequency: string | null
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          custom_selectors?: Json | null
          firecrawl_crawl_enabled?: boolean | null
          firecrawl_max_depth?: number | null
          id?: string
          is_active?: boolean | null
          last_scrape_found?: number | null
          last_scrape_saved?: number | null
          last_scraped_at?: string | null
          last_scraper_used?: string | null
          name: string
          needs_firecrawl?: boolean | null
          notes?: string | null
          scraper_preference?: string | null
          scraping_frequency?: string | null
          type: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          custom_selectors?: Json | null
          firecrawl_crawl_enabled?: boolean | null
          firecrawl_max_depth?: number | null
          id?: string
          is_active?: boolean | null
          last_scrape_found?: number | null
          last_scrape_saved?: number | null
          last_scraped_at?: string | null
          last_scraper_used?: string | null
          name?: string
          needs_firecrawl?: boolean | null
          notes?: string | null
          scraper_preference?: string | null
          scraping_frequency?: string | null
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string | null
          end_time: string
          half_day_hours: number | null
          id: string
          institute_name: string | null
          is_active: boolean | null
          late_threshold_minutes: number | null
          name: string
          start_time: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          half_day_hours?: number | null
          id?: string
          institute_name?: string | null
          is_active?: boolean | null
          late_threshold_minutes?: number | null
          name: string
          start_time: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          half_day_hours?: number | null
          id?: string
          institute_name?: string | null
          is_active?: boolean | null
          late_threshold_minutes?: number | null
          name?: string
          start_time?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          date: string
          id: string
          location_lat: number | null
          location_lng: number | null
          marked_by: string | null
          overtime_hours: number | null
          remarks: string | null
          staff_id: string
          status: string | null
          work_hours: number | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          date: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          marked_by?: string | null
          overtime_hours?: number | null
          remarks?: string | null
          staff_id: string
          status?: string | null
          work_hours?: number | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          date?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          marked_by?: string | null
          overtime_hours?: number | null
          remarks?: string | null
          staff_id?: string
          status?: string | null
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "att_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_leave_balance: {
        Row: {
          casual_leave: number | null
          casual_used: number | null
          earned_leave: number | null
          earned_used: number | null
          id: string
          sick_leave: number | null
          sick_used: number | null
          staff_id: string
          year: number
        }
        Insert: {
          casual_leave?: number | null
          casual_used?: number | null
          earned_leave?: number | null
          earned_used?: number | null
          id?: string
          sick_leave?: number | null
          sick_used?: number | null
          staff_id: string
          year: number
        }
        Update: {
          casual_leave?: number | null
          casual_used?: number | null
          earned_leave?: number | null
          earned_used?: number | null
          id?: string
          sick_leave?: number | null
          sick_used?: number | null
          staff_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_leave_balance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "att_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_leaves: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          document_url: string | null
          from_date: string
          id: string
          leave_type: string
          reason: string
          rejection_reason: string | null
          staff_id: string
          status: string | null
          to_date: string
          total_days: number
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          document_url?: string | null
          from_date: string
          id?: string
          leave_type: string
          reason: string
          rejection_reason?: string | null
          staff_id: string
          status?: string | null
          to_date: string
          total_days: number
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          document_url?: string | null
          from_date?: string
          id?: string
          leave_type?: string
          reason?: string
          rejection_reason?: string | null
          staff_id?: string
          status?: string | null
          to_date?: string
          total_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_leaves_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "att_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attendance: {
        Row: {
          date: string
          id: string
          marked_at: string | null
          marked_by: string | null
          remarks: string | null
          status: string
          student_id: string
        }
        Insert: {
          date: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          remarks?: string | null
          status: string
          student_id: string
        }
        Update: {
          date?: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          remarks?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "att_students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_leaves: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          document_url: string | null
          from_date: string
          id: string
          leave_type: string
          reason: string
          rejection_reason: string | null
          status: string | null
          student_id: string
          to_date: string
          total_days: number
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          document_url?: string | null
          from_date: string
          id?: string
          leave_type: string
          reason: string
          rejection_reason?: string | null
          status?: string | null
          student_id: string
          to_date: string
          total_days: number
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          document_url?: string | null
          from_date?: string
          id?: string
          leave_type?: string
          reason?: string
          rejection_reason?: string | null
          status?: string | null
          student_id?: string
          to_date?: string
          total_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_leaves_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "att_students"
            referencedColumns: ["id"]
          },
        ]
      }
      study_audio_tracks: {
        Row: {
          category: string
          created_at: string
          file_url: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          file_url: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_url?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          uploaded_by?: string | null
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
      telegram_media_buffer: {
        Row: {
          caption: string | null
          chat_id: string
          created_at: string
          file_id: string
          id: string
          media_group_id: string
          message_id: number | null
        }
        Insert: {
          caption?: string | null
          chat_id: string
          created_at?: string
          file_id: string
          id?: string
          media_group_id: string
          message_id?: number | null
        }
        Update: {
          caption?: string | null
          chat_id?: string
          created_at?: string
          file_id?: string
          id?: string
          media_group_id?: string
          message_id?: number | null
        }
        Relationships: []
      }
      telegram_media_groups: {
        Row: {
          chat_id: string
          created_at: string
          media_group_id: string
          processing_started: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string
          media_group_id: string
          processing_started?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string
          media_group_id?: string
          processing_started?: string | null
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
      user_ai_topup_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          job_test_id: string
          metadata: Json
          questions_requested: number
          questions_saved: number
          reason: string
          subject: string | null
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_test_id: string
          metadata?: Json
          questions_requested?: number
          questions_saved?: number
          reason?: string
          subject?: string | null
          success?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_test_id?: string
          metadata?: Json
          questions_requested?: number
          questions_saved?: number
          reason?: string
          subject?: string | null
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_appearance_settings: {
        Row: {
          id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_attempt_history: {
        Row: {
          attempted_at: string
          created_at: string
          difficulty: string
          id: string
          is_correct: boolean
          question_fingerprint: string
          question_id: string | null
          session_id: string | null
          subject: string
          test_type: string
          time_taken_seconds: number | null
          topic: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_correct: boolean
          question_fingerprint: string
          question_id?: string | null
          session_id?: string | null
          subject: string
          test_type?: string
          time_taken_seconds?: number | null
          topic?: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_correct?: boolean
          question_fingerprint?: string
          question_id?: string | null
          session_id?: string | null
          subject?: string
          test_type?: string
          time_taken_seconds?: number | null
          topic?: string
          user_id?: string
        }
        Relationships: []
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
      user_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          credits_used_today: number
          id: string
          last_reset_date: string
          total_credits_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          credits_used_today?: number
          id?: string
          last_reset_date?: string
          total_credits_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          credits_used_today?: number
          id?: string
          last_reset_date?: string
          total_credits_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string | null
          id: string
          is_guest: boolean | null
          is_public: boolean
          message: string | null
          stars: number
          status: string | null
          updated_at: string | null
          user_avatar_url: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string | null
          id?: string
          is_guest?: boolean | null
          is_public?: boolean
          message?: string | null
          stars: number
          status?: string | null
          updated_at?: string | null
          user_avatar_url?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          id?: string
          is_guest?: boolean | null
          is_public?: boolean
          message?: string | null
          stars?: number
          status?: string | null
          updated_at?: string | null
          user_avatar_url?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
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
      user_inquiries: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
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
      user_performance: {
        Row: {
          correct_attempts: number
          created_at: string
          id: string
          last_attempted_at: string | null
          question_fingerprints: string[]
          question_ids: string[]
          subject: string
          topic: string
          total_attempts: number
          updated_at: string
          user_id: string
          weakness_score: number
          wrong_attempts: number
        }
        Insert: {
          correct_attempts?: number
          created_at?: string
          id?: string
          last_attempted_at?: string | null
          question_fingerprints?: string[]
          question_ids?: string[]
          subject: string
          topic?: string
          total_attempts?: number
          updated_at?: string
          user_id: string
          weakness_score?: number
          wrong_attempts?: number
        }
        Update: {
          correct_attempts?: number
          created_at?: string
          id?: string
          last_attempted_at?: string | null
          question_fingerprints?: string[]
          question_ids?: string[]
          subject?: string
          topic?: string
          total_attempts?: number
          updated_at?: string
          user_id?: string
          weakness_score?: number
          wrong_attempts?: number
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
      user_question_mastery: {
        Row: {
          concept_group_id: string | null
          consecutive_correct: number
          correct_count: number
          incorrect_count: number
          last_attempted_at: string | null
          last_result: boolean | null
          mastery_level: string
          question_id: string
          question_source: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          concept_group_id?: string | null
          consecutive_correct?: number
          correct_count?: number
          incorrect_count?: number
          last_attempted_at?: string | null
          last_result?: boolean | null
          mastery_level?: string
          question_id: string
          question_source: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          concept_group_id?: string | null
          consecutive_correct?: number
          correct_count?: number
          incorrect_count?: number
          last_attempted_at?: string | null
          last_result?: boolean | null
          mastery_level?: string
          question_id?: string
          question_source?: string
          subject?: string | null
          updated_at?: string
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
      user_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
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
      can_user_topup: {
        Args: { p_job_test_id: string; p_subject: string; p_user_id: string }
        Returns: Json
      }
      compute_content_fingerprint: { Args: { p_text: string }; Returns: string }
      deduct_credits:
        | { Args: { p_amount: number; p_user_id: string }; Returns: Json }
        | {
            Args: {
              p_action_type?: string
              p_amount: number
              p_details?: string
              p_user_id: string
            }
            Returns: Json
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
      get_all_questions_dump: { Args: never; Returns: Json }
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
      get_board_topic_mcqs: {
        Args: {
          p_canonical_slug?: string
          p_limit?: number
          p_topic_id?: string
        }
        Returns: {
          correct_option: string
          difficulty: string
          explanation: string
          id: string
          options: Json
          title: string
        }[]
      }
      get_content_fill_progress: {
        Args: never
        Returns: {
          filled_this_month: number
          filled_this_week: number
          week_count: number
          week_start: string
        }[]
      }
      get_content_health: {
        Args: never
        Returns: {
          approved_count: number
          board_name: string
          class_number: string
          last_content_at: string
          path: string
          status: string
          subject_name: string
          topic_id: string
          topic_name: string
          view_count: number
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
      get_feedback_stats: {
        Args: never
        Returns: {
          avg_rating: number
          content_count: number
          design_count: number
          five_stars: number
          four_stars: number
          one_star: number
          other_count: number
          technical_count: number
          three_stars: number
          total_feedback: number
          two_stars: number
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
      get_indexable_board_topic_paths: {
        Args: { p_min_approved_mcqs?: number }
        Returns: {
          approved_count: number
          lastmod: string
          path: string
        }[]
      }
      get_job_practice_questions: {
        Args: { p_job_test_id: string; p_limit?: number; p_subject?: string }
        Returns: {
          difficulty: string
          id: string
          job_test_id: string
          options: Json
          question: string
          subject: string
          topic: string
        }[]
      }
      get_lifecycle_circulation_stats: { Args: never; Returns: Json }
      get_lifecycle_hot_and_stale: { Args: { p_limit?: number }; Returns: Json }
      get_lifecycle_topup_log: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          id: string
          job_test_id: string
          questions_generated: number
          reason: string
          subject: string
          success: boolean
          user_id: string
          username: string
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
      get_my_credit_history: {
        Args: { p_limit?: number }
        Returns: {
          action_type: string
          amount: number
          balance_after: number
          created_at: string
          details: string
          id: string
        }[]
      }
      get_my_credits: {
        Args: never
        Returns: {
          credits_remaining: number
          credits_used_today: number
          last_reset_date: string
          total_credits_used: number
        }[]
      }
      get_my_mastery_for_questions: {
        Args: { p_question_ids: string[] }
        Returns: {
          concept_group_id: string
          consecutive_correct: number
          last_attempted_at: string
          mastery_level: string
          question_id: string
        }[]
      }
      get_platform_stats: {
        Args: never
        Returns: {
          mcq_count: number
          satisfaction_pct: number
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
      get_practice_questions: {
        Args: {
          p_difficulties?: string[]
          p_exam_category?: string
          p_exclude_ids?: string[]
          p_is_featured?: boolean
          p_limit?: number
          p_subject_like?: string
          p_subjects?: string[]
          p_subtopics?: string[]
          p_topic_ids?: string[]
          p_topics?: string[]
        }
        Returns: {
          created_at: string
          description: string
          difficulty: string
          id: string
          is_featured: boolean
          last_used_at: string
          options: Json
          question_type: string
          reference_material: string
          subject: string
          subtopic: string
          tags: Json
          title: string
          topic: string
          topic_id: string
          usage_count: number
        }[]
      }
      get_preview_questions: {
        Args: { p_keywords: string[]; p_limit?: number }
        Returns: {
          id: string
          options: Json
          subject: string
          title: string
          topic: string
        }[]
      }
      get_public_feedback_reviews: {
        Args: { filter_rating?: number; sort_by?: string }
        Returns: {
          category: string
          created_at: string
          id: string
          is_guest: boolean
          message: string
          stars: number
          user_avatar_url: string
          user_name: string
        }[]
      }
      get_public_feedback_stats: {
        Args: never
        Returns: {
          avg_rating: number
          five_star: number
          four_star: number
          one_star: number
          three_star: number
          total_reviews: number
          two_star: number
        }[]
      }
      get_public_reviews: {
        Args: { p_limit?: number; p_min_rating?: number }
        Returns: {
          comment: string
          created_at: string
          id: string
          is_anonymous: boolean
          is_verified: boolean
          rating: number
          reviewer_initials: string
          reviewer_name: string
          reviewer_role: string
          show_name: boolean
        }[]
      }
      get_recently_active_users: {
        Args: { minutes_ago?: number }
        Returns: number
      }
      get_review_stats: {
        Args: never
        Returns: {
          avg_rating: number
          five_star: number
          four_star: number
          one_star: number
          recommend_pct: number
          three_star: number
          total_reviews: number
          two_star: number
        }[]
      }
      get_scraper_signal_log: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          endpoint: string
          id: string
          ip_hash: string
          metadata: Json
          signal_type: string
          user_agent: string
        }[]
      }
      get_scraper_signal_stats: { Args: never; Returns: Json }
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
      increment_empty_topic_view: {
        Args: { p_path: string }
        Returns: undefined
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      log_credit_transaction: {
        Args: {
          p_action_type: string
          p_amount: number
          p_balance_after?: number
          p_details?: string
          p_user_id: string
        }
        Returns: string
      }
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
      record_question_usage: {
        Args: { question_ids: string[] }
        Returns: undefined
      }
      score_job_practice_answers: {
        Args: { p_answers: Json }
        Returns: {
          correct_answer: string
          correct_option: string
          explanation: string
          id: string
          is_correct: boolean
        }[]
      }
      score_practice_answers: {
        Args: { p_answers: Json }
        Returns: {
          correct_answer: string
          correct_option: string
          explanation: string
          id: string
          is_correct: boolean
        }[]
      }
      update_job_test_progress: {
        Args: {
          p_ip_address: unknown
          p_job_test_id: string
          p_score: number
          p_user_id: string
          p_weak_topics?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      agent_task_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "review"
      agent_task_type: "blog" | "mcq" | "scholarship" | "job"
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
    Enums: {
      agent_task_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "review",
      ],
      agent_task_type: ["blog", "mcq", "scholarship", "job"],
    },
  },
} as const
