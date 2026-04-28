"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { login as apiLogin } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      setInfo("Your session expired. Please sign in again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiLogin(username, password);
      login(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="relative -mx-6 -my-10 flex min-h-[calc(100vh-82px)] items-center justify-center overflow-hidden bg-background">

      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,229,16,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Radial vignette — fades grid at edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 30%, #000000 100%)",
        }}
      />

      {/* Ambient green glow behind the card */}
      <div
        className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "rgba(0,180,12,0.06)" }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-5">
          <div className="relative">
            {/* Glow blob behind logo */}
            <div
              className="absolute -inset-10 rounded-3xl blur-3xl"
              style={{
                background: "rgba(0,229,16,0.12)",
                animation: "logo-glow 3s ease-in-out infinite",
              }}
            />
            <Image
              src="/menadevs-logo.png"
              alt="MenaDevs"
              width={380}
              height={114}
              className="relative h-24 w-auto object-contain drop-shadow-2xl"
              priority
            />
          </div>

          {/* Divider with label */}
          <div className="flex items-center gap-3">
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-600">
              Assessment Platform
            </span>
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>

        {/* Card */}
        <div
          className="relative overflow-hidden rounded-2xl backdrop-blur-xl"
          style={{
            background: "rgba(10,10,10,0.85)",
            border: "1px solid rgba(0,229,16,0.12)",
            boxShadow:
              "0 0 0 1px rgba(0,0,0,0.5), 0 32px 64px rgba(0,0,0,0.6), 0 0 40px rgba(0,180,12,0.05)",
          }}
        >
          {/* Scan line */}
          <div
            className="pointer-events-none absolute inset-x-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,229,16,0.6) 50%, transparent 100%)",
              animation: "scan 4s ease-in-out infinite",
            }}
          />

          {/* Top accent line */}
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,229,16,0.4) 50%, transparent 100%)",
            }}
          />

          <div className="p-6">
            <div className="mb-5">
              <h1 className="text-base font-semibold text-white">Sign in</h1>
              <p className="mt-0.5 text-xs text-gray-500">
                Access your evaluation dashboard
              </p>
            </div>

            {info && !error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2.5 text-xs text-yellow-300">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {info}
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-gray-500">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                  className="w-full rounded-lg border border-border bg-black/60 px-4 py-2.5 font-mono text-sm text-gray-100 placeholder-gray-700 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-40"
                  placeholder="your_username"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-gray-500">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full rounded-lg border border-border bg-black/60 px-4 py-2.5 font-mono text-sm text-gray-100 placeholder-gray-700 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-40"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                style={{ boxShadow: "0 4px 24px rgba(0,138,9,0.3)" }}
              >
                {/* Shimmer sweep on hover */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card footer */}
          <div
            className="flex items-center justify-between border-t px-6 py-3.5"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <p className="text-xs text-gray-600">
              No account?{" "}
              <Link
                href="/register"
                className="font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Register
              </Link>
            </p>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              secure
            </div>
          </div>
        </div>

        <p className="mt-5 text-center font-mono text-[10px] text-gray-700">
          © {new Date().getFullYear()} MenaDevs · All rights reserved
        </p>
      </div>
    </div>
  );
}
