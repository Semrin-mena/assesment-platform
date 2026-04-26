import Link from "next/link";
import type { Prompt } from "@/types";

interface AssessmentCardProps {
  prompt: Prompt;
  disabled?: boolean;
}

export default function AssessmentCard({ prompt, disabled = false }: AssessmentCardProps) {
  const truncated =
    prompt.prompt_text.length > 150
      ? prompt.prompt_text.slice(0, 150) + "..."
      : prompt.prompt_text;

  const date = new Date(prompt.created_at + "Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCompleted = prompt.has_assessment;

  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="mb-3 flex items-center gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isCompleted ? "bg-success-subtle" : "bg-warning-subtle"
          }`}>
            {isCompleted ? (
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <span className="rounded-full border border-success/20 bg-success-subtle px-2.5 py-0.5 text-xs font-medium text-success">
                Completed
              </span>
            ) : (
              <span className="rounded-full border border-warning/20 bg-warning-subtle px-2.5 py-0.5 text-xs font-medium text-warning">
                Pending Review
              </span>
            )}
            <span className="text-xs text-gray-500">{date}</span>
          </div>
        </div>
        <p className={`text-sm leading-relaxed ${disabled ? "text-gray-500" : "text-gray-300 group-hover:text-gray-200"}`}>
          {truncated}
        </p>
      </div>

      {!disabled && (
        <svg
          className="mt-1 h-5 w-5 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      )}
    </div>
  );

  if (disabled) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 opacity-50 cursor-not-allowed select-none">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={isCompleted ? `/assessments/${prompt.id}` : `/assessments/new`}
      className="group block rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-border-hover hover:bg-surface-raised hover:shadow-lg hover:shadow-black/20"
    >
      {inner}
    </Link>
  );
}
