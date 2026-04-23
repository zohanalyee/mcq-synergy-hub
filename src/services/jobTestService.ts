import { supabase } from "@/integrations/supabase/client";

export interface SyllabusItem {
  topic: string;
  percentage: number;
}

export interface JobTest {
  id: string;
  title: string;
  description: string;
  organization: string;
  duration: number;
  questions: number;
  syllabus: SyllabusItem[];
  created_at?: string;
  updated_at?: string;
}

// ---------- Legacy job_tests (kept for current admin UI compatibility) ----------

export const getJobTests = async (): Promise<JobTest[]> => {
  const { data, error } = await supabase
    .from("job_tests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error loading job tests:", error);
    return [];
  }
  return (data || []).map((d: any) => ({
    ...d,
    syllabus: Array.isArray(d.syllabus) ? d.syllabus : JSON.parse(d.syllabus || "[]"),
  }));
};

export const addJobTest = async (jobTest: Omit<JobTest, "id">): Promise<JobTest | null> => {
  const { data, error } = await supabase
    .from("job_tests")
    .insert({
      title: jobTest.title,
      description: jobTest.description || "",
      organization: jobTest.organization,
      duration: jobTest.duration,
      questions: jobTest.questions,
      syllabus: jobTest.syllabus as any,
    })
    .select()
    .single();
  if (error) {
    console.error("Error adding job test:", error);
    return null;
  }
  const syllabus = typeof data.syllabus === "string" ? JSON.parse(data.syllabus) : (data.syllabus as any[] || []);
  return { ...data, syllabus } as JobTest;
};

export const updateJobTest = async (jobTest: JobTest): Promise<JobTest | null> => {
  const { data, error } = await supabase
    .from("job_tests")
    .update({
      title: jobTest.title,
      description: jobTest.description,
      organization: jobTest.organization,
      duration: jobTest.duration,
      questions: jobTest.questions,
      syllabus: jobTest.syllabus as any,
    })
    .eq("id", jobTest.id)
    .select()
    .single();
  if (error) {
    console.error("Error updating job test:", error);
    return null;
  }
  const syllabus = typeof data.syllabus === "string" ? JSON.parse(data.syllabus) : (data.syllabus as any[] || []);
  return { ...data, syllabus } as JobTest;
};

export const removeJobTest = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("job_tests").delete().eq("id", id);
  if (error) {
    console.error("Error removing job test:", error);
    return false;
  }
  return true;
};

// ---------- Isolated Job Test System (new) ----------

export interface JobSyllabusSection {
  subject: string;
  percentage: number;
  question_count: number;
  topics: string[];
  style_guide?: string;
  forbidden?: string[];
}

export interface JobSampleQuestion {
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation?: string;
}

export interface JobTestDefinition {
  id: string;
  job_title: string;
  department: string | null;
  status: "draft" | "published" | "archived";
  syllabus: { sections: JobSyllabusSection[] };
  sample_questions: Record<string, JobSampleQuestion[]>;
  difficulty_distribution: { easy: number; medium: number; hard: number };
  min_questions_per_topic: number;
  max_retries: number;
  created_at?: string;
  updated_at?: string;
}

export interface JobTestQuestion {
  id: string;
  job_test_id: string;
  subject: string;
  topic: string | null;
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
  admin_approved: boolean;
  generation_batch: number | null;
  validation_score: number | null;
  times_used: number;
  times_correct: number;
  created_at?: string;
}

export interface JobTestGenerationLog {
  id: string;
  job_test_id: string | null;
  subject: string;
  requested_count: number | null;
  generated_count: number;
  accepted_count: number;
  rejected_count: number;
  rejection_reasons: Record<string, number>;
  api_calls_made: number;
  generation_time_seconds: number | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export const getJobTestDefinitions = async (): Promise<JobTestDefinition[]> => {
  const { data, error } = await (supabase as any)
    .from("job_test_definitions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error loading job test definitions:", error);
    return [];
  }
  return (data || []) as JobTestDefinition[];
};

export const getJobTestDefinition = async (id: string): Promise<JobTestDefinition | null> => {
  const { data, error } = await (supabase as any)
    .from("job_test_definitions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Error loading definition:", error);
    return null;
  }
  return data as JobTestDefinition;
};

export const findDefinitionByTitle = async (title: string): Promise<JobTestDefinition | null> => {
  const { data, error } = await (supabase as any)
    .from("job_test_definitions")
    .select("*")
    .eq("job_title", title)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("Error finding definition:", error);
    return null;
  }
  return (data as JobTestDefinition) || null;
};

export const upsertJobTestDefinition = async (
  def: Partial<JobTestDefinition> & { job_title: string },
): Promise<JobTestDefinition | null> => {
  const payload: any = { ...def };
  if (def.id) {
    const { data, error } = await (supabase as any)
      .from("job_test_definitions")
      .update(payload)
      .eq("id", def.id)
      .select()
      .single();
    if (error) {
      console.error("Error updating definition:", error);
      return null;
    }
    return data as JobTestDefinition;
  } else {
    const { data, error } = await (supabase as any)
      .from("job_test_definitions")
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error("Error creating definition:", error);
      return null;
    }
    return data as JobTestDefinition;
  }
};

export const getApprovedQuestionsForDefinition = async (
  jobTestId: string,
): Promise<JobTestQuestion[]> => {
  const { data, error } = await (supabase as any)
    .from("job_test_questions")
    .select("*")
    .eq("job_test_id", jobTestId)
    .eq("admin_approved", true);
  if (error) {
    console.error("Error loading approved questions:", error);
    return [];
  }
  return (data || []) as JobTestQuestion[];
};

export const getQuestionsForDefinition = async (
  jobTestId: string,
  options?: { subject?: string; approvedOnly?: boolean },
): Promise<JobTestQuestion[]> => {
  let q = (supabase as any)
    .from("job_test_questions")
    .select("*")
    .eq("job_test_id", jobTestId);
  if (options?.subject) q = q.eq("subject", options.subject);
  if (options?.approvedOnly) q = q.eq("admin_approved", true);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) {
    console.error("Error loading questions:", error);
    return [];
  }
  return (data || []) as JobTestQuestion[];
};

export const setQuestionApproval = async (id: string, approved: boolean) => {
  const { error } = await (supabase as any)
    .from("job_test_questions")
    .update({ admin_approved: approved })
    .eq("id", id);
  if (error) console.error("Error updating approval:", error);
  return !error;
};

export const deleteJobTestQuestion = async (id: string) => {
  const { error } = await (supabase as any)
    .from("job_test_questions")
    .delete()
    .eq("id", id);
  return !error;
};

export const getGenerationLogs = async (
  jobTestId: string,
): Promise<JobTestGenerationLog[]> => {
  const { data, error } = await (supabase as any)
    .from("job_test_generation_logs")
    .select("*")
    .eq("job_test_id", jobTestId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("Error loading logs:", error);
    return [];
  }
  return (data || []) as JobTestGenerationLog[];
};

export const generateForSubject = async (
  jobTestId: string,
  subject?: string,
): Promise<{ success: boolean; message: string; results?: any[] }> => {
  const { data, error } = await supabase.functions.invoke("generate-job-test", {
    body: { job_test_id: jobTestId, subject },
  });
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, message: "Generation complete", results: data?.results };
};
