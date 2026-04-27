export interface User {
  id: number;
  username: string;
  email: string;
  role: "tasker" | "admin" | "reviewer";
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Prompt {
  id: number;
  prompt_text: string;
  created_at: string;
  has_assessment: boolean;
  username?: string;
  user_id?: number;
}

export interface LLMResponse {
  id: number;
  variant: "A" | "B";
  response_text: string;
  model_config: {
    temperature: number;
    system: string;
  };
}

export interface GenerationResult {
  prompt_id: number;
  responses: {
    A: LLMResponse;
    B: LLMResponse;
  };
}

export interface Assessment {
  id: number;
  prompt_id: number;
  chosen_variant: "A" | "B";
  justification: string;
  created_at: string;
}

export interface FullAssessment extends Assessment {
  prompt_text: string;
  user_id?: number;
  username?: string;
  responses: {
    A: LLMResponse;
    B: LLMResponse;
  };
}

export interface AdminStats {
  total_users: number;
  total_taskers: number;
  total_admins: number;
  total_prompts: number;
  total_completed: number;
  total_pending: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PageParams {
  limit?: number;
  offset?: number;
  q?: string;
}

export interface ReviewQueueItem {
  marlin_test_id: number;
  user_id: number;
  prompt_text: string;
  test_created_at: string;
  tasker_username: string;
  review_id: number | null;
  review_status: "draft" | "submitted" | null;
  final_percent: number | null;
  submitted_at: string | null;
  reviewer_id: number | null;
}

export interface MarlinReview {
  id: number;
  marlin_test_id: number;
  reviewer_id: number;
  reviewer_username: string;
  status: "draft" | "submitted";
  final_percent: number | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarlinQuestionScore {
  id: number;
  review_id: number;
  question_key: string;
  expected_answer: string | null;
  given_answer: string;
  auto_score: number | null;
  override_score: number | null;
  final_score: number;
  weight: number;
  notes: string | null;
}

export interface MarlinReviewDetail {
  test: MarlinTest;
  review: MarlinReview;
  scores: MarlinQuestionScore[];
  weights: { default: number; overrides: Record<string, number> };
}

export interface MarlinTest {
  id: number;
  user_id: number;
  prompt_text: string;
  answers: Record<string, string>;
  created_at: string;
  username?: string;
  review_status?: "draft" | "submitted" | null;
  final_percent?: number | null;
  reviewer_id?: number | null;
  reviewer_username?: string | null;
}
