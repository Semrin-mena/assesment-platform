"use client";

import { useState } from "react";

interface PromptFormProps {
  onSubmit: (promptText: string) => void;
  isLoading: boolean;
}

export default function PromptForm({ onSubmit, isLoading }: PromptFormProps) {
  const [text, setText] = useState("");
  const charCount = text.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in space-y-5">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle">
            <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Describe Your Coding Task</h2>
            <p className="text-sm text-gray-400">Be specific about the language, requirements, and constraints.</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            id="prompt"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Write a Python function that takes a list of integers and returns the longest increasing subsequence. Include type hints and handle edge cases like empty lists."
            rows={7}
            className="w-full rounded-lg border border-border bg-background px-4 py-3.5 font-mono text-sm leading-relaxed text-gray-100 placeholder-gray-600 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-40"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>{charCount} characters</span>
            <span>Two AI responses will be generated</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !text.trim()}
        className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-accent/40 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating Responses...
          </>
        ) : (
          <>
            <svg className="h-5 w-5 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
            Generate Responses
          </>
        )}
      </button>
    </form>
  );
}
