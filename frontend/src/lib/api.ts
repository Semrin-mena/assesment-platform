const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
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

import type { Prompt, GenerationResult } from "@/types";

export async function submitPrompt(promptText: string): Promise<GenerationResult> {
  return request<GenerationResult>("/api/prompts", {
    method: "POST",
    body: JSON.stringify({ prompt_text: promptText }),
  });
}

export async function listPrompts(): Promise<Prompt[]> {
  return request<Prompt[]>("/api/prompts");
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

export async function listMarlinTests(): Promise<MarlinTest[]> {
  return request<MarlinTest[]>("/api/marlin");
}

export async function getMarlinTest(id: number): Promise<MarlinTest> {
  return request<MarlinTest>(`/api/marlin/${id}`);
}

export async function adminListMarlinTests(): Promise<MarlinTest[]> {
  return request<MarlinTest[]>("/api/marlin/admin/all");
}

// --- Admin ---

import type { AdminStats } from "@/types";

export async function adminGetStats(): Promise<AdminStats> {
  return request<AdminStats>("/api/admin/stats");
}

export async function adminListSubmissions(): Promise<Prompt[]> {
  return request<Prompt[]>("/api/admin/submissions");
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

export async function adminListUsers(): Promise<User[]> {
  return request<User[]>("/api/admin/users");
}
