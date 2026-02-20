"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import type { PicoOutput } from "@/lib/ai/ai-validators";

/**
 * AI-powered PICO generator panel.
 * Takes a research question and generates structured PICO fields.
 */
interface PicoGeneratorPanelProps {
  /** Callback when PICO is generated — parent calls form.setValue() for each field. */
  onGenerated: (pico: PicoOutput) => void;
  /** Pre-fill with existing study question if available. */
  initialQuestion?: string;
}

export function PicoGeneratorPanel({
  onGenerated,
  initialQuestion = "",
}: PicoGeneratorPanelProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PicoOutput | null>(null);
  const [applied, setApplied] = useState(false);

  const handleGenerate = async () => {
    if (question.length < 10) {
      toast.error("Research question must be at least 10 characters");
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setApplied(false);

    try {
      const response = await fetch("/api/ai/pico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ research_question: question }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "PICO generation failed");
      }

      const { data } = await response.json();
      setResult(data);
      toast.success("PICO framework generated");
    } catch (err) {
      console.error("PICO generation error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate PICO",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onGenerated(result);
    setApplied(true);
    toast.success("PICO fields applied to protocol form");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="research-question">Research Question</Label>
        <Textarea
          id="research-question"
          placeholder="E.g., What is the effectiveness of mRNA COVID-19 booster vaccines in preventing hospitalization among adults aged 65 and older?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          disabled={isGenerating}
        />
        <p className="text-xs text-muted-foreground">
          Describe your vaccine research question. The AI will generate
          structured PICO fields.
        </p>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || question.length < 10}
        size="sm"
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? "Generating..." : "Generate PICO"}
      </Button>

      {result && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Generated PICO Framework</h4>
            <Button
              onClick={handleApply}
              size="sm"
              variant={applied ? "secondary" : "default"}
              disabled={applied}
            >
              {applied ? (
                <>
                  <Check className="mr-2 h-3 w-3" />
                  Applied
                </>
              ) : (
                "Apply to Protocol"
              )}
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <Badge variant="outline" className="mb-1">
                Population
              </Badge>
              <p className="text-muted-foreground">{result.population}</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">
                Intervention
              </Badge>
              <p className="text-muted-foreground">{result.intervention}</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">
                Comparator
              </Badge>
              <p className="text-muted-foreground">{result.comparator}</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">
                Outcomes
              </Badge>
              <p className="text-muted-foreground">{result.outcomes}</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">
                Study Design
              </Badge>
              <p className="text-muted-foreground">{result.design}</p>
            </div>
            {result.rationale && (
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">
                  <strong>Rationale:</strong> {result.rationale}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
