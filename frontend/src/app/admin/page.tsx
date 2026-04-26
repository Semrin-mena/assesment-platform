"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { adminGetStats, adminListSubmissions, adminListUsers, adminListMarlinTests } from "@/lib/api";
import type { AdminStats, Prompt, User, MarlinTest } from "@/types";

type Tab = "marlin" | "submissions" | "users";

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [submissions, setSubmissions] = useState<Prompt[]>([]);
  const [marlinTests, setMarlinTests] = useState<MarlinTest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<Tab>("marlin");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    Promise.all([adminGetStats(), adminListSubmissions(), adminListUsers(), adminListMarlinTests()])
      .then(([s, sub, u, m]) => {
        setStats(s);
        setSubmissions(sub);
        setUsers(u);
        setMarlinTests(m);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const filteredMarlin = useMemo(() => {
    const q = search.toLowerCase();
    return marlinTests.filter(
      (t) =>
        !q ||
        t.username?.toLowerCase().includes(q) ||
        t.prompt_text.toLowerCase().includes(q)
    );
  }, [marlinTests, search]);

  const filteredSubmissions = useMemo(() => {
    const q = search.toLowerCase();
    return submissions.filter(
      (s) =>
        !q ||
        s.username?.toLowerCase().includes(q) ||
        s.prompt_text.toLowerCase().includes(q)
    );
  }, [submissions, search]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-subtle">
          <svg className="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white">Access Denied</h2>
        <p className="mt-1 text-sm text-gray-400">You need admin privileges to view this page.</p>
        <Link href="/" className="mt-4 text-sm font-medium text-accent hover:text-accent-hover">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-gray-400">Loading admin data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in rounded-xl border border-danger/30 bg-danger-subtle p-6 text-center">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  const completedCount = submissions.filter((s) => s.has_assessment).length;
  const pendingCount = submissions.filter((s) => !s.has_assessment).length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin Panel</h1>
          <p className="mt-1 text-gray-400">View all tasker submissions and manage users</p>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Users" value={stats.total_users} />
          <StatCard label="Taskers" value={stats.total_taskers} />
          <StatCard label="Admins" value={stats.total_admins} />
          <StatCard label="Prompts" value={stats.total_prompts} />
          <StatCard label="Completed" value={completedCount} color="text-green-400" />
          <StatCard label="Pending" value={pendingCount} color="text-yellow-400" />
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {(
            [
              { id: "marlin", label: "Marlin Tests", count: marlinTests.length },
              { id: "submissions", label: "Code Comparison", count: submissions.length },
              { id: "users", label: "Users", count: users.length },
            ] as { id: Tab; label: string; count: number }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(""); }}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-accent text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                tab === t.id ? "bg-white/20 text-white" : "bg-surface-raised text-gray-500"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "users" ? "Search by name or email..." : "Search by user or prompt..."}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          />
        </div>
      </div>

      {/* ── Marlin Tests tab ── */}
      {tab === "marlin" && (
        <div className="space-y-3">
          {filteredMarlin.length === 0 ? (
            <EmptyState
              message={search ? `No Marlin Tests matching "${search}"` : "No Marlin Test submissions yet."}
            />
          ) : (
            filteredMarlin.map((t) => <MarlinRow key={t.id} test={t} />)
          )}
        </div>
      )}

      {/* ── Code Comparison tab ── */}
      {tab === "submissions" && (
        <div className="space-y-3">
          {/* Not available notice */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-gray-900/60 px-5 py-3">
            <svg className="h-4 w-4 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className="text-sm font-medium text-gray-400">
              Code Comparison is currently not available — submissions are read-only.
            </p>
          </div>
          {/* Summary pills */}
          {!search && submissions.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {completedCount} completed
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                {pendingCount} pending
              </span>
            </div>
          )}
          {filteredSubmissions.length === 0 ? (
            <EmptyState
              message={search ? `No submissions matching "${search}"` : "No submissions yet."}
            />
          ) : (
            filteredSubmissions.map((s) => <SubmissionRow key={s.id} submission={s} />)
          )}
        </div>
      )}

      {/* ── Users tab ── */}
      {tab === "users" && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              {search ? `No users matching "${search}"` : "No users found."}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-raised">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-surface-raised/50">
                    <td className="px-5 py-3.5 font-medium text-white">{u.username}</td>
                    <td className="px-5 py-3.5 text-gray-400">{u.email}</td>
                    <td className="px-5 py-3.5">
                      {u.role === "admin" ? (
                        <span className="rounded-full border border-accent/20 bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent">
                          Admin
                        </span>
                      ) : (
                        <span className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-gray-400">
                          Tasker
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(u.created_at + "Z").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Marlin Test row ──────────────────────────────────────────────────────────

function MarlinRow({ test }: { test: MarlinTest }) {
  const answeredCount = Object.values(test.answers).filter((v) => v.trim().length > 0).length;
  const totalKeys = Object.keys(test.answers).length;

  return (
    <Link
      href={`/marlin-test/${test.id}`}
      className="group block rounded-xl border border-border bg-surface p-5 transition-all hover:border-accent/30 hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {test.username ?? `User #${test.user_id}`}
            </span>
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
              Completed
            </span>
            <span className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs text-gray-500">
              {answeredCount}/{totalKeys} answers
            </span>
            <span className="text-xs text-gray-600">
              {new Date(test.created_at + "Z").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Prompt preview */}
          <p className="text-sm leading-relaxed text-gray-400 group-hover:text-gray-300 line-clamp-2">
            {test.prompt_text}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-xs text-gray-500 font-mono">
            #{test.id}
          </span>
          <svg
            className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ─── Code Comparison submission row ──────────────────────────────────────────

function SubmissionRow({ submission: s }: { submission: Prompt }) {
  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0 space-y-2">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            {s.username ?? `User #${s.user_id}`}
          </span>
          {s.has_assessment ? (
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
              Completed
            </span>
          ) : (
            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
              Pending
            </span>
          )}
          <span className="text-xs text-gray-600">
            {new Date(s.created_at + "Z").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Prompt preview */}
        <p className="text-sm leading-relaxed text-gray-400 group-hover:text-gray-300 line-clamp-2">
          {s.prompt_text}
        </p>

        {/* Pending notice */}
        {!s.has_assessment && (
          <p className="text-xs text-yellow-500/70 italic">
            Assessment not yet submitted by tasker
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-xs text-gray-500 font-mono">
          #{s.id}
        </span>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-5 opacity-60 cursor-not-allowed select-none">
      {inner}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = "text-white" }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-12 text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
