"use client"

import { useState, type MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { EvidenceItem } from "@/lib/validators/evidence"

interface PubMedArticle {
  pmid: string
  title: string
  authors: string[]
  journal: string
  pubDate: string
  doi?: string
  sourceUrl: string
}

interface PubMedSearchProps {
  onImported?: (evidence: EvidenceItem) => void
}

export function PubMedSearch({ onImported }: PubMedSearchProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PubMedArticle[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [abstracts, setAbstracts] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [importing, setImporting] = useState<Record<string, boolean>>({})

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/search/pubmed?q=${encodeURIComponent(query.trim())}`
      )
      const data = await response.json()
      setResults(Array.isArray(data.articles) ? data.articles : [])
    } catch (error) {
      console.error("PubMed search failed:", error)
      toast({
        title: "Search failed",
        description: "Unable to fetch PubMed results.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const toggleAbstract = async (pmid: string) => {
    const isOpen = !!expanded[pmid]
    setExpanded((prev) => ({ ...prev, [pmid]: !isOpen }))
    if (isOpen || abstracts[pmid]) return

    try {
      const response = await fetch(`/api/search/pubmed?pmid=${pmid}`)
      const data = await response.json()
      if (data?.article?.abstract) {
        setAbstracts((prev) => ({ ...prev, [pmid]: data.article.abstract }))
      }
    } catch (error) {
      console.error("Abstract fetch failed:", error)
    }
  }

  const handleImport = async (pmid: string, event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault()
    event?.stopPropagation()
    setImporting((prev) => ({ ...prev, [pmid]: true }))
    try {
      const response = await fetch("/api/import/pmid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pmid }),
      })
      const data = await response.json()

      if (!response.ok || !data?.evidence) {
        throw new Error(data?.error ?? "Import failed")
      }

      toast({
        title: data.existing ? "Already imported" : "Imported",
        description: data.existing
          ? "This PubMed article is already in your library."
          : "PubMed article imported successfully.",
      })

      onImported?.(data.evidence)
    } catch (error) {
      console.error("PubMed import failed:", error)
      toast({
        title: "Import failed",
        description: "Unable to import PubMed article.",
        variant: "destructive",
      })
    } finally {
      setImporting((prev) => ({ ...prev, [pmid]: false }))
    }
  }

  return (
    <>
      <Button variant="outline" type="button" onClick={() => setOpen(true)}>
        Search PubMed
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Search PubMed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="mRNA vaccine efficacy..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button type="button" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {results.length === 0 && !isSearching && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No results yet. Run a search to see PubMed articles.
                </div>
              )}

              {results.map((article) => (
                <div key={article.pmid} className="rounded-lg border p-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold">{article.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {article.authors.slice(0, 4).join(", ")}
                      {article.authors.length > 4 && ", et al."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {article.journal} • {article.pubDate}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => toggleAbstract(article.pmid)}
                    >
                      {expanded[article.pmid] ? "Hide Abstract" : "View Abstract"}
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      onClick={(event) => handleImport(article.pmid, event)}
                      disabled={importing[article.pmid]}
                    >
                      {importing[article.pmid] ? "Importing..." : "Import"}
                    </Button>
                  </div>
                  {expanded[article.pmid] && (
                    <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                      {abstracts[article.pmid] ||
                        "Abstract not available for this article."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
