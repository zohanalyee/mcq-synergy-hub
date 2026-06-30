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
   * Phase: Learning Intelligence wiring.
   * Builds a spaced-repetition reinforcement plan from raw user_attempt_history.
   *
   * Returns:
   *  - reinforceIds: previously-WRONG / unmastered question ids that are now DUE
   *    for retry (spaced intervals 1/3/7/14 days), capped at ~20% of the test.
   *  - excludeIds: already-seen questions that are mastered OR not-yet-due, so the
   *    same items are not served repeatedly (anti-repetition signal).
   *  - weakTopics: topics to bias the new portion of the test toward.
   */
  static async getReinforcementPlan(
    userId: string,
    subject: string | undefined,
    totalCount: number
  ): Promise<{ reinforceIds: string[]; excludeIds: string[]; weakTopics: string[] }> {
    const empty = { reinforceIds: [], excludeIds: [], weakTopics: [] };
    if (!userId) return empty;
    try {
      const since = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
      let q = supabase
        .from("user_attempt_history")
        .select("question_id, is_correct, attempted_at, topic")
        .eq("user_id", userId)
        .gte("attempted_at", since)
        .order("attempted_at", { ascending: false })
        .limit(4000);
      if (subject) q = q.eq("subject", subject);
      const { data, error } = await q;
      if (error || !data || data.length === 0) {
        const weak = await this.analyzeUserWeakness(userId, subject);
        return { ...empty, weakTopics: weak.filter((w) => w.weaknessScore > 60).map((w) => w.topic).filter(Boolean).slice(0, 5) };
      }

      // Rows arrive newest-first. Build a per-question summary.
      type Summary = { lastAt: number; lastCorrect: boolean; correctStreak: number; wrongCount: number; seen: number };
      const byQ = new Map<string, Summary>();
      for (const r of data as any[]) {
        const id = r.question_id;
        if (typeof id !== "string" || !UUID_RE.test(id)) continue;
        const ts = new Date(r.attempted_at).getTime();
        const s = byQ.get(id);
        if (!s) {
          byQ.set(id, {
            lastAt: ts,
            lastCorrect: !!r.is_correct,
            correctStreak: r.is_correct ? 1 : 0,
            wrongCount: r.is_correct ? 0 : 1,
            seen: 1,
          });
        } else {
          // Older row (rows are desc). Extend the trailing correct streak only
          // while we have not yet hit a wrong answer working backwards.
          if (s.correctStreak === s.seen && r.is_correct) s.correctStreak++;
          if (!r.is_correct) s.wrongCount++;
          s.seen++;
        }
      }

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const reinforce: { id: string; overdue: number; wrongCount: number }[] = [];
      const exclude: string[] = [];

      for (const [id, s] of byQ.entries()) {
        const mastered = s.lastCorrect && s.correctStreak >= 2;
        if (mastered) {
          exclude.push(id); // learned — don't repeat
          continue;
        }
        // Unmastered: spaced interval based on consecutive correct answers.
        const intervalIdx = Math.min(s.correctStreak, RETRY_INTERVALS_DAYS.length - 1);
        const intervalMs = RETRY_INTERVALS_DAYS[intervalIdx] * dayMs;
        const age = now - s.lastAt;
        if (age >= intervalMs) {
          reinforce.push({ id, overdue: age - intervalMs, wrongCount: s.wrongCount });
        } else {
          exclude.push(id); // seen recently, not yet due
        }
      }

      // Prioritise most-wrong then most-overdue. Cap at ~20% of the test.
      reinforce.sort((a, b) => b.wrongCount - a.wrongCount || b.overdue - a.overdue);
      const cap = Math.max(1, Math.round(totalCount * 0.2));
      const reinforceIds = reinforce.slice(0, cap).map((r) => r.id);

      const weak = await this.analyzeUserWeakness(userId, subject);
      const weakTopics = weak.filter((w) => w.weaknessScore > 60).map((w) => w.topic).filter(Boolean).slice(0, 5);

      return { reinforceIds, excludeIds: exclude, weakTopics };
    } catch (e) {
      console.error("[AICoach] getReinforcementPlan error:", e);
      return empty;
    }
  }

  /** Fetch full content_items rows for a set of question ids (for reinforcement injection). */
  static async getQuestionsByIds(ids: string[]): Promise<any[]> {
    const safe = Array.from(new Set((ids || []).filter((id) => UUID_RE.test(id))));
    if (safe.length === 0) return [];
    try {
      const { data, error } = await supabase
        .from("content_items")
        .select("id, title, description, options, correct_option, subject, topic, difficulty, explanation")
        .in("id", safe)
        .eq("category", "mcq")
        .eq("status", "approved")
        .not("quality_grade", "in", "(D,F)");
      if (error || !data) return [];
      return data.map((item: any) => ({
        id: item.id,
        question: item.title,
        options: item.options,
        correctOption: item.correct_option,
        answer: item.correct_option,
        subject: item.subject || "",
        topic: item.topic || item.subject || "",
        difficulty: item.difficulty,
        explanation: item.explanation || item.description || "",
        _reinforced: true,
      }));
    } catch (e) {
      console.error("[AICoach] getQuestionsByIds error:", e);
      return [];
    }
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
   * Perf: batched coach pre-queries for a multi-subject test.
   *
   * Replaces the previous pattern of 3 separate user_performance queries PER
   * subject (getExcludedQuestionIds + getAdaptiveDifficulty + getWeaknessFocusedTopics)
   * with a SINGLE user_performance read for the whole user, then computes the
   * per-subject excluded ids / adaptive difficulty / weak topics entirely in memory.
   *
   * Returns a Map keyed by subject. Subjects with no history fall back to the
   * same defaults the per-subject methods used (medium difficulty, empty lists).
   */
  static async getBatchCoachData(
    userId: string,
    subjects: string[],
    weakTopicCount = 5
  ): Promise<Map<string, { excludeIds: string[]; difficulty: AdaptiveDifficulty; weakTopics: string[] }>> {
    const result = new Map<string, { excludeIds: string[]; difficulty: AdaptiveDifficulty; weakTopics: string[] }>();
    const uniqueSubjects = Array.from(new Set(subjects.filter(Boolean)));
    for (const s of uniqueSubjects) result.set(s, { excludeIds: [], difficulty: "medium", weakTopics: [] });
    if (!userId || uniqueSubjects.length === 0) return result;

    try {
      const { data, error } = await supabase
        .from("user_performance")
        .select("subject, topic, weakness_score, total_attempts, correct_attempts, question_ids")
        .eq("user_id", userId)
        .in("subject", uniqueSubjects);

      if (error || !data) return result;

      // Group rows by subject.
      const bySubject = new Map<string, any[]>();
      for (const row of data as any[]) {
        const subj = row.subject;
        if (!subj) continue;
        if (!bySubject.has(subj)) bySubject.set(subj, []);
        bySubject.get(subj)!.push(row);
      }

      for (const subject of uniqueSubjects) {
        const rows = bySubject.get(subject) ?? [];

        // 1) Excluded ids (mirrors getExcludedQuestions id aggregation).
        const ids = new Set<string>();
        for (const row of rows) {
          for (const id of row.question_ids ?? []) if (UUID_RE.test(id)) ids.add(id);
        }

        // 2) Adaptive difficulty (mirrors getAdaptiveDifficulty), respecting cooldown.
        let difficulty: AdaptiveDifficulty = readDiffCooldown(userId, subject) ?? "medium";
        if (!readDiffCooldown(userId, subject)) {
          const totals = rows.reduce(
            (acc, r) => {
              acc.t += r.total_attempts ?? 0;
              acc.c += r.correct_attempts ?? 0;
              return acc;
            },
            { t: 0, c: 0 }
          );
          if (totals.t < 5) difficulty = "medium";
          else {
            const rate = totals.c / totals.t;
            difficulty = rate > 0.8 ? "hard" : rate < 0.5 ? "easy" : "medium";
          }
          writeDiffCooldown(userId, subject, difficulty);
        }

        // 3) Weak topics (mirrors getWeaknessFocusedTopics ordering).
        const weakTopics = rows
          .filter((r) => r.topic && (r.total_attempts ?? 0) > 0)
          .sort((a, b) => (b.weakness_score ?? 50) - (a.weakness_score ?? 50))
          .slice(0, weakTopicCount)
          .map((r) => r.topic as string);

        result.set(subject, { excludeIds: Array.from(ids), difficulty, weakTopics });
      }

      return result;
    } catch (e) {
      console.error("[AICoach] getBatchCoachData error:", e);
      return result;
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

  // ============================================================
  // Phase 3 — Intelligence Dashboard
  // ============================================================

  /**
   * Insert a granular per-question attempt row, then update the rolling aggregate
   * (existing trackQuestionAttempt). Both calls are non-throwing.
   */
  static async trackAttemptDetailed(
    userId: string,
    sessionId: string | null,
    questionText: string,
    questionId: string | null,
    subject: string,
    topic: string,
    difficulty: string,
    isCorrect: boolean,
    timeTakenSeconds: number,
    testType: "job_test" | "subject_test" | "practice" | "syllabus"
  ): Promise<void> {
    if (!userId || !questionText) return;
    const safeSubject = (subject || "General").trim() || "General";
    const safeTopic = (topic || "").trim();
    const safeDiff = (difficulty || "medium").toLowerCase();

    // 1) Update aggregate first (Phase 1 invariant)
    try {
      await this.trackQuestionAttempt(userId, questionText, questionId, safeSubject, safeTopic, isCorrect);
    } catch (e) {
      console.error("[AICoach] trackAttemptDetailed aggregate failed:", e);
    }

    // 2) Insert raw history row
    try {
      const fp = await fingerprintQuestion(questionText);
      if (!fp) return;
      const { error } = await supabase.from("user_attempt_history").insert({
        user_id: userId,
        session_id: sessionId,
        question_fingerprint: fp,
        question_id: questionId,
        subject: safeSubject,
        topic: safeTopic,
        difficulty: safeDiff,
        is_correct: isCorrect,
        time_taken_seconds: Math.max(0, Math.round(timeTakenSeconds || 0)),
        test_type: testType,
      });
      if (error) console.error("[AICoach] history insert error:", error.message);
    } catch (e) {
      console.error("[AICoach] trackAttemptDetailed history failed:", e);
    }
  }

  /**
   * Last 8 weeks of accuracy + attempt counts, oldest → newest.
   */
  static async getWeeklyTrend(
    userId: string,
    subject?: string
  ): Promise<{ week: string; accuracy: number; totalAttempts: number }[]> {
    if (!userId) return [];
    try {
      const since = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString();
      let q = supabase
        .from("user_attempt_history")
        .select("attempted_at, is_correct")
        .eq("user_id", userId)
        .gte("attempted_at", since)
        .order("attempted_at", { ascending: true })
        .limit(5000);
      if (subject) q = q.eq("subject", subject);
      const { data } = await q;
      if (!data || data.length === 0) return [];

      // Bucket into ISO week starts (Mon)
      const buckets = new Map<string, { total: number; correct: number }>();
      const weekKey = (d: Date) => {
        const dt = new Date(d);
        const day = (dt.getDay() + 6) % 7; // Mon=0
        dt.setDate(dt.getDate() - day);
        dt.setHours(0, 0, 0, 0);
        return dt.toISOString().slice(0, 10);
      };
      for (const r of data as any[]) {
        const k = weekKey(new Date(r.attempted_at));
        const b = buckets.get(k) ?? { total: 0, correct: 0 };
        b.total++;
        if (r.is_correct) b.correct++;
        buckets.set(k, b);
      }

      // Fill last 8 weeks (including empty)
      const out: { week: string; accuracy: number; totalAttempts: number }[] = [];
      const now = new Date();
      const startMonday = new Date(now);
      startMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      startMonday.setHours(0, 0, 0, 0);
      for (let i = 7; i >= 0; i--) {
        const d = new Date(startMonday);
        d.setDate(startMonday.getDate() - i * 7);
        const k = d.toISOString().slice(0, 10);
        const b = buckets.get(k);
        const label = `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
        out.push({
          week: label,
          accuracy: b && b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
          totalAttempts: b?.total ?? 0,
        });
      }
      return out;
    } catch (e) {
      console.error("[AICoach] getWeeklyTrend error:", e);
      return [];
    }
  }

  /**
   * Per-subject mastery breakdown (sorted by weakness DESC).
   */
  static async getSubjectBreakdown(userId: string): Promise<
    { subject: string; totalAttempts: number; accuracy: number; weaknessScore: number; lastAttempted: Date | null }[]
  > {
    if (!userId) return [];
    try {
      const { data } = await supabase
        .from("user_performance")
        .select("subject, total_attempts, correct_attempts, weakness_score, last_attempted_at")
        .eq("user_id", userId);
      if (!data) return [];
      const agg = new Map<
        string,
        { total: number; correct: number; weakSum: number; weakN: number; last: number | null }
      >();
      for (const r of data as any[]) {
        const subj = r.subject || "General";
        const a = agg.get(subj) ?? { total: 0, correct: 0, weakSum: 0, weakN: 0, last: null };
        const t = r.total_attempts ?? 0;
        a.total += t;
        a.correct += r.correct_attempts ?? 0;
        if (t > 0) {
          a.weakSum += (r.weakness_score ?? 50) * t;
          a.weakN += t;
        }
        if (r.last_attempted_at) {
          const ts = new Date(r.last_attempted_at).getTime();
          if (!a.last || ts > a.last) a.last = ts;
        }
        agg.set(subj, a);
      }
      const out = Array.from(agg.entries()).map(([subject, a]) => ({
        subject,
        totalAttempts: a.total,
        accuracy: a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0,
        weaknessScore: a.weakN > 0 ? Math.round(a.weakSum / a.weakN) : 50,
        lastAttempted: a.last ? new Date(a.last) : null,
      }));
      out.sort((x, y) => y.weaknessScore - x.weaknessScore);
      return out;
    } catch (e) {
      console.error("[AICoach] getSubjectBreakdown error:", e);
      return [];
    }
  }

  /**
   * Streak based on distinct attempt dates from user_attempt_history (preferred)
   * with fallback to user_performance.last_attempted_at when history is empty.
   */
  static async getDailyStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
  }> {
    const empty = { currentStreak: 0, longestStreak: 0, lastActiveDate: null as Date | null };
    if (!userId) return empty;
    try {
      const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("user_attempt_history")
        .select("attempted_at")
        .eq("user_id", userId)
        .gte("attempted_at", since)
        .order("attempted_at", { ascending: false })
        .limit(5000);

      const days = new Set<string>();
      let lastActive: Date | null = null;
      for (const r of (data ?? []) as any[]) {
        const d = new Date(r.attempted_at);
        days.add(d.toISOString().slice(0, 10));
        if (!lastActive || d > lastActive) lastActive = d;
      }
      // Fallback to aggregate last_attempted_at if no history yet
      if (days.size === 0) {
        const m = await this.getProgressMetrics(userId);
        return { currentStreak: m.streakDays, longestStreak: m.streakDays, lastActiveDate: null };
      }

      // current streak (back from today)
      let current = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        if (days.has(k)) current++;
        else if (i > 0) break;
      }
      // longest streak across history
      const sortedKeys = Array.from(days).sort();
      let longest = 0;
      let run = 0;
      let prev: number | null = null;
      const ONE = 24 * 60 * 60 * 1000;
      for (const k of sortedKeys) {
        const t = new Date(k).getTime();
        if (prev !== null && t - prev === ONE) run++;
        else run = 1;
        if (run > longest) longest = run;
        prev = t;
      }
      return { currentStreak: current, longestStreak: longest, lastActiveDate: lastActive };
    } catch (e) {
      console.error("[AICoach] getDailyStreak error:", e);
      return empty;
    }
  }

  /**
   * 7-day rolling study plan combining retry queue + weakness focus.
   */
  static async getStudyPlan(
    userId: string,
    daysAhead = 7
  ): Promise<{ date: Date; subjects: string[]; reason: string }[]> {
    if (!userId) return [];
    try {
      const [retry, weak] = await Promise.all([
        this.getTopicsNeedingRetry(userId, 10),
        this.analyzeUserWeakness(userId),
      ]);

      const subjects = new Map<string, string>(); // subject -> reason
      for (const r of retry) {
        if (!subjects.has(r.subject)) subjects.set(r.subject, "Spaced repetition");
      }
      for (const w of weak) {
        if (w.weaknessScore >= 50 && !subjects.has(w.subject)) {
          subjects.set(w.subject, "Retry weak topics");
        }
      }
      // Maintenance fillers from any subject the user touches
      for (const w of weak) {
        if (!subjects.has(w.subject)) subjects.set(w.subject, "Maintenance");
      }

      const list = Array.from(subjects.entries());
      if (list.length === 0) return [];

      const out: { date: Date; subjects: string[]; reason: string }[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < daysAhead; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const [subj, reason] = list[i % list.length];
        out.push({ date: d, subjects: [subj], reason });
      }
      return out;
    } catch (e) {
      console.error("[AICoach] getStudyPlan error:", e);
      return [];
    }
  }

  /**
   * Compute 6 achievements from existing data. No DB writes — pure read model.
   */
  static async getAchievements(userId: string): Promise<
    {
      id: string;
      title: string;
      description: string;
      icon: string;
      unlocked: boolean;
      progress: number; // 0–100
    }[]
  > {
    const defaults = [
      { id: "first_steps", title: "First Steps", description: "Complete your first test", icon: "🎯" },
      { id: "century_club", title: "Century Club", description: "Reach 100 question attempts", icon: "💯" },
      { id: "dedicated_learner", title: "Dedicated Learner", description: "Maintain a 7-day streak", icon: "🔥" },
      { id: "subject_master", title: "Subject Master", description: "90%+ accuracy in any subject (10+ Qs)", icon: "👑" },
      { id: "weakness_warrior", title: "Weakness Warrior", description: "Improve any subject by 30 points", icon: "⚔️" },
      { id: "perfect_score", title: "Perfect Score", description: "Get 100% on any test", icon: "⭐" },
    ];
    const make = (over: Partial<{ unlocked: boolean; progress: number }>, base: typeof defaults[number]) => ({
      ...base,
      unlocked: !!over.unlocked,
      progress: Math.max(0, Math.min(100, Math.round(over.progress ?? 0))),
    });

    if (!userId) return defaults.map((d) => make({}, d));

    try {
      const [metrics, streak, breakdown] = await Promise.all([
        this.getProgressMetrics(userId),
        this.getDailyStreak(userId),
        this.getSubjectBreakdown(userId),
      ]);

      // Subject Master: highest (accuracy with ≥10 attempts)
      const masterCandidate = breakdown
        .filter((b) => b.totalAttempts >= 10)
        .reduce<{ acc: number } | null>((best, b) => (best && best.acc >= b.accuracy ? best : { acc: b.accuracy }), null);
      const masterAcc = masterCandidate?.acc ?? 0;

      // Weakness Warrior: best (most negative) improvement across subjects
      // weaknessImprovement < 0 means improving. Convert to positive scale.
      const improvement = -metrics.weaknessImprovement; // positive = better

      // Perfect Score: scan recent custom_test_sessions for any 100%
      let perfect = false;
      try {
        const { data: sessions } = await supabase
          .from("custom_test_sessions")
          .select("question_count, questions")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
        // Heuristic: we don't store score on the session. Use attempt history instead.
        const { data: hist } = await supabase
          .from("user_attempt_history")
          .select("session_id, is_correct")
          .eq("user_id", userId)
          .order("attempted_at", { ascending: false })
          .limit(2000);
        if (hist && hist.length > 0) {
          const bySession = new Map<string, { c: number; t: number }>();
          for (const h of hist as any[]) {
            if (!h.session_id) continue;
            const b = bySession.get(h.session_id) ?? { c: 0, t: 0 };
            b.t++;
            if (h.is_correct) b.c++;
            bySession.set(h.session_id, b);
          }
          for (const [, b] of bySession) {
            if (b.t >= 5 && b.c === b.t) {
              perfect = true;
              break;
            }
          }
        }
        void sessions;
      } catch {
        /* ignore */
      }

      return [
        make(
          { unlocked: metrics.totalAttempts >= 1, progress: metrics.totalAttempts >= 1 ? 100 : 0 },
          defaults[0]
        ),
        make(
          {
            unlocked: metrics.totalAttempts >= 100,
            progress: (metrics.totalAttempts / 100) * 100,
          },
          defaults[1]
        ),
        make(
          { unlocked: streak.currentStreak >= 7, progress: (streak.currentStreak / 7) * 100 },
          defaults[2]
        ),
        make({ unlocked: masterAcc >= 90, progress: (masterAcc / 90) * 100 }, defaults[3]),
        make({ unlocked: improvement >= 30, progress: (improvement / 30) * 100 }, defaults[4]),
        make({ unlocked: perfect, progress: perfect ? 100 : 0 }, defaults[5]),
      ];
    } catch (e) {
      console.error("[AICoach] getAchievements error:", e);
      return defaults.map((d) => make({}, d));
    }
  }

  /**
   * Smart Repetition — build a per-user, per-subject/topic selection plan.
   *
   * Returns the building blocks the test generators use to assemble a fresh
   * paper for a RETURNING user:
   *  - wrongIds / correctIds: previously-seen questions eligible for resurfacing
   *    (oldest-first), with correctness weighting + a rolling-window cooldown.
   *  - freshExcludeIds / freshExcludeFingerprints: everything the user has ever
   *    seen (id AND text-twin fingerprint) so the "fresh" portion is genuinely new
   *    and cross-subject duplicates (e.g. "synonym of Diligent") cannot leak in.
   *  - targets: nominal wrong/fresh/correct counts (30% / 55% / 15%), rebalanced
   *    by the caller against actual availability.
   *  - window: the adaptive rolling-window size used (for logging).
   *
   * Adaptive rolling window (prevents small pools from being starved):
   *  - pool < 30 questions          → N = 2 (short window, finite vocab/GK)
   *  - pool 30–300 questions        → N = 3 (default)
   *  - pool > 300 questions         → N = 5 (large pool, maximize freshness)
   *
   * Cooldown rules:
   *  - WRONG answers resurface sooner: eligible once they are NOT in the most
   *    recent attempt (attemptsAgo >= 1) — spaced-repetition on mistakes.
   *  - CORRECT answers are deprioritized: eligible only OUTSIDE the full N-window
   *    (attemptsAgo >= N), lowest frequency.
   *
   * Safe-by-default: never throws; returns empty buckets on any error.
   */
  static async getSelectionPlan(
    userId: string,
    subject: string | undefined,
    topic: string | undefined,
    totalCount: number
  ): Promise<{
    wrongIds: string[];
    correctIds: string[];
    freshExcludeIds: string[];
    freshExcludeFingerprints: string[];
    targets: { wrong: number; fresh: number; correct: number };
    window: number;
  }> {
    const Q = Math.max(1, Math.round(totalCount || 0));
    const empty = {
      wrongIds: [] as string[],
      correctIds: [] as string[],
      freshExcludeIds: [] as string[],
      freshExcludeFingerprints: [] as string[],
      targets: { wrong: 0, fresh: Q, correct: 0 },
      window: 3,
    };
    if (!userId) return empty;

    try {
      // 1) Determine the underlying pool size to pick the adaptive window.
      let poolSize = 0;
      try {
        let countQ = supabase
          .from("content_items")
          .select("id", { count: "exact", head: true })
          .eq("category", "mcq")
          .eq("status", "approved");
        if (topic) countQ = countQ.eq("topic", topic);
        else if (subject) countQ = countQ.eq("subject", subject);
        const { count } = await countQ;
        poolSize = count ?? 0;
      } catch {
        poolSize = 0;
      }
      const N = poolSize < 30 ? 2 : poolSize <= 300 ? 3 : 5;

      // 2) Pull recent per-question history (subject/topic scoped).
      const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      let hq = supabase
        .from("user_attempt_history")
        .select("question_id, question_fingerprint, is_correct, attempted_at, session_id")
        .eq("user_id", userId)
        .gte("attempted_at", since)
        .order("attempted_at", { ascending: false })
        .limit(6000);
      if (subject) hq = hq.eq("subject", subject);
      if (topic) hq = hq.eq("topic", topic);
      const { data, error } = await hq;
      if (error || !data || data.length === 0) {
        return { ...empty, window: N };
      }

      // 3) Rank distinct sessions by recency → attemptsAgo per session.
      const sessionLastAt = new Map<string, number>();
      for (const r of data as any[]) {
        const sid = r.session_id || `__nosess__${r.attempted_at}`;
        const ts = new Date(r.attempted_at).getTime();
        if (!sessionLastAt.has(sid) || ts > (sessionLastAt.get(sid) as number)) {
          sessionLastAt.set(sid, ts);
        }
      }
      const orderedSessions = Array.from(sessionLastAt.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([sid]) => sid);
      const sessionRank = new Map<string, number>();
      orderedSessions.forEach((sid, idx) => sessionRank.set(sid, idx));

      // 4) Per-question summary: most recent outcome + how many attempts ago.
      type QSum = { lastAt: number; lastCorrect: boolean; attemptsAgo: number; fp: string };
      const byQ = new Map<string, QSum>();
      const allFps = new Set<string>();
      for (const r of data as any[]) {
        const id = r.question_id;
        if (r.question_fingerprint) allFps.add(r.question_fingerprint);
        if (typeof id !== "string" || !UUID_RE.test(id)) continue;
        const ts = new Date(r.attempted_at).getTime();
        const sid = r.session_id || `__nosess__${r.attempted_at}`;
        const existing = byQ.get(id);
        if (!existing || ts > existing.lastAt) {
          byQ.set(id, {
            lastAt: ts,
            lastCorrect: !!r.is_correct,
            attemptsAgo: sessionRank.get(sid) ?? orderedSessions.length,
            fp: r.question_fingerprint || existing?.fp || "",
          });
        }
      }

      // 5) Build buckets. Fresh excludes EVERYTHING ever seen (id + fingerprint).
      const wrong: { id: string; lastAt: number }[] = [];
      const correct: { id: string; lastAt: number }[] = [];
      const freshExcludeIds: string[] = [];
      for (const [id, s] of byQ.entries()) {
        freshExcludeIds.push(id);
        if (!s.lastCorrect && s.attemptsAgo >= 1) {
          wrong.push({ id, lastAt: s.lastAt });
        } else if (s.lastCorrect && s.attemptsAgo >= N) {
          correct.push({ id, lastAt: s.lastAt });
        }
      }
      // Oldest-first so nothing stays permanently unrevisited.
      wrong.sort((a, b) => a.lastAt - b.lastAt);
      correct.sort((a, b) => a.lastAt - b.lastAt);

      // 6) Confidence-tuned target mix (30% wrong / 55% fresh / 15% correct).
      const wantWrong = Math.round(Q * 0.3);
      const wantCorrect = Math.round(Q * 0.15);
      const wantFresh = Math.max(0, Q - wantWrong - wantCorrect);

      return {
        wrongIds: wrong.map((w) => w.id),
        correctIds: correct.map((c) => c.id),
        freshExcludeIds,
        freshExcludeFingerprints: Array.from(allFps),
        targets: { wrong: wantWrong, fresh: wantFresh, correct: wantCorrect },
        window: N,
      };
    } catch (e) {
      console.error("[AICoach] getSelectionPlan error:", e);
      return empty;
    }
  }
}

