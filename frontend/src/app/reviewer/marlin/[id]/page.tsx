"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { reviewerGetMarlin, reviewerSaveMarlin } from "@/lib/api";
import type { MarlinReviewDetail, MarlinQuestionScore } from "@/types";
import {
  COMPARISON_QUESTIONS,
  INDIVIDUAL_QUESTIONS_A,
  INDIVIDUAL_QUESTIONS_B,
  SCALE_OPTIONS,
} from "@/app/marlin-test/_content";

interface QuestionMeta {
  key: string;
  label: string;
  prompt: string;
  isMC: boolean;
}

const QUESTION_META: QuestionMeta[] = [
  ...INDIVIDUAL_QUESTIONS_A.map((q) => ({
    key: q.id,
    label: `Model A · ${q.label}`,
    prompt: q.question,
    isMC: false,
  })),
  ...INDIVIDUAL_QUESTIONS_B.map((q) => ({
    key: q.id,
    label: `Model B · ${q.label}`,
    prompt: q.question,
    isMC: false,
  })),
  ...COMPARISON_QUESTIONS.map((q, i) => ({
    key: q.id,
    label: `Comparison ${i + 1}`,
    prompt: q.question,
    isMC: !["cq12", "cq14"].includes(q.id),
  })),
];

const META_BY_KEY: Record<string, QuestionMeta> = Object.fromEntries(
  QUESTION_META.map((q) => [q.key, q])
);

const SCALE_LABEL = Object.fromEntries(
  SCALE_OPTIONS.map((o) => [o.value, `${o.side === "a" ? "A" : o.side === "b" ? "B" : ""} ${o.label}`.trim()])
);

function scaleLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return SCALE_LABEL[value] ?? value;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MarlinReviewPage({ params }: PageProps) {
  const { id } = use(params);
  const testId = Number(id);
  const { user } = useAuth();

  const [data, setData] = useState<MarlinReviewDetail | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { score: string; notes: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const canEdit = user?.role === "reviewer";
  const canView = user?.role === "reviewer" || user?.role === "admin";

  useEffect(() => {
    if (!canView) return;
    reviewerGetMarlin(testId)
      .then((d) => {
        setData(d);
        const init: Record<string, { score: string; notes: string }> = {};
        for (const s of d.scores) {
          init[s.question_key] = {
            score: String(s.override_score != null ? s.override_score : s.final_score),
            notes: s.notes ?? "",
          };
        }
        setOverrides(init);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [testId, user, canView]);

  const submitted = data?.review.status === "submitted";
  const formLocked = submitted || !canEdit;

  const liveScores = useMemo(() => {
    if (!data) return [];
    return data.scores.map((s) => {
      const o = overrides[s.question_key];
      const parsed = o ? Number(o.score) : NaN;
      const final = Number.isFinite(parsed) ? parsed : s.final_score;
      return { ...s, final_score: final };
    });
  }, [data, overrides]);

  const livePercent = useMemo(() => {
    const totalW = liveScores.reduce((a, s) => a + s.weight, 0);
    if (totalW === 0) return 0;
    const sum = liveScores.reduce((a, s) => a + s.final_score * s.weight, 0);
    return Math.round((sum / totalW) * 10000) / 100;
  }, [liveScores]);

  const save = async (submit: boolean) => {
    if (!data) return;
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        scores: data.scores.map((s) => {
          const o = overrides[s.question_key];
          const raw = o?.score ?? "";
          const num = raw === "" ? null : Number(raw);
          // If the value matches auto, treat as no override (null).
          const override =
            num == null || (s.auto_score != null && Math.abs(num - s.auto_score) < 1e-9)
              ? null
              : num;
          return {
            question_key: s.question_key,
            override_score: override,
            notes: o?.notes ?? null,
          };
        }),
        submit,
      };
      const res = await reviewerSaveMarlin(testId, payload);
      setData((prev) => (prev ? { ...prev, review: res.review, scores: res.scores } : prev));
      setInfo(submit ? "Review submitted." : "Draft saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!user || !canView) {
    return <div className="py-20 text-center text-sm text-gray-400">Reviewer or admin access required.</div>;
  }
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  if (error && !data) {
    return <div className="rounded-xl border border-danger/30 bg-danger-subtle p-4 text-sm text-red-300">{error}</div>;
  }
  if (!data) return null;

  const { test, scores } = data;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={canEdit ? "/reviewer" : "/admin"}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            ← Back
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {canEdit ? "Review" : "Reviewed"} · Marlin Test #{test.id}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Tasker: <span className="text-gray-200">{test.username}</span>
            {data.review.reviewer_username && (
              <> · Reviewer: <span className="text-gray-200">{data.review.reviewer_username}</span></>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-3 text-right">
          <p className="text-xs uppercase tracking-wider text-gray-500">Total</p>
          <p className="mt-0.5 text-2xl font-bold text-white">{livePercent.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">{submitted ? "Submitted" : "Draft"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs uppercase tracking-wider text-gray-500">Tasker prompt</p>
        <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{test.prompt_text}</p>
      </div>

      {(error || info) && (
        <div className={`rounded-xl border p-4 text-sm ${error ? "border-danger/30 bg-danger-subtle text-red-300" : "border-green-500/30 bg-green-500/10 text-green-300"}`}>
          {error || info}
        </div>
      )}

      <div className="space-y-4">
        {scores.map((s) => (
          <ScoreRow
            key={s.question_key}
            score={s}
            override={overrides[s.question_key]}
            disabled={formLocked}
            onChange={(patch) =>
              setOverrides((prev) => ({
                ...prev,
                [s.question_key]: { ...prev[s.question_key], ...patch },
              }))
            }
          />
        ))}
      </div>

      {canEdit && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 shadow-lg">
          <div className="text-sm text-gray-400">
            Live total: <span className="font-semibold text-white">{livePercent.toFixed(1)}%</span>
          </div>
          <div className="flex gap-2">
            <button
              disabled={saving || submitted}
              onClick={() => save(false)}
              className="rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-gray-200 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
            <button
              disabled={saving || submitted}
              onClick={() => save(true)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitted ? "Submitted" : "Submit Review"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreRow({
  score,
  override,
  disabled,
  onChange,
}: {
  score: MarlinQuestionScore;
  override?: { score: string; notes: string };
  disabled: boolean;
  onChange: (patch: Partial<{ score: string; notes: string }>) => void;
}) {
  const meta = META_BY_KEY[score.question_key];
  const labelText = meta ? meta.label : score.question_key;
  const promptText = meta ? meta.prompt : "";

  const autoLabel = (() => {
    if (score.auto_score == null) return null;
    if (score.expected_answer && score.given_answer === score.expected_answer) return "Exact match";
    if (score.auto_score === 0.75) return "Off-by-one across midline";
    if (score.auto_score === 0.5) return "Off-by-one";
    if (score.auto_score === 0) return "Off-by-multiple";
    return null;
  })();

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border bg-surface-raised px-2 py-0.5 text-xs font-mono text-gray-400">
              {score.question_key}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{labelText}</span>
            <span className="rounded-full border border-border bg-surface-raised px-2 py-0.5 text-xs text-gray-500">
              weight {score.weight}
            </span>
          </div>
          {promptText && <p className="mt-2 text-sm text-gray-300">{promptText}</p>}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Tasker answer</p>
          {meta?.isMC ? (
            <p className="mt-1 text-sm text-gray-200">{scaleLabel(score.given_answer)}</p>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">{score.given_answer || <span className="text-gray-600">—</span>}</p>
          )}
        </div>
        {meta?.isMC && (
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Expected</p>
            <p className="mt-1 text-sm text-gray-200">{scaleLabel(score.expected_answer)}</p>
            {autoLabel && (
              <p className="mt-1 text-xs text-gray-500">
                Auto: <span className="font-medium text-gray-300">{score.auto_score?.toFixed(2)}</span> · {autoLabel}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs uppercase tracking-wider text-gray-500">Score (0.00–1.00)</label>
          <input
            type="number"
            step="0.05"
            min={0}
            max={1}
            disabled={disabled}
            value={override?.score ?? ""}
            onChange={(e) => onChange({ score: e.target.value })}
            className="mt-1 w-32 rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
          />
        </div>
        <div className="flex-[2]">
          <label className="text-xs uppercase tracking-wider text-gray-500">Notes</label>
          <input
            type="text"
            disabled={disabled}
            value={override?.notes ?? ""}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Optional rationale"
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
