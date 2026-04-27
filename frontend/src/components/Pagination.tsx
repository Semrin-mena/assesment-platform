"use client";

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
}

export default function Pagination({ total, limit, offset, onChange }: PaginationProps) {
  if (total <= limit) return null;

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);

  const goPrev = () => onChange(Math.max(0, offset - limit));
  const goNext = () => onChange(Math.min((totalPages - 1) * limit, offset + limit));

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm">
      <p className="text-gray-500">
        Showing <span className="font-medium text-gray-300">{start}</span>–
        <span className="font-medium text-gray-300">{end}</span> of{" "}
        <span className="font-medium text-gray-300">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={offset === 0}
          className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs text-gray-500">
          Page <span className="font-medium text-gray-300">{page}</span> of{" "}
          <span className="font-medium text-gray-300">{totalPages}</span>
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={page >= totalPages}
          className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
