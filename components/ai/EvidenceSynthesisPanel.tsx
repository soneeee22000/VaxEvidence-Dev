"use client";

import { useCompletion } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { StreamingMarkdown } from "./StreamingMarkdown";

/**
 * AI-powered evidence synthesis panel.
 * Generates a streaming literature review based on protocol + linked evidence.
 */
interface EvidenceSynthesisPanelProps {
  protocolId: string;
  linkedEvidenceCount: number;
}

export function EvidenceSynthesisPanel({
  protocolId,
  linkedEvidenceCount,
}: EvidenceSynthesisPanelProps) {
  const { complete, completion, isLoading, error } = useCompletion({
    api: "/api/ai/synthesis",
    streamProtocol: "text",
  });

  const handleGenerate = () => {
    complete("", {
      body: { protocol_id: protocolId },
    });
  };

  const handleCopy = async () => {
    if (!completion) return;
    try {
      await navigator.clipboard.writeText(completion);
      toast.success("Literature review copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (linkedEvidenceCount === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Link at least one evidence item to generate a literature review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button onClick={handleGenerate} disabled={isLoading} size="sm">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : completion ? (
            <RefreshCw className="mr-2 h-4 w-4" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading
            ? "Generating..."
            : completion
              ? "Regenerate"
              : "Generate Literature Review"}
        </Button>

        {completion && !isLoading && (
          <Button onClick={handleCopy} variant="outline" size="sm">
            <Copy className="mr-2 h-3 w-3" />
            Copy
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Synthesizes {linkedEvidenceCount} linked evidence item
        {linkedEvidenceCount !== 1 ? "s" : ""} into a structured literature
        review.
      </p>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Failed to generate synthesis. Please try again.
        </p>
      )}

      {(completion || isLoading) && (
        <StreamingMarkdown content={completion} isStreaming={isLoading} />
      )}
    </div>
  );
}
