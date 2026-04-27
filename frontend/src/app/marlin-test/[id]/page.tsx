"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { getMarlinTest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { MarlinTest } from "@/types";
import {
  PROMPT_TEXT,
  RESPONSE_TEXT_A,
  RESPONSE_TEXT_B,
  MODEL_A_FILES,
  MODEL_B_FILES,
  INDIVIDUAL_QUESTIONS_A,
  INDIVIDUAL_QUESTIONS_B,
  COMPARISON_QUESTIONS,
  SCALE_OPTIONS,
  TEXT_ONLY_IDS,
  type FileChange,
} from "../_content";

export default function MarlinTestDetailPage() {
  return (
    <AuthGuard>
      <MarlinTestDetail />
    </AuthGuard>
  );
}

// ─── FileRow ──────────────────────────────────────────────────────────────────

function FileRow({ file }: { file: FileChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-surface-raised transition-colors"
      >
        <span className="font-mono text-xs text-gray-300">{file.path}</span>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-xs font-semibold text-green-400">+{file.added}</span>
          {file.removed != null && (
            <span className="text-xs font-semibold text-red-400">-{file.removed}</span>
          )}
          <svg
            className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-4 py-3 bg-black/40 overflow-x-auto">
          <pre className="text-xs leading-5 whitespace-pre font-mono">
            {file.diff.split("\n").map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith("+") ? "text-green-400 bg-green-500/10"
                  : line.startsWith("-") ? "text-red-400 bg-red-500/10"
                  : line.startsWith("@@") ? "text-blue-400"
                  : "text-gray-400"
                }
              >
                {line || " "}
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── ResponseCard ─────────────────────────────────────────────────────────────

function ResponseCard({
  variant,
  files,
  responseText,
}: {
  variant: "A" | "B";
  files: FileChange[];
  responseText: string;
}) {
  const [tab, setTab] = useState<"text" | "diff">("text");
  const totalAdded = files.reduce((s, f) => s + f.added, 0);
  const totalRemoved = files.reduce((s, f) => s + (f.removed ?? 0), 0);

  const isA = variant === "A";
  const borderClass = isA ? "border-blue-500/30" : "border-orange-500/30";
  const badgeClass = isA ? "bg-blue-500 shadow-blue-500/30" : "bg-orange-500 shadow-orange-500/30";
  const activeTabClass = isA
    ? "border-b-2 border-blue-400 text-blue-300"
    : "border-b-2 border-orange-400 text-orange-300";

  return (
    <div className={`rounded-xl border overflow-hidden flex flex-col ${borderClass}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-raised/60">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md text-white text-xs font-bold shadow-lg ${badgeClass}`}>
            {variant}
          </div>
          <span className="text-sm font-semibold text-white">Response {variant}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-400">{files.length} files</span>
          <span className="text-green-400 font-semibold">+{totalAdded}</span>
          {totalRemoved > 0 && <span className="text-red-400 font-semibold">-{totalRemoved}</span>}
        </div>
      </div>
      <div className="flex border-b border-border bg-surface-raised/30 px-4">
        {(["text", "diff"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-xs font-medium transition-colors capitalize ${
              tab === t ? activeTabClass : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t === "text" ? "Text Response" : "Code Changes"}
          </button>
        ))}
      </div>
      {tab === "text" && (
        <div className="p-5 min-h-[120px]">
          {responseText ? (
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {responseText}
            </p>
          ) : (
            <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-border">
              <p className="text-xs text-gray-600 italic">Text response not yet available</p>
            </div>
          )}
        </div>
      )}
      {tab === "diff" && (
        <div className="divide-y divide-border">
          {files.map((f) => <FileRow key={f.path} file={f} />)}
        </div>
      )}
    </div>
  );
}

// ─── ScaleDisplay (read-only) ─────────────────────────────────────────────────

function ScaleDisplay({ value, optionA, optionB }: { value: string; optionA?: string; optionB?: string }) {
  const mainOptions = SCALE_OPTIONS.filter((o) => o.side !== "na");
  const isNA = value === "na";
  const isA = value.startsWith("a_");
  const isB = value.startsWith("b_");
  const opt = SCALE_OPTIONS.find((o) => o.value === value);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="font-medium text-blue-400/80">{optionA || "Favors A"}</span>
        <span className="font-medium text-orange-400/80">{optionB || "Favors B"}</span>
      </div>
      <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border border-border">
        {mainOptions.map((o, idx) => {
          const isSelected = value === o.value;
          const distFromCenter = o.side === "a" ? 3 - idx : idx - 4;
          return (
            <div
              key={o.value}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 border-r border-border last:border-r-0 transition-all ${
                isSelected
                  ? o.side === "a"
                    ? "bg-blue-500/25 text-blue-200"
                    : "bg-orange-500/25 text-orange-200"
                  : "text-gray-700"
              }`}
            >
              <div
                className={`absolute bottom-0 left-0 right-0 ${
                  o.side === "a" ? "bg-blue-500/40" : "bg-orange-500/40"
                } ${isSelected ? "opacity-100" : "opacity-0"}`}
                style={{ height: `${(distFromCenter + 1) * 3 + 2}px` }}
              />
              <span className="text-[10px] font-semibold relative z-10">{o.side === "a" ? "A" : "B"}</span>
              <span className="text-[9px] leading-tight text-center relative z-10 hidden sm:block">{o.label}</span>
              {isSelected && (
                <div className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${
                  o.side === "a" ? "bg-blue-400" : "bg-orange-400"
                }`} />
              )}
            </div>
          );
        })}
        <div className={`px-4 flex items-center justify-center text-xs font-medium border-l-2 border-border ${
          isNA ? "bg-gray-500/20 text-gray-300" : "text-gray-700"
        }`}>
          N/A
        </div>
      </div>
      {value ? (
        <p className={`text-xs font-medium text-center ${
          isA ? "text-blue-400" : isB ? "text-orange-400" : "text-gray-400"
        }`}>
          {isNA ? "Not applicable" : `${isA ? "A" : "B"} — ${opt?.label}`}
        </p>
      ) : (
        <p className="text-xs text-center text-gray-600 italic">Not answered</p>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-accent/20 bg-gradient-to-r from-accent/10 to-transparent px-6 py-4">
      <h2 className="font-semibold text-white">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
    </div>
  );
}

// ─── Main detail page ─────────────────────────────────────────────────────────

function MarlinTestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [test, setTest] = useState<MarlinTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";
  const backHref = isAdmin ? "/admin" : "/";
  const backLabel = isAdmin ? "Admin Panel" : "Dashboard";

  useEffect(() => {
    getMarlinTest(Number(id))
      .then(setTest)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="animate-fade-in rounded-xl border border-danger/30 bg-danger-subtle p-6 text-center">
        <p className="text-sm text-red-300">{error || "Test not found"}</p>
        <Link href={backHref} className="mt-3 block text-sm font-medium text-accent hover:text-accent-hover">
          Back to {backLabel}
        </Link>
      </div>
    );
  }

  const date = new Date(test.created_at + "Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const answers = test.answers;

  return (
    <div className="animate-fade-in mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-subtle">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-accent">Marlin Test</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Submission Review</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {test.username && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                {test.username}
              </span>
            )}
            <span className="text-sm text-gray-500">{date}</span>
          </div>
        </div>
        <Link
          href={backHref}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-400 transition-all hover:border-border-hover hover:text-white"
        >
          {backLabel}
        </Link>
      </div>

      {/* Your submitted prompt */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-amber-500/20 px-6 py-4">
          <svg className="h-4 w-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <h2 className="font-semibold text-amber-300">Your Submitted Prompt</h2>
        </div>
        <div className="p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{test.prompt_text}</p>
        </div>
      </div>

      {/* Reference prompt */}
      <div className="rounded-2xl border border-accent/20 bg-surface overflow-hidden">
        <SectionHeader
          title="Reference Prompt"
          subtitle="The actual prompt used to generate the model responses"
        />
        <div className="p-6">
          <div className="max-h-52 overflow-y-auto rounded-xl border border-border bg-surface-raised p-5 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {PROMPT_TEXT}
          </div>
        </div>
      </div>

      {/* Model responses */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-white">Model Responses</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ResponseCard variant="A" files={MODEL_A_FILES} responseText={RESPONSE_TEXT_A} />
          <ResponseCard variant="B" files={MODEL_B_FILES} responseText={RESPONSE_TEXT_B} />
        </div>
      </div>

      {/* Model A individual feedback */}
      <div className="rounded-2xl border border-accent/20 bg-surface overflow-hidden">
        <SectionHeader title="Model A — Individual Feedback" />
        <div className="divide-y divide-border">
          {INDIVIDUAL_QUESTIONS_A.map((q) => (
            <div key={q.id} className="p-6 space-y-2">
              <p className="text-sm font-medium text-gray-300">
                <span className="font-semibold text-white mr-1">{q.label}</span>
                {q.question}
              </p>
              {answers[q.id] ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200 rounded-xl border border-border bg-surface-raised p-4">
                  {answers[q.id]}
                </p>
              ) : (
                <p className="text-sm italic text-gray-600">No answer provided</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Model B individual feedback */}
      <div className="rounded-2xl border border-accent/20 bg-surface overflow-hidden">
        <SectionHeader title="Model B — Individual Feedback" />
        <div className="divide-y divide-border">
          {INDIVIDUAL_QUESTIONS_B.map((q) => (
            <div key={q.id} className="p-6 space-y-2">
              <p className="text-sm font-medium text-gray-300">
                <span className="font-semibold text-white mr-1">{q.label}</span>
                {q.question}
              </p>
              {answers[q.id] ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200 rounded-xl border border-border bg-surface-raised p-4">
                  {answers[q.id]}
                </p>
              ) : (
                <p className="text-sm italic text-gray-600">No answer provided</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison questions */}
      <div className="rounded-2xl border border-accent/20 bg-surface overflow-hidden">
        <SectionHeader
          title="Comparison Questions"
          subtitle="Your ratings across both model responses"
        />
        <div className="divide-y divide-border">
          {COMPARISON_QUESTIONS.map((q, idx) => {
            const isText = TEXT_ONLY_IDS.has(q.id);
            return (
              <div key={q.id} className="px-6 py-5 space-y-1">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white mr-1">{idx + 1}.</span>
                  {q.question}
                </p>
                {isText ? (
                  answers[q.id] ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200 rounded-xl border border-border bg-surface-raised p-4 mt-2">
                      {answers[q.id]}
                    </p>
                  ) : (
                    <p className="text-sm italic text-gray-600 mt-1">No answer provided</p>
                  )
                ) : (
                  <ScaleDisplay
                    value={answers[q.id] ?? ""}
                    optionA={q.optionA || undefined}
                    optionB={q.optionB || undefined}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
