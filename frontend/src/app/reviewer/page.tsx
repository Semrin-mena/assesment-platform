"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { reviewerQueue } from "@/lib/api";
import type { ReviewQueueItem } from "@/types";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 20;
type Status = "pending" | "reviewed";

export default function ReviewerPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("pending");
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    (s: Status, o: number, q: string) => {
      setLoading(true);
      return reviewerQueue(s, { limit: PAGE_SIZE, offset: o, q })
        .then((res) => {
          setItems(res.items);
          setTotal(res.total);
          setOffset(res.offset);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    if (user?.role !== "reviewer") return;
    const handle = setTimeout(() => load(status, 0, search), 300);
    return () => clearTimeout(handle);
  }, [status, search, user, load]);

  if (!user || user.role !== "reviewer") {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-subtle">
          <svg className="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white">Access Denied</h2>
        <p className="mt-1 text-sm text-gray-400">You need reviewer privileges to view this page.</p>
        <Link href="/" className="mt-4 text-sm font-medium text-accent hover:text-accent-hover">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Review Queue</h1>
        <p className="mt-1 text-gray-400">Score Marlin Test submissions.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {(["pending", "reviewed"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setSearch(""); }}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
                status === s ? "bg-accent text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tasker or prompt..."
            className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger-subtle p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-gray-500">
          {search
            ? `No ${status} tests matching "${search}"`
            : status === "pending"
              ? "No pending tests — you're all caught up."
              : "No reviewed tests yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => <QueueRow key={it.marlin_test_id} item={it} />)}
          <Pagination
            total={total}
            limit={PAGE_SIZE}
            offset={offset}
            onChange={(o) => load(status, o, search)}
          />
        </div>
      )}
    </div>
  );
}

function QueueRow({ item }: { item: ReviewQueueItem }) {
  const isReviewed = item.review_status === "submitted";
  return (
    <Link
      href={`/reviewer/marlin/${item.marlin_test_id}`}
      className="group block rounded-xl border border-border bg-surface p-5 transition-all hover:border-accent/30 hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-accent/20 bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent">
              {item.tasker_username}
            </span>
            {isReviewed ? (
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                Reviewed · {item.final_percent?.toFixed(1)}%
              </span>
            ) : item.review_status === "draft" ? (
              <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                Draft
              </span>
            ) : (
              <span className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-gray-400">
                Unreviewed
              </span>
            )}
            <span className="text-xs text-gray-600">
              {new Date(item.test_created_at + "Z").toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-400 group-hover:text-gray-300 line-clamp-2">
            {item.prompt_text}
          </p>
        </div>
        <span className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-xs text-gray-500 font-mono">
          #{item.marlin_test_id}
        </span>
      </div>
    </Link>
  );
}
