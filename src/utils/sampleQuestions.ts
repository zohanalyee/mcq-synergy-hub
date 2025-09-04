import { supabase } from "@/integrations/supabase/client";

export const sampleQuestions = [
  {
    title: "Basic Mathematics - Addition",
    description: "What is the sum of 15 + 27?",
    category: "mcq",
    subject: "Mathematics",
    topic: "Arithmetic",
    subtopic: "Addition",
    difficulty: "Easy",
    correct_option: "C",
    explanation: "15 + 27 = 42. This is basic addition.",
    options: {
      A: "40",
      B: "41", 
      C: "42",
      D: "43"
    },
    question_type: "mcq",
    status: "approved",
    marks: 1,
    show_in_subjects: true,
    show_in_syllabus: true,
    show_in_mock_tests: true
  },
  {
    title: "Physics - Laws of Motion",
    description: "According to Newton's first law of motion, an object at rest will:",
    category: "mcq",
    subject: "Physics",
    topic: "Mechanics",
    subtopic: "Laws of Motion",
    difficulty: "Medium",
    correct_option: "A",
    explanation: "Newton's first law states that an object at rest stays at rest unless acted upon by an external force.",
    options: {
      A: "Stay at rest unless acted upon by a force",
      B: "Start moving automatically",
      C: "Move in a circular path",
      D: "Accelerate continuously"
    },
    question_type: "mcq",
    status: "approved",
    marks: 2,
    show_in_subjects: true,
    show_in_syllabus: true,
    show_in_mock_tests: true
  },
  {
    title: "Chemistry - Periodic Table",
    description: "What is the chemical symbol for Gold?",
    category: "mcq",
    subject: "Chemistry",
    topic: "Periodic Table",
    subtopic: "Elements",
    difficulty: "Easy",
    correct_option: "B",
    explanation: "Au is the chemical symbol for Gold, derived from the Latin word 'aurum'.",
    options: {
      A: "Go",
      B: "Au",
      C: "Gd",
      D: "Ag"
    },
    question_type: "mcq",
    status: "approved",
    marks: 1,
    show_in_subjects: true,
    show_in_syllabus: true,
    show_in_mock_tests: true
  },
  {
    title: "General Knowledge - Geography",
    description: "Which is the largest continent by area?",
    category: "mcq",
    subject: "General Knowledge",
    topic: "Geography",
    subtopic: "Continents",
    difficulty: "Easy",
    correct_option: "A",
    explanation: "Asia is the largest continent covering about 30% of Earth's total land area.",
    options: {
      A: "Asia",
      B: "Africa",
      C: "North America",
      D: "Europe"
    },
    question_type: "mcq",
    status: "approved",
    marks: 1,
    show_in_subjects: true,
    show_in_syllabus: true,
    show_in_mock_tests: true
  },
  {
    title: "Computer Science - Programming",
    description: "Which of the following is a programming language?",
    category: "mcq",
    subject: "Computer Science",
    topic: "Programming",
    subtopic: "Languages",
    difficulty: "Easy",
    correct_option: "C",
    explanation: "Python is a high-level programming language widely used for software development.",
    options: {
      A: "HTML",
      B: "CSS",
      C: "Python",
      D: "JSON"
    },
    question_type: "mcq",
    status: "approved",
    marks: 1,
    show_in_subjects: true,
    show_in_syllabus: true,
    show_in_mock_tests: true
  }
];

export const sampleSubjects = [
  { name: "Mathematics", category: "Science", description: "Mathematical concepts and problem solving" },
  { name: "Physics", category: "Science", description: "Physical sciences and natural phenomena" },
  { name: "Chemistry", category: "Science", description: "Chemical elements, compounds and reactions" },
  { name: "General Knowledge", category: "General", description: "General awareness and current affairs" },
  { name: "Computer Science", category: "Technology", description: "Computing, programming and technology" }
];

export const sampleTopics = [
  { name: "Arithmetic", subject: "Mathematics" },
  { name: "Algebra", subject: "Mathematics" },
  { name: "Mechanics", subject: "Physics" },
  { name: "Thermodynamics", subject: "Physics" },
  { name: "Periodic Table", subject: "Chemistry" },
  { name: "Organic Chemistry", subject: "Chemistry" },
  { name: "Geography", subject: "General Knowledge" },
  { name: "History", subject: "General Knowledge" },
  { name: "Programming", subject: "Computer Science" },
  { name: "Data Structures", subject: "Computer Science" }
];

export const insertSampleData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      return false;
    }

    // Insert subjects first
    const { error: subjectsError } = await supabase
      .from('subjects')
      .upsert(sampleSubjects, { onConflict: 'name' });

    if (subjectsError) {
      console.error("Error inserting subjects:", subjectsError);
      return false;
    }

    // Get subject IDs and insert topics
    for (const topic of sampleTopics) {
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', topic.subject)
        .single();

      if (subjectData) {
        await supabase
          .from('topics')
          .upsert(
            { name: topic.name, subject_id: subjectData.id },
            { onConflict: 'name,subject_id' }
          );
      }
    }

    // Insert sample questions
    const questionsToInsert = sampleQuestions.map(q => ({
      ...q,
      created_by: user.id
    }));

    const { error: questionsError } = await supabase
      .from('content_items')
      .upsert(questionsToInsert, { onConflict: 'title' });

    if (questionsError) {
      console.error("Error inserting questions:", questionsError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error inserting sample data:", error);
    return false;
  }
};