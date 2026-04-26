"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PromptForm from "@/components/PromptForm";
import ComparisonView from "@/components/ComparisonView";
import JustificationForm from "@/components/JustificationForm";
import { submitPrompt, submitAssessment } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import type { GenerationResult } from "@/types";

type Step = "prompt" | "loading" | "compare" | "justify";

const steps = [
  { key: "prompt", label: "Write Prompt" },
  { key: "compare", label: "Compare" },
  { key: "justify", label: "Justify" },
] as const;

function getStepIndex(step: Step): number {
  if (step === "prompt" || step === "loading") return 0;
  if (step === "compare") return 1;
  return 2;
}

export default function NewAssessmentPage() {
  return (
    <AuthGuard>
      <NewAssessmentContent />
    </AuthGuard>
  );
}

function NewAssessmentContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("prompt");
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<"A" | "B" | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentIndex = getStepIndex(step);

  async function handlePromptSubmit(promptText: string) {
    setStep("loading");
    setError("");
    try {
      const result = await submitPrompt(promptText);
      setGeneration(result);
      setStep("compare");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate responses");
      setStep("prompt");
    }
  }

  function handleSelect(variant: "A" | "B") {
    setSelectedVariant(variant);
    setStep("justify");
  }

  async function handleJustificationSubmit(justification: string) {
    if (!generation || !selectedVariant) return;
    setSubmitting(true);
    setError("");
    try {
      const assessment = await submitAssessment(
        generation.prompt_id,
        selectedVariant,
        justification
      );
      router.push(`/assessments/${assessment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit assessment");
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">New Assessment</h1>
        <p className="mt-1 text-gray-400">Generate, compare, and evaluate AI code responses</p>
      </div>

      {/* Step progress indicator */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.key} className={`flex items-center gap-1 ${i < steps.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    i < currentIndex
                      ? "bg-success text-white"
                      : i === currentIndex
                        ? "bg-accent text-white shadow-lg shadow-accent/30 animate-pulse-glow"
                        : "bg-surface-raised text-gray-500 border border-border"
                  }`}
                >
                  {i < currentIndex ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
              </div>
              <span className={`text-xs font-medium transition-colors ${
                i <= currentIndex ? "text-gray-300" : "text-gray-600"
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${
                i < currentIndex ? "bg-success" : "bg-border"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="animate-fade-in flex items-center gap-3 rounded-xl border border-danger/30 bg-danger-subtle px-5 py-4">
          <svg className="h-5 w-5 shrink-0 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-300">{error}</p>
            <p className="mt-0.5 text-xs text-red-400/60">Check that the backend is running and your API key is configured.</p>
          </div>
        </div>
      )}

      {/* Step 1: Prompt input */}
      {(step === "prompt" || step === "loading") && (
        <PromptForm onSubmit={handlePromptSubmit} isLoading={step === "loading"} />
      )}

      {/* Step 2: Loading state */}
      {step === "loading" && (
        <div className="animate-fade-in rounded-xl border border-border bg-surface p-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-accent/20 border-t-accent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">Generating Responses</h3>
            <p className="mt-1.5 text-sm text-gray-400">The AI is writing two different solutions. This may take 15–30 seconds.</p>
            <div className="mt-6 w-full max-w-xs">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                <div className="h-full animate-shimmer rounded-full bg-accent/30" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Compare responses */}
      {(step === "compare" || step === "justify") && generation && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle">
                <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Compare Responses</h2>
                <p className="text-sm text-gray-400">Review both solutions and select the one you think is better.</p>
              </div>
            </div>
            <ComparisonView
              responses={generation.responses}
              selectedVariant={selectedVariant}
              onSelect={handleSelect}
            />
          </div>

          {/* Step 4: Justification */}
          {step === "justify" && selectedVariant && (
            <JustificationForm
              selectedVariant={selectedVariant}
              onSubmit={handleJustificationSubmit}
              isLoading={submitting}
            />
          )}
        </>
      )}
    </div>
  );
}
