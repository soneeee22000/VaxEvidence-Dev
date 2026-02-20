"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImportDialog } from "@/components/evidence/import-dialog";
import { toast } from "sonner";
import type { EvidenceItem } from "@/lib/validators/evidence";

const DOI_REGEX = /^10\.\d{4,}\/\S+$/i;
const PMID_REGEX = /^\d{1,10}$/;

type PreviewType = "doi" | "pmid";

interface PreviewData {
  type: PreviewType;
  title: string;
  authors: string[];
  journal: string;
  date: string | null;
  doi?: string;
  sourceUrl?: string | null;
}

interface QuickImportProps {
  onImported?: (evidence: EvidenceItem) => void;
}

export function QuickImport({ onImported }: QuickImportProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const detectInput = (value: string) => {
    if (PMID_REGEX.test(value)) return { type: "pmid" as const, value };
    if (DOI_REGEX.test(value)) return { type: "doi" as const, value };
    return null;
  };

  const fetchMetadata = async () => {
    const trimmed = input.trim();
    const detected = detectInput(trimmed);
    if (!detected) {
      setErrorMessage("Enter a valid DOI or PMID.");
      return;
    }

    setErrorMessage(null);
    setIsFetching(true);
    try {
      const endpoint =
        detected.type === "doi"
          ? `/api/import/doi?doi=${encodeURIComponent(detected.value)}`
          : `/api/import/pmid?pmid=${encodeURIComponent(detected.value)}`;
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to fetch metadata");
      }

      if (detected.type === "doi") {
        const work = data?.work;
        setPreview({
          type: "doi",
          title: work?.title ?? "Untitled",
          authors: work?.authors ?? [],
          journal: work?.journal ?? "",
          date: work?.publishedDate ?? null,
          doi: work?.doi,
          sourceUrl: work?.url ?? null,
        });
      } else {
        const article = data?.article;
        setPreview({
          type: "pmid",
          title: article?.title ?? "Untitled",
          authors: article?.authors ?? [],
          journal: article?.journal ?? "",
          date: article?.pubDate ?? null,
          doi: article?.doi,
          sourceUrl: article?.sourceUrl ?? null,
        });
      }
    } catch (error) {
      console.error("Quick import preview failed:", error);
      setErrorMessage("Unable to fetch metadata.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    const detected = detectInput(input.trim());
    if (!detected) return;

    setIsImporting(true);
    try {
      const endpoint =
        detected.type === "doi" ? "/api/import/doi" : "/api/import/pmid";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [detected.type]: detected.value }),
      });
      const data = await response.json();

      if (!response.ok || !data?.evidence) {
        throw new Error(data?.error ?? "Import failed");
      }

      toast.success(data.existing ? "Already imported" : "Imported", {
        description: data.existing
          ? "This record is already in your library."
          : "Record imported successfully.",
      });

      onImported?.(data.evidence);
      router.push(`/app/evidence/${data.evidence.id}`);
      setOpen(false);
    } catch (error) {
      console.error("Quick import failed:", error);
      toast.error("Import failed", {
        description: "Unable to import this record.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const metadata = preview
    ? [
        { label: "Title", value: preview.title },
        { label: "Authors", value: preview.authors.join(", ") },
        { label: "Journal", value: preview.journal },
        { label: "Publication Date", value: preview.date ?? "—" },
        { label: "DOI", value: preview.doi ?? "—" },
        { label: "Source", value: preview.sourceUrl ?? "—" },
      ]
    : [];

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Quick Import (DOI/PMID)
      </Button>
      <ImportDialog
        open={open}
        onOpenChange={setOpen}
        title="Quick Import by DOI or PMID"
        description="Fetch metadata and import a record directly into your Evidence Library."
        metadata={metadata}
        confirmLabel="Import to Library"
        confirmDisabled={!preview || isFetching}
        isConfirming={isImporting}
        onConfirm={handleImport}
      >
        <div className="space-y-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter DOI or PMID..."
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchMetadata} disabled={isFetching}>
              {isFetching ? "Fetching..." : "Fetch Metadata"}
            </Button>
            {preview && (
              <Button
                variant="ghost"
                onClick={() => {
                  setPreview(null);
                  setErrorMessage(null);
                }}
              >
                Clear Preview
              </Button>
            )}
          </div>
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </div>
      </ImportDialog>
    </>
  );
}
