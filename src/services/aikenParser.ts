import { CSVProcessingResult, CSV_TEMPLATES } from '@/services/csvProcessorService';
import { ContentSubmission } from '@/interfaces/content';

// Simple AIKEN format parser for MCQs
// Format:
// Question text
// A. Option text
// B. Option text
// C. Option text
// D. Option text
// ANSWER: B
// (Blank line separates questions)

export function parseAiken(text: string, defaults?: { subject?: string; topic?: string; difficulty?: 'Easy' | 'Medium' | 'Hard' }): CSVProcessingResult {
  const result: CSVProcessingResult = { items: [], errors: [], warnings: [] };

  const blocks = text
    .split(/\n\s*\n/g) // split by blank lines
    .map(b => b.trim())
    .filter(Boolean);

  let index = 0;
  for (const block of blocks) {
    index++;
    try {
      const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 6) {
        result.errors.push(`Block ${index}: Not enough lines for AIKEN format`);
        continue;
      }

      const question = lines[0];
      const optionsMap: Record<'A'|'B'|'C'|'D', string> = { A: '', B: '', C: '', D: '' };

      for (let i = 1; i <= 4; i++) {
        const line = lines[i];
        const match = line.match(/^([ABCD])\.?\s+(.*)$/i);
        if (!match) throw new Error(`Invalid option format on line ${i + 1}`);
        const key = match[1].toUpperCase() as 'A'|'B'|'C'|'D';
        optionsMap[key] = match[2].trim();
      }

      const answerLine = lines.slice(5).find(l => /^ANSWER\s*:/i.test(l));
      if (!answerLine) throw new Error('Missing ANSWER: line');
      const ansMatch = answerLine.match(/^ANSWER\s*:\s*([ABCD])/i);
      if (!ansMatch) throw new Error('Invalid ANSWER: value');
      const correct = ansMatch[1].toUpperCase() as 'A'|'B'|'C'|'D';

      const item: ContentSubmission = {
        category: 'mcq',
        title: question.slice(0, 80),
        description: question,
        tags: [],
        subject: defaults?.subject || 'General',
        topic: defaults?.topic || 'Misc',
        difficulty: defaults?.difficulty || 'Medium',
        explanation: '',
        options: { A: optionsMap.A, B: optionsMap.B, C: optionsMap.C, D: optionsMap.D },
        correctOption: correct,
      };

      // Basic validation
      if (!item.options?.A || !item.options?.B || !item.options?.C || !item.options?.D) {
        throw new Error('All four options A-D are required');
      }

      result.items.push(item);
    } catch (e: any) {
      result.errors.push(`Block ${index}: ${e.message || e}`);
    }
  }

  if (result.items.length > 0) {
    // Warn when using defaults for subject/topic
    if (result.items.some(i => i.subject === 'General' || i.topic === 'Misc')) {
      result.warnings.push('Subject/Topic defaulted to General/Misc. Consider mapping before publishing.');
    }
  }

  return result;
}
