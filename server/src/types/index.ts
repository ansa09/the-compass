// Database entities
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  has_completed_onboarding: number;
  default_reminder_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Criterion {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  tier: 'dealbreaker' | 'important' | 'nice-to-have';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: number;
  user_id: number;
  first_name: string;
  photo_url: string | null;
  date_first_met: string | null;
  status: 'active' | 'past' | 'paused';
  dates_count: number;
  reminder_threshold: number | null;
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: number;
  partner_id: number;
  user_id: number;
  overall_score: number;
  traffic_light: 'green' | 'amber' | 'orange' | 'red';
  vibe_label: string;
  notes: string | null;
  ai_explanation: string | null;
  created_at: string;
}

export interface RatingScore {
  id: number;
  rating_id: number;
  criterion_id: number;
  score: number;
  criterion_name: string;
  criterion_tier: 'dealbreaker' | 'important' | 'nice-to-have';
  created_at: string;
}

export interface JournalEntry {
  id: number;
  partner_id: number;
  user_id: number;
  content: string;
  mood: 'excited' | 'hopeful' | 'uncertain' | 'confused' | 'happy' | 'disappointed' | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingResponse {
  id: number;
  user_id: number;
  question_number: number;
  question_text: string;
  answer: string;
  created_at: string;
}

// API request/response types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface SignupRequest extends AuthRequest {
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface UserPublic {
  id: number;
  email: string;
  name: string | null;
  has_completed_onboarding: boolean;
  default_reminder_threshold: number;
}

// Express Request with user
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

// Rating calculation types
export interface CriterionScore {
  criterionId: number;
  criterionName: string;
  tier: 'dealbreaker' | 'important' | 'nice-to-have';
  score: number;
}

export interface CalculatedRating {
  overallScore: number;
  trafficLight: 'green' | 'amber' | 'orange' | 'red';
  vibeLabel: string;
  scores: CriterionScore[];
}
