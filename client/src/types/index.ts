export interface User {
  id: number;
  email: string;
  name: string | null;
  has_completed_onboarding: boolean;
  default_reminder_threshold: number;
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
  latest_rating?: Rating | null;
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
  scores?: RatingScore[];
}

export interface RatingScore {
  id: number;
  rating_id: number;
  criterion_id: number;
  score: number;
  criterion_name: string;
  criterion_tier: string;
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

// API request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateRatingRequest {
  partner_id: number;
  scores: {
    criterionId: number;
    criterionName: string;
    tier: 'dealbreaker' | 'important' | 'nice-to-have';
    score: number;
  }[];
  notes?: string;
}
