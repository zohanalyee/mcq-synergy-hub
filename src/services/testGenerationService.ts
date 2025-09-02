import { getQuestionBank, QuestionFilters, QuestionBankItem } from './questionBankService';
import { MCQItem } from '@/interfaces/content';

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
}

export interface GeneratedTest {
  id: string;
  title: string;
  questions: QuestionBankItem[];
  timeLimit: number;
  totalMarks: number;
  instructions: string[];
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

// Generate custom test with specific options
export const generateCustomTest = async (options: TestGenerationOptions): Promise<GeneratedTest | null> => {
  try {
    const filters: QuestionFilters = {
      subjects: options.subjects,
      topics: options.topics,
      subtopics: options.subtopics,
      limit: options.questionCount * 3 // Get more questions for better selection
    };

    // Handle difficulty filtering
    if (options.difficulty !== 'mixed') {
      const difficultyMap = {
        'easy': ['Easy'],
        'medium': ['Medium'],
        'hard': ['Hard']
      };
      filters.difficulties = difficultyMap[options.difficulty];
    }

    const availableQuestions = await getQuestionBank(filters);

    if (availableQuestions.length === 0) {
      console.error("No questions available for the specified criteria");
      return null;
    }

    let selectedQuestions = availableQuestions;

    // If mixed difficulty, try to balance the questions
    if (options.difficulty === 'mixed') {
      selectedQuestions = balanceQuestionsByDifficulty(availableQuestions, options.questionCount);
    } else {
      // Shuffle and select the requested number
      selectedQuestions = selectedQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, options.questionCount);
    }

    // Shuffle questions if requested
    if (options.shuffleQuestions) {
      selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
    }

    // Shuffle options if requested
    if (options.shuffleOptions) {
      selectedQuestions = selectedQuestions.map(shuffleQuestionOptions);
    }

    const generatedTest: GeneratedTest = {
      id: crypto.randomUUID(),
      title: generateTestTitle(options.subjects, options.topics),
      questions: selectedQuestions,
      timeLimit: options.timeLimit,
      totalMarks: selectedQuestions.length, // 1 mark per question
      instructions: generateTestInstructions(options),
      metadata: {
        subjects: options.subjects,
        topics: options.topics,
        difficulty: options.difficulty,
        questionCount: selectedQuestions.length,
        generatedAt: new Date().toISOString()
      }
    };

    return generatedTest;
  } catch (error) {
    console.error("Error generating custom test:", error);
    return null;
  }
};

// Balance questions by difficulty for mixed difficulty tests
const balanceQuestionsByDifficulty = (questions: QuestionBankItem[], targetCount: number): QuestionBankItem[] => {
  const easyQuestions = questions.filter(q => q.difficulty === 'Easy');
  const mediumQuestions = questions.filter(q => q.difficulty === 'Medium');
  const hardQuestions = questions.filter(q => q.difficulty === 'Hard');

  // Aim for 40% easy, 40% medium, 20% hard
  const easyCount = Math.floor(targetCount * 0.4);
  const mediumCount = Math.floor(targetCount * 0.4);
  const hardCount = targetCount - easyCount - mediumCount;

  const selectedQuestions: QuestionBankItem[] = [];

  // Add questions from each difficulty level
  selectedQuestions.push(...easyQuestions.sort(() => Math.random() - 0.5).slice(0, easyCount));
  selectedQuestions.push(...mediumQuestions.sort(() => Math.random() - 0.5).slice(0, mediumCount));
  selectedQuestions.push(...hardQuestions.sort(() => Math.random() - 0.5).slice(0, hardCount));

  // If we don't have enough questions in some difficulties, fill from available questions
  if (selectedQuestions.length < targetCount) {
    const remaining = questions.filter(q => !selectedQuestions.find(sq => sq.id === q.id));
    selectedQuestions.push(...remaining.sort(() => Math.random() - 0.5).slice(0, targetCount - selectedQuestions.length));
  }

  return selectedQuestions.slice(0, targetCount);
};

// Shuffle question options while maintaining correct answer
const shuffleQuestionOptions = (question: QuestionBankItem): QuestionBankItem => {
  const options = ['A', 'B', 'C', 'D'];
  const shuffledOptions = options.sort(() => Math.random() - 0.5);
  
  const originalOptions = { ...question.options };
  const newOptions = { A: '', B: '', C: '', D: '' };
  
  // Create new option mapping
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
      // Fallback to any recent questions if no featured questions
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