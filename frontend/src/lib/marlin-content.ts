// Hardcoded static content for the Marlin Test.
// Update these constants when the final content is provided.

export const MARLIN_GUIDANCE = `[PLACEHOLDER: General guidance for the Marlin Test will be provided here. This section will explain the task, what is expected from the tasker, and any relevant context needed before starting.]`;

export const MARLIN_STATIC_PROMPT = `[PLACEHOLDER: The static prompt for Section 3 will be provided here.]`;

export const MARLIN_STATIC_RESPONSE_A = `[PLACEHOLDER: Static Response A will be provided here.]`;

export const MARLIN_STATIC_RESPONSE_B = `[PLACEHOLDER: Static Response B will be provided here.]`;

export interface MarlinQuestion {
  id: string;
  text: string;
}

// Replace these placeholder questions with the real ones when provided.
export const MARLIN_QUESTIONS: MarlinQuestion[] = [
  { id: "q1", text: "[PLACEHOLDER: Question 1 will be provided here.]" },
  { id: "q2", text: "[PLACEHOLDER: Question 2 will be provided here.]" },
];
