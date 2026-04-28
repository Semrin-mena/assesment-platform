"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  // If set, only users with one of these roles can render the children.
  // Other roles get redirected to their own home page.
  allow?: Array<User["role"]>;
}

function homePathFor(role: User["role"]): string {
  if (role === "admin") return "/admin";
  if (role === "reviewer") return "/reviewer";
  return "/";
}

export default function AuthGuard({ children, allow }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const blocked = !!(user && allow && !allow.includes(user.role));

  useEffect(() => {
    if (blocked && user) {
      router.replace(homePathFor(user.role));
    }
  }, [blocked, user, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    // AuthContext handles redirect to /login.
    return null;
  }

  if (blocked) {
    // Redirect kicks in via the effect above; render nothing in the meantime
    // to avoid flashing unauthorized content.
    return null;
  }

  return <>{children}</>;
}
