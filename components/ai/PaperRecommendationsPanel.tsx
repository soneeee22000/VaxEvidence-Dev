"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ExternalLink, Import, Check } from "lucide-react";
import { toast } from "sonner";
import type { PubMedArticle } from "@/lib/api/pubmed";

/**
 * AI-powered paper recommendations panel.
 * Generates optimized PubMed queries, fetches papers, and ranks by PICO relevance.
 */
interface PaperRecommendationsPanelProps {
  protocolId: string;
  /** PMIDs of already-linked evidence to exclude from recommendations. */
  linkedPmids: string[];
  /** Callback after a paper is imported. */
  onImported?: () => void;
}

interface RankedPaper {
  pmid: string;
  relevance_score: number;
  relevance_rationale: string;
  pico_alignment: {
    population: boolean;
    intervention: boolean;
    comparator: boolean;
    outcomes: boolean;
  };
}

interface RecommendationResult {
  search_queries: string[];
  ranked_papers: RankedPaper[];
  articles: PubMedArticle[];
}

export function PaperRecommendationsPanel({
  protocolId,
  linkedPmids,
  onImported,
}: PaperRecommendationsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [importingPmids, setImportingPmids] = useState<Set<string>>(new Set());
  const [importedPmids, setImportedPmids] = useState<Set<string>>(new Set());

  const handleRecommend = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol_id: protocolId,
          exclude_pmids: linkedPmids,
        }),
      });

      if (!response.ok) {
        throw new Error("Recommendation generation failed");
      }

      const { data } = await response.json();
      setResult(data);
      toast.success(
        `Found ${data.ranked_papers.length} recommended paper${data.ranked_papers.length !== 1 ? "s" : ""}`,
      );
    } catch (err) {
      console.error("Recommendations error:", err);
      toast.error("Failed to generate recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (pmid: string) => {
    setImportingPmids((prev) => new Set([...prev, pmid]));

    try {
      const response = await fetch("/api/import/pmid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pmid }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Import failed");
      }

      setImportedPmids((prev) => new Set([...prev, pmid]));
      toast.success("Paper imported to evidence library");
      onImported?.();
    } catch (err) {
      console.error("Import error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to import paper",
      );
    } finally {
      setImportingPmids((prev) => {
        const next = new Set(prev);
        next.delete(pmid);
        return next;
      });
    }
  };

  const getArticleByPmid = (pmid: string): PubMedArticle | undefined =>
    result?.articles.find((a) => a.pmid === pmid);

  return (
    <div className="space-y-4">
      <Button onClick={handleRecommend} disabled={isLoading} size="sm">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Finding papers..." : "Find Related Papers"}
      </Button>

      <p className="text-xs text-muted-foreground">
        AI generates optimized PubMed search queries from your protocol PICO and
        ranks results by relevance.
      </p>

      {result && (
        <div className="space-y-4">
          {/* Search Queries Used */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Search queries used:
            </p>
            <div className="flex flex-wrap gap-1">
              {result.search_queries.map((q, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {q.length > 60 ? q.slice(0, 60) + "..." : q}
                </Badge>
              ))}
            </div>
          </div>

          {/* Ranked Papers */}
          {result.ranked_papers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No new papers found. Try refining your protocol PICO fields.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {result.ranked_papers.map((paper) => {
                const article = getArticleByPmid(paper.pmid);
                const isImporting = importingPmids.has(paper.pmid);
                const isImported = importedPmids.has(paper.pmid);

                return (
                  <div
                    key={paper.pmid}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {article?.title ?? `PMID: ${paper.pmid}`}
                        </p>
                        {article && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {article.authors.slice(0, 3).join(", ")}
                            {article.authors.length > 3 ? " et al." : ""} —{" "}
                            {article.journal} ({article.pubDate})
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          paper.relevance_score >= 70
                            ? "default"
                            : paper.relevance_score >= 40
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs flex-shrink-0"
                      >
                        {paper.relevance_score}%
                      </Badge>
                    </div>

                    {/* PICO Alignment */}
                    <div className="flex gap-1">
                      {(
                        [
                          "population",
                          "intervention",
                          "comparator",
                          "outcomes",
                        ] as const
                      ).map((field) => (
                        <Badge
                          key={field}
                          variant={
                            paper.pico_alignment[field] ? "default" : "outline"
                          }
                          className="text-xs"
                        >
                          {field[0].toUpperCase()}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {paper.relevance_rationale}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImport(paper.pmid)}
                        disabled={isImporting || isImported}
                      >
                        {isImported ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Imported
                          </>
                        ) : isImporting ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Import className="mr-1 h-3 w-3" />
                            Import
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          PubMed
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
