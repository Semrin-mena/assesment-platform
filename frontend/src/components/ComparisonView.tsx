"use client";

import ResponsePanel from "./ResponsePanel";
import type { LLMResponse } from "@/types";

interface ComparisonViewProps {
  responses: { A: LLMResponse; B: LLMResponse };
  selectedVariant: "A" | "B" | null;
  onSelect: (variant: "A" | "B") => void;
  readonly?: boolean;
}

export default function ComparisonView({
  responses,
  selectedVariant,
  onSelect,
  readonly = false,
}: ComparisonViewProps) {
  return (
    <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ResponsePanel
        variant="A"
        responseText={responses.A.response_text}
        isSelected={selectedVariant === "A"}
        onSelect={() => onSelect("A")}
        readonly={readonly}
      />

      {/* VS divider — visible on large screens */}
      <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-raised text-xs font-bold uppercase tracking-wider text-gray-400 shadow-lg">
          VS
        </div>
      </div>

      <ResponsePanel
        variant="B"
        responseText={responses.B.response_text}
        isSelected={selectedVariant === "B"}
        onSelect={() => onSelect("B")}
        readonly={readonly}
      />
    </div>
  );
}
