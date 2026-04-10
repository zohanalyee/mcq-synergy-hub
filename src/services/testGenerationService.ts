import { getQuestionBank, QuestionFilters, QuestionBankItem } from './questionBankService';

// Fisher-Yates shuffle for true randomization
const fisherYatesShuffle = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export interface TestGenerationOptions {
  subjects: string[];
  topics: string[];
  subtopics?: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  timeLimit: number;
  includeExplanations: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  syllabusWeights?: Record<string, number>; // e.g. { "English": 40, "Math": 10 }
  excludeQuestionIds?: string[]; // IDs of questions user has already answered
}

export interface GeneratedTest {
  id: string;
  title: string;
  questions: QuestionBankItem[];
  timeLimit: number;
  totalMarks: number;
  instructions: string[];
  deficit: number;
  aiGenerationNeeded: boolean;
  metadata: {
    subjects: string[];
    topics: string[];
    difficulty: string;
    questionCount: number;
    generatedAt: string;
  };
}

// Generate test based on syllabus selection
export const generateTestFromSyllabus = async (
  selectedTopics: { subject: string; topic: string; subtopic?: string }[],
  options: Partial<TestGenerationOptions> = {}
): Promise<GeneratedTest | null> => {
  try {
    const subjects = [...new Set(selectedTopics.map(t => t.subject))];
    const topics = [...new Set(selectedTopics.map(t => t.topic))];
    const subtopics = [...new Set(selectedTopics.map(t => t.subtopic).filter(Boolean))] as string[];

    const testOptions: TestGenerationOptions = {
      subjects,
      topics,
      subtopics,
      difficulty: options.difficulty || 'mixed',
      questionCount: options.questionCount || 20,
      timeLimit: options.timeLimit || 30,
      includeExplanations: options.includeExplanations ?? true,
      shuffleQuestions: options.shuffleQuestions ?? true,
      shuffleOptions: options.shuffleOptions ?? true
    };

    return await generateCustomTest(testOptions);
  } catch (error) {
    console.error("Error generating test from syllabus:", error);
    return null;
  }
};

// Fetch questions for a single subject with quota
const fetchSubjectQuota = async (
  subject: string,
  quota: number,
  options: TestGenerationOptions
): Promise<QuestionBankItem[]> => {
  const filters: QuestionFilters = {
    topics: [subject],  // Search by topic name (syllabus topics map to DB topics)
    limit: quota * 3,
    excludeIds: options.excludeQuestionIds,
  };

  if (options.difficulty !== 'mixed') {
    const difficultyMap = { 'easy': ['Easy'], 'medium': ['Medium'], 'hard': ['Hard'] };
    filters.difficulties = difficultyMap[options.difficulty];
  }

  let questions = await getQuestionBank(filters);

  // Fallback: try subject field instead of topic
  if (questions.length < quota) {
    const subjectFilters: QuestionFilters = {
      subjects: [subject],
      limit: quota * 3,
      excludeIds: options.excludeQuestionIds,
    };
    if (options.difficulty !== 'mixed') {
      const difficultyMap = { 'easy': ['Easy'], 'medium': ['Medium'], 'hard': ['Hard'] };
      subjectFilters.difficulties = difficultyMap[options.difficulty];
    }
    const extra = await getQuestionBank(subjectFilters);
    const existingIds = new Set(questions.map(q => q.id));
    questions = [...questions, ...extra.filter(q => !existingIds.has(q.id))];
  }

  // Fallback: remove difficulty filter
  if (questions.length < quota && options.difficulty !== 'mixed') {
    const relaxedFilters: QuestionFilters = {
      topics: [subject],
      subjects: [subject],
      limit: quota * 3,
      excludeIds: options.excludeQuestionIds,
    };
    const extra = await getQuestionBank(relaxedFilters);
    const existingIds = new Set(questions.map(q => q.id));
    questions = [...questions, ...extra.filter(q => !existingIds.has(q.id))];
  }

  return fisherYatesShuffle(questions).slice(0, quota);
};

// Generate custom test — NEVER throws, always returns a valid test object
export const generateCustomTest = async (options: TestGenerationOptions): Promise<GeneratedTest> => {
  console.log('🎯 Generating test with options:', {
    subjects: options.subjects,
    topics: options.topics,
    difficulty: options.difficulty,
    questionCount: options.questionCount,
    timeLimit: options.timeLimit,
    syllabusWeights: options.syllabusWeights,
    excludeCount: options.excludeQuestionIds?.length || 0,
  });

  let selectedQuestions: QuestionBankItem[];

  // ============= SYLLABUS WEIGHTS PATH =============
  if (options.syllabusWeights && Object.keys(options.syllabusWeights).length > 0) {
    console.log('📐 Using syllabus percentage math for per-subject quotas');
    const totalWeight = Object.values(options.syllabusWeights).reduce((a, b) => a + b, 0);
    const allQuestions: QuestionBankItem[] = [];

    for (const [subject, weight] of Object.entries(options.syllabusWeights)) {
      const quota = Math.max(1, Math.round((weight / totalWeight) * options.questionCount));
      console.log(`  📊 ${subject}: ${weight}% → ${quota} questions`);
      const subjectQuestions = await fetchSubjectQuota(subject, quota, options);
      console.log(`  ✅ ${subject}: fetched ${subjectQuestions.length}/${quota}`);
      allQuestions.push(...subjectQuestions);
    }

    selectedQuestions = fisherYatesShuffle(allQuestions);
  } else {
    // ============= ORIGINAL FLAT PATH (with excludeIds support) =============
    const filters: QuestionFilters = {
      subjects: options.subjects,
      topics: options.topics.length > 0 ? options.topics : undefined,
      subtopics: options.subtopics,
      limit: options.questionCount * 3,
      excludeIds: options.excludeQuestionIds,
    };

    if (options.difficulty !== 'mixed') {
      const difficultyMap = { 'easy': ['Easy'], 'medium': ['Medium'], 'hard': ['Hard'] };
      filters.difficulties = difficultyMap[options.difficulty];
    }

    let availableQuestions = await getQuestionBank(filters);
    console.log(`📊 Strict filter: found ${availableQuestions.length} questions`);

    // --- Step 2: Difficulty fallback ---
    if (availableQuestions.length < options.questionCount && options.difficulty !== 'mixed') {
      console.log('🔄 Fallback: removing difficulty filter');
      const fallbackFilters = { ...filters };
      delete fallbackFilters.difficulties;
      const fallbackQuestions = await getQuestionBank(fallbackFilters);
      const existingIds = new Set(availableQuestions.map(q => q.id));
      availableQuestions = [...availableQuestions, ...fallbackQuestions.filter(q => !existingIds.has(q.id))];
      console.log(`📊 After difficulty fallback: ${availableQuestions.length} questions`);
    }

    // --- Step 3: Cross-pollination ---
    if (availableQuestions.length < options.questionCount && options.topics.length > 0) {
      console.log('🔄 Fallback: topic-only cross-pollination');
      const topicOnlyFilters: QuestionFilters = {
        topics: options.topics,
        limit: options.questionCount * 3,
        excludeIds: options.excludeQuestionIds,
      };
      const crossQuestions = await getQuestionBank(topicOnlyFilters);
      const existingIds = new Set(availableQuestions.map(q => q.id));
      availableQuestions = [...availableQuestions, ...crossQuestions.filter(q => !existingIds.has(q.id))];
      console.log(`📊 After cross-pollination: ${availableQuestions.length} questions`);
    }

    // --- Step 4: Subject-only fallback ---
    if (availableQuestions.length < options.questionCount) {
      console.log('🔄 Fallback: subject-only (any topic)');
      const subjectOnlyFilters: QuestionFilters = {
        subjects: options.subjects,
        limit: options.questionCount * 3,
        excludeIds: options.excludeQuestionIds,
      };
      const subjectQuestions = await getQuestionBank(subjectOnlyFilters);
      const existingIds = new Set(availableQuestions.map(q => q.id));
      availableQuestions = [...availableQuestions, ...subjectQuestions.filter(q => !existingIds.has(q.id))];
      console.log(`📊 After subject fallback: ${availableQuestions.length} questions`);
    }

    availableQuestions = fisherYatesShuffle(availableQuestions);

    if (availableQuestions.length === 0) {
      selectedQuestions = [];
    } else if (options.difficulty === 'mixed' && availableQuestions.length >= options.questionCount) {
      selectedQuestions = balanceQuestionsByDifficulty(availableQuestions, options.questionCount);
    } else {
      selectedQuestions = availableQuestions.slice(0, options.questionCount);
    }
  }

  // ============= ABSOLUTE SAFETY NET: STRICT SLICE =============
  selectedQuestions = selectedQuestions.slice(0, options.questionCount);

  // Shuffle questions if requested (Fisher-Yates)
  if (options.shuffleQuestions) {
    selectedQuestions = fisherYatesShuffle(selectedQuestions);
  }

  // Shuffle options if requested
  if (options.shuffleOptions) {
    selectedQuestions = selectedQuestions.map(shuffleQuestionOptions);
  }

  const deficit = Math.max(0, options.questionCount - selectedQuestions.length);

  const generatedTest: GeneratedTest = {
    id: crypto.randomUUID(),
    title: generateTestTitle(options.subjects, options.topics),
    questions: selectedQuestions,
    timeLimit: options.timeLimit,
    totalMarks: options.questionCount,
    instructions: generateTestInstructions(options),
    deficit,
    aiGenerationNeeded: deficit > 0,
    metadata: {
      subjects: options.subjects,
      topics: options.topics,
      difficulty: options.difficulty,
      questionCount: options.questionCount,
      generatedAt: new Date().toISOString()
    }
  };

  console.log(`✅ Test generated: ${selectedQuestions.length} from bank, deficit: ${deficit}`);
  return generatedTest;
};

// Balance questions by difficulty for mixed difficulty tests
const balanceQuestionsByDifficulty = (questions: QuestionBankItem[], targetCount: number): QuestionBankItem[] => {
  const easyQuestions = questions.filter(q => q.difficulty === 'Easy');
  const mediumQuestions = questions.filter(q => q.difficulty === 'Medium');
  const hardQuestions = questions.filter(q => q.difficulty === 'Hard');

  const easyCount = Math.floor(targetCount * 0.4);
  const mediumCount = Math.floor(targetCount * 0.4);
  const hardCount = targetCount - easyCount - mediumCount;

  const selectedQuestions: QuestionBankItem[] = [];
  selectedQuestions.push(...fisherYatesShuffle(easyQuestions).slice(0, easyCount));
  selectedQuestions.push(...fisherYatesShuffle(mediumQuestions).slice(0, mediumCount));
  selectedQuestions.push(...fisherYatesShuffle(hardQuestions).slice(0, hardCount));

  if (selectedQuestions.length < targetCount) {
    const remaining = questions.filter(q => !selectedQuestions.find(sq => sq.id === q.id));
    selectedQuestions.push(...fisherYatesShuffle(remaining).slice(0, targetCount - selectedQuestions.length));
  }

  return selectedQuestions.slice(0, targetCount);
};

// Shuffle question options while maintaining correct answer
const shuffleQuestionOptions = (question: QuestionBankItem): QuestionBankItem => {
  const options = ['A', 'B', 'C', 'D'];
  const shuffledOptions = fisherYatesShuffle(options);
  
  const originalOptions = { ...question.options };
  const newOptions = { A: '', B: '', C: '', D: '' };
  
  const optionMap: Record<string, string> = {};
  shuffledOptions.forEach((newKey, index) => {
    const originalKey = options[index];
    newOptions[newKey as keyof typeof newOptions] = originalOptions[originalKey as keyof typeof originalOptions];
    optionMap[originalKey] = newKey;
  });

  return {
    ...question,
    options: newOptions,
    correctOption: optionMap[question.correctOption] as 'A' | 'B' | 'C' | 'D'
  };
};

// Generate test title based on subjects and topics
const generateTestTitle = (subjects: string[], topics: string[]): string => {
  if (subjects.length === 1 && topics.length === 1) {
    return `${subjects[0]} - ${topics[0]} Practice Test`;
  } else if (subjects.length === 1) {
    return `${subjects[0]} Mock Test`;
  } else {
    return `Mixed Subjects Practice Test`;
  }
};

// Generate test instructions
const generateTestInstructions = (options: TestGenerationOptions): string[] => {
  const instructions = [
    `This test contains ${options.questionCount} multiple-choice questions.`,
    `Time limit: ${options.timeLimit} minutes.`,
    `Each question carries 1 mark.`,
    `Select the best answer for each question.`,
    `Once submitted, you cannot change your answers.`
  ];

  if (options.includeExplanations) {
    instructions.push(`Explanations will be shown after submission.`);
  }

  return instructions;
};

// Generate daily/weekly quiz from question bank
export const generateQuizOfTheDay = async (subject?: string): Promise<GeneratedTest | null> => {
  try {
    const filters: QuestionFilters = {
      is_featured: true,
      limit: 5
    };

    if (subject) {
      filters.subjects = [subject];
    }

    const featuredQuestions = await getQuestionBank(filters);

    if (featuredQuestions.length === 0) {
      const recentQuestions = await getQuestionBank({
        subjects: subject ? [subject] : undefined,
        limit: 5
      });
      
      if (recentQuestions.length === 0) {
        return null;
      }

      return {
        id: crypto.randomUUID(),
        title: `${subject || 'Daily'} Quiz Challenge`,
        questions: recentQuestions.slice(0, 5),
        timeLimit: 5,
        totalMarks: 5,
        deficit: 0,
        aiGenerationNeeded: false,
        instructions: [
          "Daily quiz challenge - 5 questions",
          "Time limit: 5 minutes",
          "Test your knowledge and improve your skills!"
        ],
        metadata: {
          subjects: subject ? [subject] : [],
          topics: [],
          difficulty: 'mixed',
          questionCount: 5,
          generatedAt: new Date().toISOString()
        }
      };
    }

    return {
      id: crypto.randomUUID(),
      title: `${subject || 'Featured'} Quiz of the Day`,
      questions: featuredQuestions.slice(0, 5),
      timeLimit: 5,
      totalMarks: 5,
      deficit: 0,
      aiGenerationNeeded: false,
      instructions: [
        "Featured questions of the day",
        "Time limit: 5 minutes",
        "Carefully selected high-quality questions"
      ],
      metadata: {
        subjects: subject ? [subject] : [],
        topics: [],
        difficulty: 'mixed',
        questionCount: 5,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Error generating quiz of the day:", error);
    return null;
  }
};
