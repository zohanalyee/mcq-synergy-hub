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
          is_featured: boolean | null
          last_used_at: string | null
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
          status: string
          subject: string | null
          subtopic: string | null
          tags: string[] | null
          time_limit: number | null
          title: string
          topic: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
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
          is_featured?: boolean | null
          last_used_at?: string | null
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
          status?: string
          subject?: string | null
          subtopic?: string | null
          tags?: string[] | null
          time_limit?: number | null
          title: string
          topic?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
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
          is_featured?: boolean | null
          last_used_at?: string | null
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
          status?: string
          subject?: string | null
          subtopic?: string | null
          tags?: string[] | null
          time_limit?: number | null
          title?: string
          topic?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
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
      subjects: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
          created_at: string
          description: string | null
          id: string
          name: string
          subject_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          subject_id?: string | null
        }
        Update: {
          created_at?: string
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
      get_student_weaknesses: {
        Args: { target_user_id: string }
        Returns: {
          average_score: number
          subject: string
          tests_count: number
        }[]
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
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
