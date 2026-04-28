const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function withPageParams(path: string, params?: { limit?: number; offset?: number; q?: string }): string {
  if (!params) return path;
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  if (params.q != null && params.q.length > 0) qs.set("q", params.q);
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

// Skip the auto-logout side-effect for these paths so a wrong-password attempt
// doesn't try to "log the user out" (they aren't logged in).
const AUTH_PATHS_THAT_RETURN_401 = ["/api/auth/login", "/api/auth/me"];

function handleSessionExpired() {
  if (typeof window === "undefined") return;
  // Clear token and bounce to login. We avoid importing the auth context here
  // to keep this module framework-agnostic; auth-context picks up the missing
  // token on next mount.
  localStorage.removeItem("token");
  if (!window.location.pathname.startsWith("/login")) {
    window.location.replace("/login?expired=1");
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (res.status === 401 && token && !AUTH_PATHS_THAT_RETURN_401.some((p) => path.startsWith(p))) {
    handleSessionExpired();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// --- Auth ---

import type { AuthResponse, User } from "@/types";

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function getMe(): Promise<User> {
  return request<User>("/api/auth/me");
}

// --- Prompts ---

import type { Prompt, GenerationResult, Paginated, PageParams } from "@/types";

export async function submitPrompt(promptText: string): Promise<GenerationResult> {
  return request<GenerationResult>("/api/prompts", {
    method: "POST",
    body: JSON.stringify({ prompt_text: promptText }),
  });
}

export async function listPrompts(params?: PageParams): Promise<Paginated<Prompt>> {
  return request<Paginated<Prompt>>(withPageParams("/api/prompts", params));
}

// --- Assessments ---

import type { Assessment, FullAssessment } from "@/types";

export async function submitAssessment(
  promptId: number,
  chosenVariant: "A" | "B",
  justification: string
): Promise<Assessment> {
  return request<Assessment>("/api/assessments", {
    method: "POST",
    body: JSON.stringify({
      prompt_id: promptId,
      chosen_variant: chosenVariant,
      justification,
    }),
  });
}

export async function getAssessment(id: number): Promise<FullAssessment> {
  return request<FullAssessment>(`/api/assessments/${id}`);
}

// --- Marlin Tests ---

import type { MarlinTest } from "@/types";

export async function submitMarlinTest(
  promptText: string,
  answers: Record<string, string>
): Promise<MarlinTest> {
  return request<MarlinTest>("/api/marlin", {
    method: "POST",
    body: JSON.stringify({ prompt_text: promptText, answers }),
  });
}

export async function listMarlinTests(params?: PageParams): Promise<Paginated<MarlinTest>> {
  return request<Paginated<MarlinTest>>(withPageParams("/api/marlin", params));
}

export async function getMarlinTest(id: number): Promise<MarlinTest> {
  return request<MarlinTest>(`/api/marlin/${id}`);
}

export async function adminListMarlinTests(
  params?: PageParams & { review_status?: "pending" | "in_review" | "reviewed" }
): Promise<Paginated<MarlinTest>> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  if (params?.q) qs.set("q", params.q);
  if (params?.review_status) qs.set("review_status", params.review_status);
  const s = qs.toString();
  return request<Paginated<MarlinTest>>(`/api/marlin/admin/all${s ? `?${s}` : ""}`);
}

// --- Admin ---

import type { AdminStats } from "@/types";

export async function adminGetStats(): Promise<AdminStats> {
  return request<AdminStats>("/api/admin/stats");
}

export async function adminListSubmissions(params?: PageParams): Promise<Paginated<Prompt>> {
  return request<Paginated<Prompt>>(withPageParams("/api/admin/submissions", params));
}

export async function adminGetSubmission(promptId: number): Promise<{
  id: number;
  prompt_text: string;
  username: string;
  user_id: number;
  responses: { A: import("@/types").LLMResponse; B: import("@/types").LLMResponse };
  assessment: FullAssessment | null;
}> {
  return request(`/api/admin/submissions/${promptId}`);
}

export async function adminListUsers(params?: PageParams): Promise<Paginated<User>> {
  return request<Paginated<User>>(withPageParams("/api/admin/users", params));
}

export async function adminCreateUser(payload: {
  username: string;
  email: string;
  password: string;
  role: User["role"];
}): Promise<User> {
  return request<User>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateUser(
  userId: number,
  payload: Partial<{ username: string; email: string; role: User["role"]; password: string }>
): Promise<User> {
  return request<User>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteUser(userId: number): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/api/admin/users/${userId}`, { method: "DELETE" });
}

// --- Reviews ---

import type {
  ReviewQueueItem,
  MarlinReviewDetail,
  MarlinReview,
  MarlinQuestionScore,
} from "@/types";

export async function reviewerQueue(
  status: "pending" | "reviewed",
  params?: PageParams
): Promise<Paginated<ReviewQueueItem>> {
  const qs = new URLSearchParams();
  qs.set("status", status);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  if (params?.q) qs.set("q", params.q);
  return request<Paginated<ReviewQueueItem>>(`/api/reviews/queue?${qs.toString()}`);
}

export async function reviewerGetMarlin(testId: number): Promise<MarlinReviewDetail> {
  return request<MarlinReviewDetail>(`/api/reviews/marlin/${testId}`);
}

export async function reviewerSaveMarlin(
  testId: number,
  payload: {
    scores: { question_key: string; override_score: number | null; notes: string | null }[];
    submit?: boolean;
  }
): Promise<{ review: MarlinReview; scores: MarlinQuestionScore[] }> {
  return request<{ review: MarlinReview; scores: MarlinQuestionScore[] }>(
    `/api/reviews/marlin/${testId}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
}
