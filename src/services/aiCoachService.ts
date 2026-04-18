/**
 * AI Coach Service — Phase 1 Foundation
 *
 * Centralized user performance tracking and personalization for AI test generation.
 * - Tracks per (user × subject × topic) attempt counts and weakness scoring
 * - Stores both DB question IDs and normalized text fingerprints (sha256) for durable
 *   exclusion across cached AND AI-generated questions (which often lack stable IDs).
 * - All methods are safe-by-default: never throw into UI; return empty/default on error.
 */

import { supabase } from "@/integrations/supabase/client";

export interface UserWeakness {
  subject: string;
  topic: string;
  weaknessScore: number;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
}

export interface ExcludedQuestions {
  ids: string[];
  fingerprints: string[];
}

export interface QuestionMixStrategy {
  weakTopics: string[];
  mediumTopics: string[];
  strongTopics: string[];
  distribution: { weak: number; medium: number; strong: number };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normalize question text for stable fingerprinting (lowercase, collapse whitespace, strip punctuation). */
function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Browser-safe sha256 hex. Returns "" on failure (never throws). */
async function sha256Hex(text: string): Promise<string> {
  try {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "";
  }
}

export async function fingerprintQuestion(questionText: string): Promise<string> {
  const norm = normalizeText(questionText);
  if (!norm) return "";
  return sha256Hex(norm);
}

export class AICoachService {
  /**
   * Returns user's weak subjects/topics sorted by weakness_score DESC.
   */
  static async analyzeUserWeakness(userId: string, subject?: string): Promise<UserWeakness[]> {
    if (!userId) return [];
    try {
      let q = supabase
        .from("user_performance")
        .select("subject, topic, weakness_score, total_attempts, correct_attempts, wrong_attempts")
        .eq("user_id", userId)
        .order("weakness_score", { ascending: false });
      if (subject) q = q.eq("subject", subject);
      const { data, error } = await q;
      if (error || !data) return [];
      return data.map((r: any) => ({
        subject: r.subject,
        topic: r.topic || "",
        weaknessScore: r.weakness_score ?? 50,
        totalAttempts: r.total_attempts ?? 0,
        correctAttempts: r.correct_attempts ?? 0,
        wrongAttempts: r.wrong_attempts ?? 0,
      }));
    } catch (e) {
      console.error("[AICoach] analyzeUserWeakness error:", e);
      return [];
    }
  }

  /**
   * Upsert a single attempt. Non-blocking-friendly — returns false on any failure
   * but never throws. Uses fingerprint as primary durable key; stores DB id when present.
   */
  static async trackQuestionAttempt(
    userId: string,
    questionText: string,
    questionId: string | null,
    subject: string,
    topic: string,
    isCorrect: boolean
  ): Promise<boolean> {
    if (!userId || !questionText) return false;
    const safeSubject = (subject || "General").trim() || "General";
    const safeTopic = (topic || "").trim();
    const fp = await fingerprintQuestion(questionText);
    const validId = questionId && UUID_RE.test(questionId) ? questionId : null;

    try {
      // Read existing row
      const { data: existing } = await supabase
        .from("user_performance")
        .select("id, total_attempts, correct_attempts, wrong_attempts, question_fingerprints, question_ids")
        .eq("user_id", userId)
        .eq("subject", safeSubject)
        .eq("topic", safeTopic)
        .maybeSingle();

      const prevFps: string[] = existing?.question_fingerprints ?? [];
      const prevIds: string[] = existing?.question_ids ?? [];
      const newFps = fp && !prevFps.includes(fp) ? [...prevFps, fp] : prevFps;
      const newIds = validId && !prevIds.includes(validId) ? [...prevIds, validId] : prevIds;

      const total = (existing?.total_attempts ?? 0) + 1;
      const correct = (existing?.correct_attempts ?? 0) + (isCorrect ? 1 : 0);
      const wrong = (existing?.wrong_attempts ?? 0) + (isCorrect ? 0 : 1);
      const weakness = total > 0 ? Math.round((wrong / total) * 100) : 50;

      if (existing?.id) {
        const { error } = await supabase
          .from("user_performance")
          .update({
            total_attempts: total,
            correct_attempts: correct,
            wrong_attempts: wrong,
            weakness_score: weakness,
            question_fingerprints: newFps,
            question_ids: newIds,
            last_attempted_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) {
          console.error("[AICoach] update error:", error.message);
          return false;
        }
      } else {
        const { error } = await supabase.from("user_performance").insert({
          user_id: userId,
          subject: safeSubject,
          topic: safeTopic,
          total_attempts: total,
          correct_attempts: correct,
          wrong_attempts: wrong,
          weakness_score: weakness,
          question_fingerprints: newFps,
          question_ids: newIds,
          last_attempted_at: new Date().toISOString(),
        });
        if (error) {
          console.error("[AICoach] insert error:", error.message);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error("[AICoach] trackQuestionAttempt error:", e);
      return false;
    }
  }

  /**
   * Returns both DB ids (for cache .not('id','in',...)) and fingerprints (for client-side filtering).
   */
  static async getExcludedQuestions(
    userId: string,
    subject?: string,
    topic?: string
  ): Promise<ExcludedQuestions> {
    if (!userId) return { ids: [], fingerprints: [] };
    try {
      let q = supabase
        .from("user_performance")
        .select("question_ids, question_fingerprints")
        .eq("user_id", userId);
      if (subject) q = q.eq("subject", subject);
      if (topic !== undefined) q = q.eq("topic", topic);
      const { data, error } = await q;
      if (error || !data) return { ids: [], fingerprints: [] };
      const ids = new Set<string>();
      const fps = new Set<string>();
      for (const row of data) {
        for (const id of (row as any).question_ids ?? []) if (UUID_RE.test(id)) ids.add(id);
        for (const fp of (row as any).question_fingerprints ?? []) if (fp) fps.add(fp);
      }
      return { ids: Array.from(ids), fingerprints: Array.from(fps) };
    } catch (e) {
      console.error("[AICoach] getExcludedQuestions error:", e);
      return { ids: [], fingerprints: [] };
    }
  }

  /** Convenience for callers that only need the id list (e.g., edge function payload). */
  static async getExcludedQuestionIds(userId: string, subject?: string, topic?: string): Promise<string[]> {
    const { ids } = await this.getExcludedQuestions(userId, subject, topic);
    return ids;
  }

  /**
   * Recommend a difficulty band based on the subject's overall weakness.
   */
  static async recommendDifficulty(userId: string, subject: string): Promise<"easy" | "medium" | "hard"> {
    if (!userId || !subject) return "easy";
    try {
      const { data } = await supabase
        .from("user_performance")
        .select("weakness_score, total_attempts")
        .eq("user_id", userId)
        .eq("subject", subject);
      if (!data || data.length === 0) return "easy";
      const totalAttempts = data.reduce((s, r: any) => s + (r.total_attempts ?? 0), 0);
      if (totalAttempts === 0) return "easy";
      const avgWeak =
        data.reduce((s, r: any) => s + (r.weakness_score ?? 50) * (r.total_attempts ?? 0), 0) / totalAttempts;
      if (avgWeak < 30) return "hard";
      if (avgWeak < 60) return "medium";
      return "easy";
    } catch (e) {
      console.error("[AICoach] recommendDifficulty error:", e);
      return "easy";
    }
  }

  /**
   * Build a 60/30/10 weak/medium/strong topic mix for the given subject.
   */
  static async getPersonalizedQuestionMix(
    userId: string,
    subject: string,
    totalCount: number
  ): Promise<QuestionMixStrategy> {
    const empty: QuestionMixStrategy = {
      weakTopics: [],
      mediumTopics: [],
      strongTopics: [],
      distribution: { weak: 0, medium: 0, strong: 0 },
    };
    if (!userId || !subject || totalCount <= 0) return empty;
    try {
      const rows = await this.analyzeUserWeakness(userId, subject);
      const weak: string[] = [];
      const medium: string[] = [];
      const strong: string[] = [];
      for (const r of rows) {
        if (!r.topic) continue;
        if (r.weaknessScore > 60) weak.push(r.topic);
        else if (r.weaknessScore >= 30) medium.push(r.topic);
        else strong.push(r.topic);
      }
      const weakN = Math.round(totalCount * 0.6);
      const mediumN = Math.round(totalCount * 0.3);
      const strongN = Math.max(0, totalCount - weakN - mediumN);
      return {
        weakTopics: weak,
        mediumTopics: medium,
        strongTopics: strong,
        distribution: { weak: weakN, medium: mediumN, strong: strongN },
      };
    } catch (e) {
      console.error("[AICoach] getPersonalizedQuestionMix error:", e);
      return empty;
    }
  }
}
