"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VersionBadge } from "./version-badge";
import {
  VERSIONABLE_FIELDS,
  FIELD_LABELS,
  type ProtocolVersionRecord,
} from "@/lib/validators/protocol-version";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";

interface VersionDetailDialogProps {
  version: ProtocolVersionRecord;
  protocolId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Read-only dialog showing a full version snapshot with hash verification.
 */
export function VersionDetailDialog({
  version,
  protocolId,
  open,
  onOpenChange,
}: VersionDetailDialogProps) {
  const [verifying, setVerifying] = useState(false);
  const [hashValid, setHashValid] = useState<boolean | null>(null);

  const handleVerifyHash = async () => {
    setVerifying(true);
    try {
      const res = await fetch(
        `/api/protocols/${protocolId}/versions/${version.id}?verify=true`,
      );
      if (!res.ok) throw new Error("Verification failed");
      const json = await res.json();
      setHashValid(json.hash_valid);
    } catch {
      setHashValid(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <VersionBadge
              versionNumber={version.version_number}
              isSigned={!!version.signed_by}
            />
            {version.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              {format(new Date(version.created_at), "MMM d, yyyy HH:mm")}
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              {version.status}
            </div>
          </div>

          {version.change_summary && (
            <div>
              <span className="text-sm font-medium">Change Summary</span>
              <p className="text-sm text-muted-foreground mt-1">
                {version.change_summary}
              </p>
            </div>
          )}

          {/* Digital Signature */}
          {version.signed_by && (
            <div className="p-3 rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                <Shield className="h-4 w-4" />
                Digitally Signed
              </div>
              <p className="text-sm mt-1">{version.signature_meaning}</p>
              {version.signed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Signed on{" "}
                  {format(new Date(version.signed_at), "MMM d, yyyy HH:mm")}
                </p>
              )}
            </div>
          )}

          {/* Hash Verification */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyHash}
              disabled={verifying}
            >
              {verifying ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Shield className="mr-2 h-3 w-3" />
              )}
              Verify Integrity
            </Button>
            {hashValid === true && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Hash verified — content is intact
              </span>
            )}
            {hashValid === false && (
              <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                Hash mismatch — content may have been tampered with
              </span>
            )}
          </div>
          <div className="text-xs font-mono text-muted-foreground break-all">
            SHA-256: {version.content_hash}
          </div>

          {/* Field Snapshot */}
          <div className="space-y-3 pt-2 border-t">
            <span className="text-sm font-medium">Protocol Snapshot</span>
            {VERSIONABLE_FIELDS.map((field) => (
              <div key={field}>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {FIELD_LABELS[field]}
                </span>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">
                  {(version[field] as string) || "(empty)"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
