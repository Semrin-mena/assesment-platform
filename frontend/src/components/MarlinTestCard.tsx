import Link from "next/link";
import type { MarlinTest } from "@/types";

interface MarlinTestCardProps {
  test: MarlinTest;
}

export default function MarlinTestCard({ test }: MarlinTestCardProps) {
  const truncated =
    test.prompt_text.length > 150
      ? test.prompt_text.slice(0, 150) + "..."
      : test.prompt_text;

  const date = new Date(test.created_at + "Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/marlin-test/${test.id}`}
      className="group block rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-accent/30 hover:bg-surface-raised hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-subtle">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-accent/20 bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent">
                Completed
              </span>
              <span className="text-xs text-gray-500">{date}</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-gray-300 group-hover:text-gray-200">
            {truncated}
          </p>
        </div>
        <svg
          className="mt-1 h-5 w-5 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
