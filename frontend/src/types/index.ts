export interface User {
  id: number;
  username: string;
  email: string;
  role: "tasker" | "admin";
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

export interface MarlinTest {
  id: number;
  user_id: number;
  prompt_text: string;
  answers: Record<string, string>;
  created_at: string;
  username?: string;
}
