"use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
import Link from "next/link";
// import { getAssessment, adminGetSubmission } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/AuthGuard";
// import ComparisonView from "@/components/ComparisonView";
// import type { FullAssessment } from "@/types";

export default function AssessmentDetailPage() {
  return (
    <AuthGuard>
      <AssessmentUnavailable />
    </AuthGuard>
  );
}

// ── Currently disabled ────────────────────────────────────────────────────────
// function AssessmentDetailContent() {
//   const params = useParams();
//   const { user } = useAuth();
//   const [assessment, setAssessment] = useState<FullAssessment | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//
//   const isAdmin = user?.role === "admin";
//   const backHref = isAdmin ? "/admin" : "/";
//   const backLabel = isAdmin ? "Admin Panel" : "Dashboard";
//
//   useEffect(() => {
//     const id = Number(params.id);
//     if (!id) {
//       setError("Invalid assessment ID");
//       setLoading(false);
//       return;
//     }
//
//     const fetch = isAdmin
//       ? adminGetSubmission(id).then((data) => {
//           if (!data.assessment) throw new Error("This submission has no assessment yet.");
//           return {
//             ...data.assessment,
//             prompt_text: data.prompt_text,
//             username: data.username,
//             user_id: data.user_id,
//             responses: data.responses,
//           } as FullAssessment;
//         })
//       : getAssessment(id);
//
//     fetch
//       .then(setAssessment)
//       .catch((err) => setError(err.message))
//       .finally(() => setLoading(false));
//   }, [params.id, isAdmin]);
//
//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-32">
//         <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
//         <p className="mt-4 text-sm text-gray-400">Loading assessment...</p>
//       </div>
//     );
//   }
//
//   if (error || !assessment) {
//     return (
//       <div className="animate-fade-in flex flex-col items-center py-20">
//         <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-subtle">
//           <svg className="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
//           </svg>
//         </div>
//         <p className="mt-4 text-sm text-red-300">{error || "Assessment not found"}</p>
//         <Link href={backHref} className="mt-4 text-sm font-medium text-accent hover:text-accent-hover">
//           Back to {backLabel}
//         </Link>
//       </div>
//     );
//   }
//
//   const variantColor = assessment.chosen_variant === "A" ? "text-blue-400" : "text-orange-400";
//   const date = new Date(assessment.created_at + "Z").toLocaleDateString("en-US", {
//     month: "long",
//     day: "numeric",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
//
//   return (
//     <div className="animate-fade-in space-y-8">
//       {/* Page header */}
//       <div className="flex items-start justify-between">
//         <div>
//           <Link
//             href={backHref}
//             className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white"
//           >
//             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
//             </svg>
//             Back to {backLabel}
//           </Link>
//           <h1 className="text-3xl font-bold tracking-tight text-white">Assessment Details</h1>
//           <div className="mt-2 flex flex-wrap items-center gap-2">
//             {assessment.username && (
//               <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent">
//                 <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
//                 </svg>
//                 {assessment.username}
//               </span>
//             )}
//             <span className="text-sm text-gray-400">{date}</span>
//           </div>
//         </div>
//         <span className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400">
//           <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//           </svg>
//           Completed
//         </span>
//       </div>
//
//       {/* Original prompt */}
//       <div className="rounded-xl border border-border bg-surface overflow-hidden">
//         <div className="flex items-center gap-3 border-b border-border px-6 py-4">
//           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle">
//             <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
//             </svg>
//           </div>
//           <h2 className="text-lg font-semibold text-white">Original Prompt</h2>
//         </div>
//         <div className="px-6 py-5">
//           <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{assessment.prompt_text}</p>
//         </div>
//       </div>
//
//       {/* Side-by-side responses (read-only) */}
//       <div className="space-y-4">
//         <div className="flex items-center gap-3">
//           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle">
//             <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
//             </svg>
//           </div>
//           <h2 className="text-lg font-semibold text-white">Responses</h2>
//         </div>
//         <ComparisonView
//           responses={assessment.responses}
//           selectedVariant={assessment.chosen_variant}
//           onSelect={() => {}}
//           readonly
//         />
//       </div>
//
//       {/* Verdict */}
//       <div className="rounded-xl border border-border bg-surface overflow-hidden">
//         <div className="flex items-center gap-3 border-b border-border px-6 py-4">
//           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
//             <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
//             </svg>
//           </div>
//           <div>
//             <h2 className="text-lg font-semibold text-white">Verdict</h2>
//             <p className="text-sm text-gray-400">
//               Chosen:{" "}
//               <span className={`font-semibold ${variantColor}`}>
//                 Response {assessment.chosen_variant}
//               </span>
//             </p>
//           </div>
//         </div>
//         <div className="px-6 py-5">
//           <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
//             {assessment.justification}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

function AssessmentUnavailable() {
  const { user } = useAuth();
  const backHref = user?.role === "admin" ? "/admin" : "/";
  const backLabel = user?.role === "admin" ? "Admin Panel" : "Dashboard";

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-raised">
        <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <h1 className="mt-5 text-xl font-semibold text-white">Currently Unavailable</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-400">
        Code Comparison task review is not available at this time.
      </p>
      <Link
        href={backHref}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-gray-400 transition-all hover:border-border-hover hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to {backLabel}
      </Link>
    </div>
  );
}
