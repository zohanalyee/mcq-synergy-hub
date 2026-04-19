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

export interface WeakTopic {
  topic: string;
  weaknessScore: number;
  lastAttemptedAt: string | null;
}

export interface RetryTopic {
  subject: string;
  topic: string;
  daysAgo: number;
  weaknessScore: number;
}

export interface ProgressMetrics {
  totalAttempts: number;
  accuracyRate: number;        // 0–100
  weaknessImprovement: number; // negative = improving
  streakDays: number;
}

export type AdaptiveDifficulty = "easy" | "medium" | "hard";

const DIFF_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const RETRY_INTERVALS_DAYS = [1, 3, 7, 14] as const;

function diffCooldownKey(userId: string, subject: string) {
  return `aicoach:diff:${userId}:${subject}`;
}

function readDiffCooldown(userId: string, subject: string): AdaptiveDifficulty | null {
  try {
    const raw = localStorage.getItem(diffCooldownKey(userId, subject));
    if (!raw) return null;
    const { level, ts } = JSON.parse(raw);
    if (typeof ts !== "number" || Date.now() - ts > DIFF_COOLDOWN_MS) return null;
    if (level === "easy" || level === "medium" || level === "hard") return level;
    return null;
  } catch {
    return null;
  }
}

function writeDiffCooldown(userId: string, subject: string, level: AdaptiveDifficulty) {
  try {
    localStorage.setItem(diffCooldownKey(userId, subject), JSON.stringify({ level, ts: Date.now() }));
  } catch {
    /* ignore */
  }
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

  // ============================================================
  // Phase 2 — Adaptive Intelligence
  // ============================================================

  /**
   * Recommend an adaptive difficulty for the next test in a subject.
   * Uses overall correct/wrong ratio across all topic rows for the subject.
   * Caches result per (user, subject) for 24h to prevent thrashing.
   */
  static async getAdaptiveDifficulty(userId: string, subject: string): Promise<AdaptiveDifficulty> {
    if (!userId || !subject) return "medium";
    const cooled = readDiffCooldown(userId, subject);
    if (cooled) return cooled;

    let level: AdaptiveDifficulty = "medium";
    try {
      const { data } = await supabase
        .from("user_performance")
        .select("total_attempts, correct_attempts, wrong_attempts")
        .eq("user_id", userId)
        .eq("subject", subject);

      const totals = (data ?? []).reduce(
        (acc: any, r: any) => {
          acc.t += r.total_attempts ?? 0;
          acc.c += r.correct_attempts ?? 0;
          return acc;
        },
        { t: 0, c: 0 }
      );

      if (totals.t < 5) {
        level = "medium"; // not enough signal
      } else {
        const rate = totals.c / totals.t;
        if (rate > 0.8) level = "hard";
        else if (rate < 0.5) level = "easy";
        else level = "medium";
      }
    } catch (e) {
      console.error("[AICoach] getAdaptiveDifficulty error:", e);
      level = "medium";
    }

    writeDiffCooldown(userId, subject, level);
    return level;
  }

  /**
   * Returns top N weakest topics for a subject (only topics with at least 1 attempt).
   */
  static async getWeaknessFocusedTopics(
    userId: string,
    subject: string,
    count: number
  ): Promise<WeakTopic[]> {
    if (!userId || !subject || count <= 0) return [];
    try {
      const { data, error } = await supabase
        .from("user_performance")
        .select("topic, weakness_score, total_attempts, last_attempted_at")
        .eq("user_id", userId)
        .eq("subject", subject)
        .gt("total_attempts", 0)
        .order("weakness_score", { ascending: false })
        .limit(count);
      if (error || !data) return [];
      return data
        .filter((r: any) => r.topic)
        .map((r: any) => ({
          topic: r.topic,
          weaknessScore: r.weakness_score ?? 50,
          lastAttemptedAt: r.last_attempted_at ?? null,
        }));
    } catch (e) {
      console.error("[AICoach] getWeaknessFocusedTopics error:", e);
      return [];
    }
  }

  /**
   * Spaced repetition: should this topic be retested now?
   * Interval grows with the number of "wrong-dominant" past attempts (capped at 14d).
   */
  static async shouldRetestTopic(
    userId: string,
    subject: string,
    topic: string
  ): Promise<{ due: boolean; nextRetry: Date | null }> {
    if (!userId || !subject) return { due: false, nextRetry: null };
    try {
      const { data } = await supabase
        .from("user_performance")
        .select("wrong_attempts, total_attempts, last_attempted_at, weakness_score")
        .eq("user_id", userId)
        .eq("subject", subject)
        .eq("topic", topic || "")
        .maybeSingle();

      if (!data || !data.last_attempted_at) return { due: false, nextRetry: null };

      // Pick interval index by "wrong streak proxy": more wrongs -> longer cooldown
      const wrongs = data.wrong_attempts ?? 0;
      const idx = Math.min(Math.max(wrongs - 1, 0), RETRY_INTERVALS_DAYS.length - 1);
      const intervalMs = RETRY_INTERVALS_DAYS[idx] * 24 * 60 * 60 * 1000;
      const last = new Date(data.last_attempted_at).getTime();
      const next = new Date(last + intervalMs);
      return { due: Date.now() >= next.getTime(), nextRetry: next };
    } catch (e) {
      console.error("[AICoach] shouldRetestTopic error:", e);
      return { due: false, nextRetry: null };
    }
  }

  /**
   * Scan weak rows and return up to `limit` topics that are due for retry.
   */
  static async getTopicsNeedingRetry(userId: string, limit = 3): Promise<RetryTopic[]> {
    if (!userId) return [];
    try {
      const { data } = await supabase
        .from("user_performance")
        .select("subject, topic, weakness_score, last_attempted_at, wrong_attempts")
        .eq("user_id", userId)
        .gt("weakness_score", 60)
        .not("last_attempted_at", "is", null)
        .order("weakness_score", { ascending: false })
        .limit(50);

      if (!data) return [];
      const out: RetryTopic[] = [];
      const now = Date.now();
      for (const r of data as any[]) {
        if (out.length >= limit) break;
        if (!r.last_attempted_at) continue;
        const wrongs = r.wrong_attempts ?? 0;
        const idx = Math.min(Math.max(wrongs - 1, 0), RETRY_INTERVALS_DAYS.length - 1);
        const intervalMs = RETRY_INTERVALS_DAYS[idx] * 24 * 60 * 60 * 1000;
        const last = new Date(r.last_attempted_at).getTime();
        if (now < last + intervalMs) continue;
        out.push({
          subject: r.subject,
          topic: r.topic || "General",
          daysAgo: Math.max(1, Math.floor((now - last) / (24 * 60 * 60 * 1000))),
          weaknessScore: r.weakness_score ?? 50,
        });
      }
      return out;
    } catch (e) {
      console.error("[AICoach] getTopicsNeedingRetry error:", e);
      return [];
    }
  }

  /**
   * Aggregate progress metrics. Best-effort with current schema.
   */
  static async getProgressMetrics(userId: string, subject?: string): Promise<ProgressMetrics> {
    const empty: ProgressMetrics = {
      totalAttempts: 0,
      accuracyRate: 0,
      weaknessImprovement: 0,
      streakDays: 0,
    };
    if (!userId) return empty;
    try {
      let q = supabase
        .from("user_performance")
        .select("total_attempts, correct_attempts, weakness_score, last_attempted_at, updated_at")
        .eq("user_id", userId);
      if (subject) q = q.eq("subject", subject);
      const { data } = await q;
      if (!data || data.length === 0) return empty;

      let totalAttempts = 0;
      let totalCorrect = 0;
      const recentScores: number[] = [];
      const olderScores: number[] = [];
      const days = new Set<string>();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const r of data as any[]) {
        totalAttempts += r.total_attempts ?? 0;
        totalCorrect += r.correct_attempts ?? 0;
        const ts = r.last_attempted_at ? new Date(r.last_attempted_at).getTime() : null;
        if (ts) {
          days.add(new Date(ts).toISOString().slice(0, 10));
          if (ts >= sevenDaysAgo) recentScores.push(r.weakness_score ?? 50);
          else olderScores.push(r.weakness_score ?? 50);
        }
      }

      const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
      const accuracyRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      const weaknessImprovement =
        recentScores.length && olderScores.length ? Math.round(avg(recentScores) - avg(olderScores)) : 0;

      // streakDays: count back from today consecutively in `days`
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (days.has(key)) streak++;
        else if (i > 0) break; // allow today empty
      }

      return { totalAttempts, accuracyRate, weaknessImprovement, streakDays: streak };
    } catch (e) {
      console.error("[AICoach] getProgressMetrics error:", e);
      return empty;
    }
  }
}
