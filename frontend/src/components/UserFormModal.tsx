"use client";

import { useEffect, useState } from "react";
import { adminCreateUser, adminUpdateUser } from "@/lib/api";
import type { User } from "@/types";

interface Props {
  mode: "create" | "edit";
  user?: User;
  onClose: () => void;
  onSaved: (u: User) => void;
}

const ROLES: User["role"][] = ["tasker", "reviewer", "admin"];

export default function UserFormModal({ mode, user, onClose, onSaved }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("tasker");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && user) {
      setUsername(user.username);
      setEmail(user.email);
      setRole(user.role);
      setPassword("");
    }
  }, [mode, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      let saved: User;
      if (mode === "create") {
        saved = await adminCreateUser({ username, email, password, role });
      } else if (user) {
        const payload: Parameters<typeof adminUpdateUser>[1] = {};
        if (username !== user.username) payload.username = username;
        if (email !== user.email) payload.email = email;
        if (role !== user.role) payload.role = role;
        if (password) payload.password = password;
        saved = Object.keys(payload).length > 0 ? await adminUpdateUser(user.id, payload) : user;
      } else {
        return;
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {mode === "create" ? "Create user" : `Edit ${user?.username}`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Username">
            <input
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
            />
          </Field>
          <Field label={mode === "create" ? "Password" : "New password (leave blank to keep current)"}>
            <input
              required={mode === "create"}
              minLength={mode === "create" ? 6 : 0}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as User["role"])}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-gray-100 capitalize outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          {error && (
            <div className="rounded-md border border-danger/30 bg-danger-subtle px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-gray-300 hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/25 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
