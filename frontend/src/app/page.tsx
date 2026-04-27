"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { listPrompts, listMarlinTests } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/AuthGuard";
import AssessmentCard from "@/components/AssessmentCard";
import MarlinTestCard from "@/components/MarlinTestCard";
import Pagination from "@/components/Pagination";
import type { Prompt, MarlinTest } from "@/types";

const PAGE_SIZE = 10;

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

interface SectionItem {
  id: number;
  completed: boolean;
}

interface AssessmentSectionProps {
  title: string;
  description: string;
  icon: ReactNode;
  accentClass: string;
  emptyIconClass: string;
  items: SectionItem[];
  renderItem: (item: SectionItem) => ReactNode;
  newHref: string;
  newLabel: string;
  loading: boolean;
  disabled?: boolean;
  total?: number;
  footer?: ReactNode;
}

function AssessmentSection({
  title,
  description,
  icon,
  accentClass,
  emptyIconClass,
  items,
  renderItem,
  newHref,
  newLabel,
  loading,
  disabled = false,
  total,
  footer,
}: AssessmentSectionProps) {
  const completed = items.filter((i) => i.completed).length;
  const pending = items.filter((i) => !i.completed).length;
  const displayTotal = total ?? items.length;

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Section header */}
      <div className={`border-b border-border px-6 py-5 ${accentClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/20">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <p className="text-sm text-white/60">{description}</p>
            </div>
          </div>
          {disabled ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-black/25 px-4 py-2 text-sm font-semibold text-white/40 cursor-not-allowed select-none">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              {newLabel}
            </span>
          ) : (
            <Link
              href={newHref}
              className="inline-flex items-center gap-2 rounded-lg bg-black/25 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-black/40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {newLabel}
            </Link>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total</p>
          <p className="mt-0.5 text-xl font-bold text-white">{loading ? "—" : displayTotal}</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Completed</p>
          <p className="mt-0.5 text-xl font-bold text-success">{loading ? "—" : completed}</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Pending</p>
          <p className="mt-0.5 text-xl font-bold text-warning">{loading ? "—" : pending}</p>
        </div>
      </div>

      {/* Not available banner */}
      {disabled && (
        <div className="flex items-center gap-3 border-b border-border bg-gray-900/60 px-6 py-3">
          <svg className="h-4 w-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-sm font-medium text-gray-400">
            Currently not available — this assessment type is temporarily disabled.
          </p>
        </div>
      )}

      {/* List */}
      <div className="min-h-[220px] p-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${disabled ? "bg-gray-800 text-gray-600" : emptyIconClass}`}>
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-400">No submissions yet</p>
            {!disabled && (
              <Link
                href={newHref}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {newLabel}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => renderItem(item))}
          </div>
        )}
      </div>
      {!loading && footer && <div className="border-t border-border p-4">{footer}</div>}
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptsTotal, setPromptsTotal] = useState(0);
  const [promptsOffset, setPromptsOffset] = useState(0);
  const [marlinTests, setMarlinTests] = useState<MarlinTest[]>([]);
  const [marlinTotal, setMarlinTotal] = useState(0);
  const [marlinOffset, setMarlinOffset] = useState(0);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [loadingMarlin, setLoadingMarlin] = useState(true);
  const [error, setError] = useState("");

  const loadPrompts = useCallback((offset: number) => {
    setLoadingPrompts(true);
    return listPrompts({ limit: PAGE_SIZE, offset })
      .then((res) => {
        setPrompts(res.items);
        setPromptsTotal(res.total);
        setPromptsOffset(res.offset);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingPrompts(false));
  }, []);

  const loadMarlin = useCallback((offset: number) => {
    setLoadingMarlin(true);
    return listMarlinTests({ limit: PAGE_SIZE, offset })
      .then((res) => {
        setMarlinTests(res.items);
        setMarlinTotal(res.total);
        setMarlinOffset(res.offset);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingMarlin(false));
  }, []);

  useEffect(() => {
    loadPrompts(0);
    loadMarlin(0);
  }, [loadPrompts, loadMarlin]);

  if (error) {
    return (
      <div className="animate-fade-in rounded-xl border border-danger/30 bg-danger-subtle p-6 text-center">
        <svg className="mx-auto h-10 w-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <p className="mt-3 text-sm text-red-300">{error}</p>
        <p className="mt-1 text-xs text-gray-500">Make sure the backend server is running on port 5000</p>
      </div>
    );
  }

  const promptItems: SectionItem[] = prompts.map((p) => ({
    id: p.id,
    completed: p.has_assessment,
  }));

  const marlinItems: SectionItem[] = marlinTests.map((t) => ({
    id: t.id,
    completed: true,
  }));

  const promptById = Object.fromEntries(prompts.map((p) => [p.id, p]));
  const marlinById = Object.fromEntries(marlinTests.map((t) => [t.id, t]));

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-gray-400">
          Welcome back, <span className="text-gray-200">{user?.username}</span>. Choose an assessment type to get started.
        </p>
      </div>

      {/* Assessment type sections */}
      <div className="space-y-6">
        <AssessmentSection
          title="Marlin Test"
          description="Structured evaluation tasks for model behaviour analysis"
          icon={
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          }
          accentClass="bg-gradient-to-r from-accent/20 to-transparent"
          emptyIconClass="bg-accent-subtle text-accent"
          items={marlinItems}
          renderItem={(item) => <MarlinTestCard key={item.id} test={marlinById[item.id]} />}
          newHref="/marlin-test/new"
          newLabel="New Marlin Test"
          loading={loadingMarlin}
          total={marlinTotal}
          footer={
            <Pagination
              total={marlinTotal}
              limit={PAGE_SIZE}
              offset={marlinOffset}
              onChange={(o) => loadMarlin(o)}
            />
          }
        />

        <AssessmentSection
          title="Code Comparison"
          description="Compare two AI-generated responses and pick the better one"
          icon={
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
          }
          accentClass="bg-gradient-to-r from-accent/20 to-transparent"
          emptyIconClass="bg-accent-subtle text-accent"
          items={promptItems}
          renderItem={(item) => <AssessmentCard key={item.id} prompt={promptById[item.id]} disabled />}
          newHref="/assessments/new"
          newLabel="New Assessment"
          loading={loadingPrompts}
          disabled
          total={promptsTotal}
          footer={
            <Pagination
              total={promptsTotal}
              limit={PAGE_SIZE}
              offset={promptsOffset}
              onChange={(o) => loadPrompts(o)}
            />
          }
        />
      </div>
    </div>
  );
}
