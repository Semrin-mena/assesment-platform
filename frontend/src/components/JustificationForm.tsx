"use client";

import { useState } from "react";

interface JustificationFormProps {
  selectedVariant: "A" | "B";
  onSubmit: (justification: string) => void;
  isLoading: boolean;
}

export default function JustificationForm({
  selectedVariant,
  onSubmit,
  isLoading,
}: JustificationFormProps) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
    }
  }

  const variantColor = selectedVariant === "A" ? "text-green-400" : "text-green-300";

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-subtle">
            <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.4 48.4 0 0 0 5.886-.503c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.4 48.4 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Write Your Justification</h2>
            <p className="text-sm text-gray-400">
              You chose <span className={`font-semibold ${variantColor}`}>Response {selectedVariant}</span> — explain why it&apos;s the better response.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <textarea
            id="justification"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            placeholder="Consider aspects like: code correctness, readability, edge case handling, efficiency, best practices, documentation..."
            rows={5}
            className="w-full rounded-lg border border-border bg-background px-4 py-3.5 text-sm leading-relaxed text-gray-100 placeholder-gray-600 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-40"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>{text.length} characters</span>
            <span>Be specific about strengths and weaknesses</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border bg-surface-raised/50 px-6 py-4">
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="flex items-center gap-2 rounded-lg bg-success px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-success/25 transition-all hover:bg-accent-hover hover:shadow-success/40 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Submitting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                Submit Assessment
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
