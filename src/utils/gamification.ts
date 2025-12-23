import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

interface TestCompletionData {
  score: number;
  totalQuestions: number;
  timeTaken?: number;
  testType: string;
  subjects?: string[];
  answers?: Record<string | number, string>;
  contentId?: string;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("No user logged in, skipping gamification");
      return result;
    }

    // 1. Save test attempt (this updates streak automatically)
    const { error: attemptError } = await supabase.from("test_attempts").insert({
      user_id: user.id,
      test_type: data.testType,
      score: data.score,
      total_questions: data.totalQuestions,
      time_taken: data.timeTaken,
      answers: data.answers || {},
      subjects: data.subjects || [],
      content_id: data.contentId,
      completed_at: new Date().toISOString()
    });

    if (attemptError) {
      console.error("Error saving test attempt:", attemptError);
      return result;
    }

    result.streakUpdated = true;

    // 2. Check and award badges
    const newBadges = await checkAndAwardBadges(user.id, data);
    result.newBadges = newBadges;

    // 3. Trigger celebration effects
    const percentage = (data.score / data.totalQuestions) * 100;
    if (percentage === 100) {
      triggerBigConfetti();
    } else if (percentage >= 70) {
      triggerConfetti();
    }

    result.success = true;
    return result;
  } catch (error) {
    console.error("Error processing test completion:", error);
    return result;
  }
};

const checkAndAwardBadges = async (userId: string, data: TestCompletionData): Promise<Badge[]> => {
  const newBadges: Badge[] = [];

  try {
    // Fetch all available badges
    const { data: allBadges, error: badgesError } = await supabase
      .from("badges")
      .select("*");

    if (badgesError || !allBadges) {
      console.error("Error fetching badges:", badgesError);
      return newBadges;
    }

    // Fetch user's existing badges
    const { data: userBadges, error: userBadgesError } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", userId);

    if (userBadgesError) {
      console.error("Error fetching user badges:", userBadgesError);
      return newBadges;
    }

    const existingBadgeIds = new Set((userBadges || []).map(ub => ub.badge_id));

    // Get user's test attempt count
    const { count: attemptCount } = await supabase
      .from("test_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Check each badge condition
    for (const badge of allBadges) {
      if (existingBadgeIds.has(badge.id)) continue;

      let shouldAward = false;

      switch (badge.name) {
        case "First Step":
          // First quiz completed
          shouldAward = attemptCount === 1;
          break;

        case "High Flyer":
          // 100% score
          shouldAward = data.score === data.totalQuestions;
          break;

        case "On Fire":
          // 3-day streak - check streak
          shouldAward = await checkStreak(userId, 3);
          break;

        default:
          // Custom badge logic can be added here
          break;
      }

      if (shouldAward) {
        const { error: awardError } = await supabase
          .from("user_badges")
          .insert({
            user_id: userId,
            badge_id: badge.id
          });

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
        // Allow yesterday as start if no activity today
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
