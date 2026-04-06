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
  const syllabus = typeof data.syllabus === 'string' ? JSON.parse(data.syllabus) : (data.syllabus as any[] || []);
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
  return { ...data, syllabus: Array.isArray(data.syllabus) ? data.syllabus : JSON.parse(data.syllabus || "[]") };
};

export const removeJobTest = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("job_tests").delete().eq("id", id);
  if (error) {
    console.error("Error removing job test:", error);
    return false;
  }
  return true;
};
