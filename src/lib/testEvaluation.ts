/**
 * Shared test answer evaluation utilities.
 * Handles all question formats: edge function (answer + array options),
 * syllabus builder (correctOption + object options), question bank (correctOption + object options).
 */

/**
 * Normalize options to an array regardless of input format.
 */
export function normalizeOptions(options: any): string[] {
  if (Array.isArray(options)) return options.map(o => String(o));
  if (options && typeof options === 'object') {
    const keys = ['A', 'B', 'C', 'D'];
    return keys.map(k => options[k]).filter(Boolean).map(o => String(o));
  }
  return [];
}

/**
 * Extract the correct answer text from a question object.
 * Handles all field naming variants and resolves letter keys to option text.
 */
export function resolveCorrectAnswer(question: any): string {
  // Try all possible field names for the correct answer
  const raw = (
    question.answer ||
    question.correct_option ||
    question.correctOption ||
    question.correct_answer ||   // job_test_questions / DB snake_case
    question.correctAnswer ||    // defensive camelCase variant
    ''
  ).toString().trim();

  if (!raw) return '';

  // If it's a letter key (A-D), resolve to the actual option text
  const upperRaw = raw.toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(upperRaw) && question.options) {
    if (Array.isArray(question.options)) {
      const idx = upperRaw.charCodeAt(0) - 65;
      if (question.options[idx]) return String(question.options[idx]).trim();
    } else if (typeof question.options === 'object') {
      // Object format: { A: "text", B: "text", ... }
      if (question.options[upperRaw]) return String(question.options[upperRaw]).trim();
    }
  }

  return raw;
}

/**
 * Check if a user's answer matches the correct answer for a question.
 */
export function checkUserAnswer(question: any, userAnswer: string | undefined): boolean {
  if (!userAnswer) return false;
  const correctText = resolveCorrectAnswer(question);
  if (!correctText) return false;
  return userAnswer.trim().toLowerCase() === correctText.toLowerCase();
}

/**
 * Normalize a loaded question into a canonical shape with `answer` field resolved to text.
 * Use when loading questions from custom_test_sessions to ensure consistency.
 */
export function normalizeQuestion(q: any): any {
  return {
    ...q,
    options: q.options, // keep original format for QuestionCard
    answer: resolveCorrectAnswer(q), // always set answer as resolved text
  };
}
