"use client";

import { cn } from "@/lib/utils";

/**
 * Renders streaming text with an animated cursor.
 * Used by EvidenceSynthesisPanel for displaying AI-generated literature reviews.
 */
interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function StreamingMarkdown({
  content,
  isStreaming,
  className,
}: StreamingMarkdownProps) {
  if (!content) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap font-sans",
        className,
      )}
    >
      {content}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
      )}
    </div>
  );
}
