"use client";

import { useAuth } from "@/lib/auth-context";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    // AuthContext will handle redirect to /login
    return null;
  }

  return <>{children}</>;
}
