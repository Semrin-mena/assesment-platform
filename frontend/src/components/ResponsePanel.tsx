"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ResponsePanelProps {
  variant: "A" | "B";
  responseText: string;
  isSelected: boolean;
  onSelect?: () => void;
  readonly?: boolean;
}

const variantStyles = {
  A: {
    gradient: "from-green-500 to-green-700",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
    selectedBorder: "border-green-500 ring-2 ring-green-500/20",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    label: "Precise",
  },
  B: {
    gradient: "from-green-600 to-black",
    badge: "bg-green-600/10 text-green-300 border-green-600/20",
    selectedBorder: "border-green-600 ring-2 ring-green-600/20",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    label: "Creative",
  },
};

export default function ResponsePanel({
  variant,
  responseText,
  isSelected,
  onSelect,
  readonly = false,
}: ResponsePanelProps) {
  const style = variantStyles[variant];

  const borderClass = isSelected
    ? style.selectedBorder
    : "border-border hover:border-border-hover";
  const cursorClass = !readonly && onSelect ? "cursor-pointer" : "";

  return (
    <div
      onClick={!readonly ? onSelect : undefined}
      className={`animate-fade-in-scale rounded-xl border ${borderClass} ${cursorClass} bg-surface transition-all duration-200 overflow-hidden`}
    >
      {/* Header with gradient bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${style.gradient}`} />
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.badge}`}>
            {style.icon}
            {style.label}
          </span>
          <h3 className="text-sm font-semibold text-gray-200">
            Response {variant}
          </h3>
        </div>
        {isSelected && (
          <span className="flex items-center gap-1.5 rounded-full bg-success-subtle border border-success/20 px-3 py-1 text-xs font-semibold text-success">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Selected
          </span>
        )}
        {!readonly && !isSelected && (
          <span className="text-xs text-gray-500">Click to select</span>
        )}
      </div>

      {/* Content — rendered as Markdown */}
      <div className="max-h-[500px] overflow-y-auto px-5 py-4 prose prose-invert prose-sm max-w-none
        prose-headings:text-gray-200 prose-p:text-gray-300 prose-p:leading-relaxed
        prose-strong:text-gray-200 prose-a:text-accent prose-li:text-gray-300
        prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
        prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent">
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeStr = String(children).replace(/\n$/, "");

              // Inline code
              if (!match) {
                return (
                  <code className="rounded bg-gray-700/60 px-1.5 py-0.5 text-xs text-gray-200" {...props}>
                    {children}
                  </code>
                );
              }

              // Fenced code block
              return (
                <div className="relative -mx-5">
                  <div className="absolute top-2 right-3 z-10 rounded bg-gray-700/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    {match[1]}
                  </div>
                  <SyntaxHighlighter
                    language={match[1]}
                    style={oneDark}
                    customStyle={{
                      borderRadius: 0,
                      fontSize: "0.8125rem",
                      margin: 0,
                      padding: "1.25rem",
                      background: "rgba(0,0,0,0.25)",
                      lineHeight: "1.6",
                    }}
                    showLineNumbers
                    lineNumberStyle={{
                      minWidth: "2.5em",
                      paddingRight: "1em",
                      color: "#4b5563",
                      fontSize: "0.75rem",
                    }}
                  >
                    {codeStr}
                  </SyntaxHighlighter>
                </div>
              );
            },
          }}
        >
          {responseText}
        </ReactMarkdown>
      </div>
    </div>
  );
}

