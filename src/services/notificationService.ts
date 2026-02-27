import { supabase } from "@/integrations/supabase/client";

export enum NotificationType {
  TEST_COMPLETED = 'test_completed',
  RESULTS_READY = 'results_ready',
  BADGE_EARNED = 'badge_earned',
  STREAK_MILESTONE = 'streak_milestone',
  WEAKNESS_DETECTED = 'weakness_detected',
  PRACTICE_RECOMMENDED = 'practice_recommended',
}

interface NotificationTemplate {
  icon: string;
  color: string;
  title: string;
  message: (data: Record<string, any>) => string;
  actionUrl?: (data: Record<string, any>) => string;
}

const templates: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.TEST_COMPLETED]: {
    icon: 'CheckCircle',
    color: 'success',
    title: 'Test Completed',
    message: (d) => `You completed a ${d.testType || 'test'} with ${d.score}/${d.total} correct answers.`,
    actionUrl: () => '/dashboard',
  },
  [NotificationType.RESULTS_READY]: {
    icon: 'BarChart',
    color: 'info',
    title: 'Results Available',
    message: (d) => `You scored ${d.percentage}% (${d.score}/${d.total}).`,
    actionUrl: () => '/dashboard',
  },
  [NotificationType.BADGE_EARNED]: {
    icon: 'Trophy',
    color: 'success',
    title: 'Badge Unlocked!',
    message: (d) => `You earned the "${d.badgeName}" badge!`,
    actionUrl: () => '/achievements',
  },
  [NotificationType.STREAK_MILESTONE]: {
    icon: 'Flame',
    color: 'warning',
    title: 'Streak Milestone!',
    message: (d) => `You're on a ${d.streakDays}-day learning streak! Keep it up!`,
    actionUrl: () => '/dashboard',
  },
  [NotificationType.WEAKNESS_DETECTED]: {
    icon: 'AlertCircle',
    color: 'warning',
    title: 'Improvement Area Found',
    message: (d) => `Practice recommended for ${d.subject} (${d.percentage}% score).`,
    actionUrl: () => '/dashboard',
  },
  [NotificationType.PRACTICE_RECOMMENDED]: {
    icon: 'Target',
    color: 'info',
    title: 'Practice Ready',
    message: (d) => `${d.questionCount} practice questions ready for ${d.topic}.`,
    actionUrl: () => '/mock-tests',
  },
};

export const createNotification = async (
  userId: string,
  type: NotificationType,
  data: Record<string, any> = {}
): Promise<void> => {
  try {
    const template = templates[type];
    if (!template) return;

    await (supabase.from('user_notifications') as any).insert({
      user_id: userId,
      type,
      title: template.title,
      message: template.message(data),
      icon: template.icon,
      color: template.color,
      action_url: template.actionUrl?.(data) || null,
      related_type: data.relatedType || null,
      related_id: data.relatedId || null,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
