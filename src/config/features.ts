export interface FeatureConfig {
  id: string;
  name: string;
  tier: 'free' | 'protected' | 'premium';
  requiresAuth: boolean;
  guestAllowed: boolean;
  guestMessage?: string;
}

export const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  // Free tools (guest allowed)
  'gpa-calculator': {
    id: 'gpa-calculator',
    name: 'GPA Calculator',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
  },
  'cgpa-calculator': {
    id: 'cgpa-calculator',
    name: 'CGPA Calculator',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
  },
  'percentage-calculator': {
    id: 'percentage-calculator',
    name: 'Percentage Calculator',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
  },
  'age-calculator': {
    id: 'age-calculator',
    name: 'Age Calculator',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
  },
  'bmi-calculator': {
    id: 'bmi-calculator',
    name: 'BMI Calculator',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
  },
  'calculator': {
    id: 'calculator',
    name: 'Calculator',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
  },

  // Protected features (auth required)
  'mcq-test': {
    id: 'mcq-test',
    name: 'MCQ Test',
    tier: 'protected',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to save results and track progress',
  },
  'ai-coach': {
    id: 'ai-coach',
    name: 'AI Coach',
    tier: 'protected',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to get personalized recommendations',
  },
  'analytics': {
    id: 'analytics',
    name: 'Analytics',
    tier: 'protected',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to view your detailed analytics',
  },
  'progress-tracker': {
    id: 'progress-tracker',
    name: 'Progress Tracker',
    tier: 'protected',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to track your improvement over time',
  },
  'ai-test-generator': {
    id: 'ai-test-generator',
    name: 'AI Test Generator',
    tier: 'protected',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to generate custom AI-powered tests',
  },
  'study-planner': {
    id: 'study-planner',
    name: 'Study Planner',
    tier: 'protected',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to create and manage your study plans',
  },

  // Core app surfaces — guest policy lives here (single source of truth)
  'mock-tests': {
    id: 'mock-tests',
    name: 'Mock Tests',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
    guestMessage: 'Free demo attempt — sign in to unlock the full paper',
  },
  'quick-test': {
    id: 'quick-test',
    name: 'Quick Test',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
    guestMessage: 'Try free — sign in to save results and unlock explanations',
  },
  'board-topics': {
    id: 'board-topics',
    name: 'Board Topic Practice',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
  },
  'leaderboard': {
    id: 'leaderboard',
    name: 'Leaderboard',
    tier: 'free',
    requiresAuth: false,
    guestAllowed: true,
    guestMessage: 'Sign in to appear on the leaderboard',
  },
  'custom-syllabus': {
    id: 'custom-syllabus',
    name: 'Custom Syllabus Builder',
    tier: 'protected',
    // Content/browsing stays open; only the run/save ACTIONS are gated.
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to run your syllabus',
  },
  'dashboard': {
    id: 'dashboard',
    name: 'Dashboard',
    tier: 'protected',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to unlock your dashboard',
  },
  'achievements': {
    id: 'achievements',
    name: 'Achievements',
    tier: 'protected',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to unlock achievements',
  },
  'profile': {
    id: 'profile',
    name: 'Profile',
    tier: 'protected',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in to unlock your profile',
  },

  // Premium features
  'advanced-analytics': {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    tier: 'premium',
    requiresAuth: true,
    guestAllowed: false,
    guestMessage: 'Sign in for advanced analytics and insights',
  },
  'pdf-export': {
    id: 'pdf-export',
    name: 'PDF Export',
    tier: 'premium',
    requiresAuth: true,
    guestAllowed: false,
  },
  'bulk-operations': {
    id: 'bulk-operations',
    name: 'Bulk Operations',
    tier: 'premium',
    requiresAuth: true,
    guestAllowed: false,
  },
};

/**
 * Route → feature mapping. Route guards and in-page gates both resolve their
 * guest policy from here so rules cannot drift per feature.
 */
export const ROUTE_FEATURE_MAP: Array<{ prefix: string; featureId: string }> = [
  { prefix: '/mock-tests', featureId: 'mock-tests' },
  { prefix: '/custom-syllabus', featureId: 'custom-syllabus' },
  { prefix: '/leaderboard', featureId: 'leaderboard' },
  { prefix: '/dashboard', featureId: 'dashboard' },
  { prefix: '/analytics', featureId: 'analytics' },
  { prefix: '/ai-coach', featureId: 'ai-coach' },
  { prefix: '/achievements', featureId: 'achievements' },
  { prefix: '/profile', featureId: 'profile' },
  { prefix: '/boards', featureId: 'board-topics' },
  { prefix: '/quizzes', featureId: 'quick-test' },
];

export const getFeatureForPath = (pathname: string): FeatureConfig | null => {
  const match = ROUTE_FEATURE_MAP.filter((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return match ? getFeatureConfig(match.featureId) : null;
};

/** Canonical CTA vocabulary: "Try free" (guest allowed) vs "Sign in to unlock" (gated). */
export const ctaLabel = (featureId: string): string =>
  allowsGuest(featureId) ? 'Try free' : 'Sign in to unlock';

export const requiresAuth = (featureId: string): boolean => {
  const config = FEATURE_CONFIG[featureId];
  return config ? config.requiresAuth : true; // default to auth required
};

export const allowsGuest = (featureId: string): boolean => {
  const config = FEATURE_CONFIG[featureId];
  return config ? config.guestAllowed : false;
};

export const getFeatureConfig = (featureId: string): FeatureConfig | null => {
  return FEATURE_CONFIG[featureId] || null;
};
