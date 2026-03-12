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
