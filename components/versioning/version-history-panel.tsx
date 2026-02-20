"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VersionBadge } from "./version-badge";
import { VersionCreateDialog } from "./version-create-dialog";
import { VersionDetailDialog } from "./version-detail-dialog";
import { VersionDiffViewer } from "./version-diff-viewer";
import type {
  ProtocolVersionRecord,
  ProtocolVersionCreateValues,
} from "@/lib/validators/protocol-version";
import {
  ChevronDown,
  ChevronRight,
  History,
  Plus,
  ArrowLeftRight,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";

interface VersionHistoryPanelProps {
  protocolId: string;
  onVersionCreated?: () => void;
}

/**
 * Collapsible panel showing version history for a protocol.
 * Includes "Save as Version" button, version list, compare, and sign actions.
 */
export function VersionHistoryPanel({
  protocolId,
  onVersionCreated,
}: VersionHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<ProtocolVersionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailVersion, setDetailVersion] =
    useState<ProtocolVersionRecord | null>(null);
  const [compareVersions, setCompareVersions] = useState<{
    a: string;
    b: string;
  } | null>(null);
  const [signingVersionId, setSigningVersionId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/protocols/${protocolId}/versions`);
      if (!res.ok) throw new Error("Failed to fetch versions");
      const json = await res.json();
      setVersions(json.data ?? []);
    } catch (err) {
      console.error("Error fetching versions:", err);
    } finally {
      setLoading(false);
    }
  }, [protocolId]);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, fetchVersions]);

  const handleCreateVersion = async (values: ProtocolVersionCreateValues) => {
    const res = await fetch(`/api/protocols/${protocolId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Failed to create version");
    }

    toast.success("Version saved successfully");
    await fetchVersions();
    onVersionCreated?.();
  };

  const handleSignVersion = async (versionId: string) => {
    const meaning = prompt(
      "Enter signature meaning (e.g., 'Approved for submission'):",
    );
    if (!meaning || meaning.length < 3) {
      toast.error("Signature meaning must be at least 3 characters");
      return;
    }

    setSigningVersionId(versionId);
    try {
      const res = await fetch(
        `/api/protocols/${protocolId}/versions/${versionId}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signature_meaning: meaning }),
        },
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to sign version");
      }

      toast.success("Version signed successfully");
      await fetchVersions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to sign version",
      );
    } finally {
      setSigningVersionId(null);
    }
  };

  const nextVersionNumber =
    versions.length > 0 ? versions[0].version_number + 1 : 1;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-0 h-auto"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <History className="h-4 w-4" />
                  <CardTitle className="text-base">
                    Version History
                    {versions.length > 0 && (
                      <span className="ml-2 text-muted-foreground font-normal">
                        ({versions.length} version
                        {versions.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </CardTitle>
                </Button>
              </CollapsibleTrigger>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-1 h-3 w-3" />
                Save as Version
              </Button>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {loading ? (
                <p className="text-sm text-muted-foreground">
                  Loading versions...
                </p>
              ) : versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No versions saved yet. Click &quot;Save as Version&quot; to
                  create the first snapshot.
                </p>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <VersionBadge
                            versionNumber={version.version_number}
                            isSigned={!!version.signed_by}
                            isCurrent={index === 0}
                          />
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(version.created_at),
                              "MMM d, yyyy HH:mm",
                            )}
                          </span>
                        </div>
                        {version.change_summary && (
                          <p className="text-sm text-muted-foreground truncate">
                            {version.change_summary}
                          </p>
                        )}
                        {version.signed_by && version.signature_meaning && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Signed: {version.signature_meaning}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailVersion(version)}
                          title="View details"
                        >
                          View
                        </Button>
                        {index < versions.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCompareVersions({
                                a: versions[index + 1].id,
                                b: version.id,
                              })
                            }
                            title="Compare with previous version"
                          >
                            <ArrowLeftRight className="h-3 w-3" />
                          </Button>
                        )}
                        {!version.signed_by && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSignVersion(version.id)}
                            disabled={signingVersionId === version.id}
                            title="Sign this version"
                          >
                            <PenTool className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <VersionCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateVersion}
        nextVersionNumber={nextVersionNumber}
      />

      {detailVersion && (
        <VersionDetailDialog
          version={detailVersion}
          protocolId={protocolId}
          open={!!detailVersion}
          onOpenChange={(open) => !open && setDetailVersion(null)}
        />
      )}

      {compareVersions && (
        <VersionDiffViewer
          protocolId={protocolId}
          versionAId={compareVersions.a}
          versionBId={compareVersions.b}
          open={!!compareVersions}
          onOpenChange={(open) => !open && setCompareVersions(null)}
        />
      )}
    </>
  );
}
