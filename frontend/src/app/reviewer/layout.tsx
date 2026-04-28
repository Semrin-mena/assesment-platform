import AuthGuard from "@/components/AuthGuard";

// Admins can view reviews read-only, so they're allowed alongside reviewers.
// The review page itself gates editing to the original reviewer.
export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allow={["reviewer", "admin"]}>{children}</AuthGuard>;
}
