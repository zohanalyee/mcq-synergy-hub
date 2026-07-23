import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { createNotification, NotificationType } from "@/services/notificationService";
import { trackTestCompletion } from "@/utils/analytics";

interface TestCompletionData {
  score: number;
  totalQuestions: number;
  timeTaken?: number;
  testType: string;
  subjects?: string[];
  answers?: Record<string | number, string> | Array<Record<string, unknown>>;
  contentId?: string;
  questionIds?: string[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

export const triggerBigConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

export const processTestCompletion = async (data: TestCompletionData): Promise<{
  success: boolean;
  newBadges: Badge[];
  streakUpdated: boolean;
}> => {
  const result = {
    success: false,
    newBadges: [] as Badge[],
    streakUpdated: false
  };

  try {
    // Bump served-question usage counters (dual-source RPC, works for guests too).
    // Fire-and-forget — never blocks completion.
    if (data.questionIds && data.questionIds.length > 0) {
      supabase
        .rpc("record_question_usage", { question_ids: data.questionIds })
        .then(({ error }) => {
          if (error) console.warn("record_question_usage failed (non-fatal):", error.message);
        });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("No user logged in, skipping gamification");
      return result;
    }

    // 1. Save test attempt
    const normalizedAnswers: any = Array.isArray(data.answers)
      ? (data.answers as Array<Record<string, unknown>>).map(a => ({
          ...a,
          topic: (a as any).topic || 'General',
          is_correct: (a as any).is_correct,
        }))
      : (data.answers || {});

    const { error: attemptError } = await supabase.from("test_attempts").insert({
      user_id: user.id,
      test_type: data.testType,
      score: data.score,
      total_questions: data.totalQuestions,
      time_taken: data.timeTaken,
      answers: normalizedAnswers,
      subjects: data.subjects || [],
      content_id: data.contentId,
      completed_at: new Date().toISOString()
    });

    if (attemptError) {
      console.error("Error saving test attempt:", attemptError);
      return result;
    }

    result.streakUpdated = true;

    // 2. Record attempted question IDs
    if (data.questionIds && data.questionIds.length > 0) {
      const attemptRows = data.questionIds.map(qId => ({
        user_id: user.id,
        question_id: qId
      }));

      const { error: upsertError } = await supabase
        .from("user_question_attempts" as any)
        .upsert(attemptRows, { onConflict: 'user_id,question_id' } as any);

      if (upsertError) {
        console.error("Error recording question attempts:", upsertError);
      }
    }

    // 3. Check and award badges
    const newBadges = await checkAndAwardBadges(user.id, data);
    result.newBadges = newBadges;

    // 4. Create notifications
    const percentage = (data.score / data.totalQuestions) * 100;

    await createNotification(user.id, NotificationType.TEST_COMPLETED, {
      testType: data.testType,
      score: data.score,
      total: data.totalQuestions,
    });

    await createNotification(user.id, NotificationType.RESULTS_READY, {
      score: data.score,
      total: data.totalQuestions,
      percentage: Math.round(percentage),
    });

    for (const badge of newBadges) {
      await createNotification(user.id, NotificationType.BADGE_EARNED, {
        badgeName: badge.name,
      });
    }

    // 5. Track in GA4
    trackTestCompletion({
      score: data.score,
      totalQuestions: data.totalQuestions,
      testType: data.testType,
      percentage: Math.round(percentage),
    });

    // 6. Trigger celebration effects
    if (percentage === 100) {
      triggerBigConfetti();
    } else if (percentage >= 70) {
      triggerConfetti();
    }

    // 6. Generate weakness recommendations (fire and forget)
    generateWeaknessRecommendations(user.id, data).catch(err => {
      console.error("Error generating weakness recommendations:", err);
    });

    result.success = true;
    return result;
  } catch (error) {
    console.error("Error processing test completion:", error);
    return result;
  }
};

// Generate recommended practice tests for weak subjects
async function generateWeaknessRecommendations(userId: string, data: TestCompletionData) {
  if (!data.subjects || data.subjects.length === 0) return;

  // Calculate per-subject scores from answers
  // For now, if overall score < 50%, recommend practice for each subject
  const percentage = (data.score / data.totalQuestions) * 100;
  if (percentage >= 50) return; // Not weak enough to recommend

  for (const subject of data.subjects) {
    // Check if a pending recommendation already exists for this subject
    const { data: existing } = await supabase
      .from("recommended_tests" as any)
      .select("id")
      .eq("user_id", userId)
      .eq("subject_name", subject)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) continue;

    // Insert recommendation (questions will be fetched when user starts practice)
    await supabase.from("recommended_tests" as any).insert({
      user_id: userId,
      topic_name: subject,
      subject_name: subject,
      reason: "weakness",
      weakness_percentage: Math.round(percentage),
      question_count: 20,
      question_ids: [],
      status: "pending"
    } as any);

    // Send weakness notification
    await createNotification(userId, NotificationType.WEAKNESS_DETECTED, {
      subject,
      percentage: Math.round(percentage),
    });
  }
}

const checkAndAwardBadges = async (userId: string, data: TestCompletionData): Promise<Badge[]> => {
  const newBadges: Badge[] = [];

  try {
    const { data: allBadges, error: badgesError } = await supabase
      .from("badges")
      .select("*");

    if (badgesError || !allBadges) return newBadges;

    const { data: userBadges, error: userBadgesError } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);

    if (userBadgesError) return newBadges;

    const existingBadgeIds = new Set((userBadges || []).map(ub => ub.badge_id));

    const { count: attemptCount } = await supabase
      .from("test_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    for (const badge of allBadges) {
      if (existingBadgeIds.has(badge.id)) continue;

      let shouldAward = false;

      switch (badge.name) {
        case "First Step":
          shouldAward = attemptCount === 1;
          break;
        case "High Flyer":
          shouldAward = data.score === data.totalQuestions;
          break;
        case "On Fire":
          shouldAward = await checkStreak(userId, 3);
          break;
        default:
          break;
      }

      if (shouldAward) {
        const { error: awardError } = await supabase
          .from("user_badges")
          .insert({ user_id: userId, badge_id: badge.id });

        if (!awardError) {
          newBadges.push(badge as Badge);
        }
      }
    }
  } catch (error) {
    console.error("Error checking badges:", error);
  }

  return newBadges;
};

const checkStreak = async (userId: string, requiredDays: number): Promise<boolean> => {
  try {
    const { data: attempts, error } = await supabase
      .from("test_attempts")
      .select("completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (error || !attempts || attempts.length === 0) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDays = new Set<string>();
    attempts.forEach((attempt) => {
      if (attempt.completed_at) {
        const date = new Date(attempt.completed_at);
        date.setHours(0, 0, 0, 0);
        uniqueDays.add(date.toISOString().split("T")[0]);
      }
    });

    const sortedDays = Array.from(uniqueDays).sort().reverse();
    let streak = 0;

    for (let i = 0; i < sortedDays.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split("T")[0];

      if (sortedDays[i] === expectedDateStr) {
        streak++;
      } else if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (sortedDays[0] === yesterday.toISOString().split("T")[0]) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak >= requiredDays;
  } catch (error) {
    console.error("Error checking streak:", error);
    return false;
  }
};

export const getStreakCount = async (userId: string): Promise<number> => {
  try {
    const { data: attempts, error } = await supabase
      .from("test_attempts")
      .select("completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (error || !attempts || attempts.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDays = new Set<string>();
    attempts.forEach((attempt) => {
      if (attempt.completed_at) {
        const date = new Date(attempt.completed_at);
        date.setHours(0, 0, 0, 0);
        uniqueDays.add(date.toISOString().split("T")[0]);
      }
    });

    const sortedDays = Array.from(uniqueDays).sort().reverse();
    let streak = 0;

    for (let i = 0; i < sortedDays.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split("T")[0];

      if (sortedDays[i] === expectedDateStr) {
        streak++;
      } else if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (sortedDays[0] === yesterday.toISOString().split("T")[0]) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error("Error getting streak count:", error);
    return 0;
  }
};
