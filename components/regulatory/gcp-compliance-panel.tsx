"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Save,
  Shield,
  FileCheck,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { GCP_PRINCIPLES } from "@/lib/regulatory/gcp-principles";
import { GCP_PROTOCOL_SECTIONS } from "@/lib/regulatory/gcp-protocol-sections";
import {
  GCP_ESSENTIAL_DOCUMENTS,
  getDocumentsByPhase,
} from "@/lib/regulatory/gcp-essential-documents";
import type {
  GCPComplianceStatus,
  GCPPrincipleEntry,
  GCPProtocolSectionEntry,
  GCPDocumentEntry,
} from "@/lib/validators/gcp-compliance";
import {
  complianceStatusLabels,
  complianceStatusColors,
} from "@/lib/validators/gcp-compliance";

interface GCPCompliancePanelProps {
  protocolId: string;
}

/**
 * ICH E6(R2) GCP Compliance Tracker panel.
 */
export function GCPCompliancePanel({ protocolId }: GCPCompliancePanelProps) {
  const [principles, setPrinciples] = useState<Map<number, GCPPrincipleEntry>>(
    new Map(),
  );
  const [protocolSections, setProtocolSections] = useState<
    Map<string, GCPProtocolSectionEntry>
  >(new Map());
  const [documents, setDocuments] = useState<Map<string, GCPDocumentEntry>>(
    new Map(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["principles"]),
  );

  /** Load saved GCP compliance from API. */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/gcp-compliance?protocol_id=${protocolId}`,
        );
        const json = await res.json();
        if (json.data) {
          const pMap = new Map<number, GCPPrincipleEntry>();
          for (const p of json.data.principles || []) {
            pMap.set(p.principle_number, p);
          }
          setPrinciples(pMap);

          const sMap = new Map<string, GCPProtocolSectionEntry>();
          for (const s of json.data.protocol_sections || []) {
            sMap.set(s.section_number, s);
          }
          setProtocolSections(sMap);

          const dMap = new Map<string, GCPDocumentEntry>();
          for (const d of json.data.essential_documents || []) {
            dMap.set(d.document_id, d);
          }
          setDocuments(dMap);
        }
      } catch {
        // No saved data
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [protocolId]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  /** Get principle entry. */
  const getPrinciple = (num: number): GCPPrincipleEntry => {
    return (
      principles.get(num) ?? {
        principle_number: num,
        status: "not_assessed",
        notes: "",
      }
    );
  };

  /** Get protocol section entry. */
  const getProtocolSection = (
    sectionNumber: string,
  ): GCPProtocolSectionEntry => {
    return (
      protocolSections.get(sectionNumber) ?? {
        section_number: sectionNumber,
        status: "not_assessed",
        notes: "",
      }
    );
  };

  /** Get document entry. */
  const getDocument = (docId: string): GCPDocumentEntry => {
    return (
      documents.get(docId) ?? {
        document_id: docId,
        status: "not_assessed",
        notes: "",
      }
    );
  };

  /** Update principle. */
  const updatePrinciple = (
    num: number,
    field: "status" | "notes",
    value: string,
  ) => {
    setPrinciples((prev) => {
      const next = new Map(prev);
      next.set(num, { ...getPrinciple(num), [field]: value });
      return next;
    });
    setIsDirty(true);
  };

  /** Update protocol section. */
  const updateProtocolSection = (
    sectionNumber: string,
    field: "status" | "notes",
    value: string,
  ) => {
    setProtocolSections((prev) => {
      const next = new Map(prev);
      next.set(sectionNumber, {
        ...getProtocolSection(sectionNumber),
        [field]: value,
      });
      return next;
    });
    setIsDirty(true);
  };

  /** Update document. */
  const updateDocument = (
    docId: string,
    field: "status" | "notes",
    value: string,
  ) => {
    setDocuments((prev) => {
      const next = new Map(prev);
      next.set(docId, { ...getDocument(docId), [field]: value });
      return next;
    });
    setIsDirty(true);
  };

  /** Calculate compliance score. */
  const calculateScore = (): number => {
    const allItems = [
      ...GCP_PRINCIPLES.map((p) => getPrinciple(p.number).status),
      ...GCP_PROTOCOL_SECTIONS.map(
        (s) => getProtocolSection(s.sectionNumber).status,
      ),
      ...GCP_ESSENTIAL_DOCUMENTS.map((d) => getDocument(d.id).status),
    ];
    const total = allItems.length;
    if (total === 0) return 0;
    const compliant = allItems.filter(
      (s) => s === "compliant" || s === "not_applicable",
    ).length;
    return Math.round((compliant / total) * 100);
  };

  /** Save to API. */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const principlesArray = GCP_PRINCIPLES.map((p) => getPrinciple(p.number));
      const sectionsArray = GCP_PROTOCOL_SECTIONS.map((s) =>
        getProtocolSection(s.sectionNumber),
      );
      const documentsArray = GCP_ESSENTIAL_DOCUMENTS.map((d) =>
        getDocument(d.id),
      );

      const res = await fetch("/api/gcp-compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol_id: protocolId,
          principles: principlesArray,
          protocol_sections: sectionsArray,
          essential_documents: documentsArray,
          compliance_score: calculateScore(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }

      toast.success("GCP compliance saved");
      setIsDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  /** Status badge. */
  const statusBadge = (status: GCPComplianceStatus) => (
    <Badge
      variant="outline"
      className={`text-xs ${complianceStatusColors[status]} bg-opacity-10 text-white`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${complianceStatusColors[status]}`}
      />
      {complianceStatusLabels[status]}
    </Badge>
  );

  /** Compliance score display. */
  const score = calculateScore();
  const scoreColor =
    score >= 80
      ? "text-green-400"
      : score >= 50
        ? "text-yellow-400"
        : "text-red-400";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </CardContent>
      </Card>
    );
  }

  const beforeDocs = getDocumentsByPhase("before");
  const duringDocs = getDocumentsByPhase("during");
  const afterDocs = getDocumentsByPhase("after");

  return (
    <div className="space-y-4">
      {/* Score Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                ICH E6(R2) GCP Compliance
              </CardTitle>
              <CardDescription>
                13 principles, {GCP_PROTOCOL_SECTIONS.length} protocol sections,{" "}
                {GCP_ESSENTIAL_DOCUMENTS.length} essential documents
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-zinc-500">Compliance Score</p>
                <p className={`text-2xl font-bold ${scoreColor}`}>{score}%</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 13 Principles */}
      <Collapsible
        open={openSections.has("principles")}
        onOpenChange={() => toggleSection("principles")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-blue-400" />
                  13 GCP Principles (Section 2)
                </CardTitle>
                {openSections.has("principles") ? (
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              {GCP_PRINCIPLES.map((p) => {
                const entry = getPrinciple(p.number);
                return (
                  <div
                    key={p.number}
                    className="rounded-lg border border-zinc-800 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono text-zinc-500 mr-2">
                          {p.number}.
                        </span>
                        <span className="text-sm font-medium text-zinc-200">
                          {p.title}
                        </span>
                        <p className="text-xs text-zinc-500 mt-1">
                          {p.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={entry.status}
                        onValueChange={(v) =>
                          updatePrinciple(p.number, "status", v)
                        }
                      >
                        <SelectTrigger className="h-7 w-[170px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_assessed">
                            Not Assessed
                          </SelectItem>
                          <SelectItem value="compliant">Compliant</SelectItem>
                          <SelectItem value="partially_compliant">
                            Partially Compliant
                          </SelectItem>
                          <SelectItem value="non_compliant">
                            Non-Compliant
                          </SelectItem>
                          <SelectItem value="not_applicable">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Evidence or notes..."
                        value={entry.notes ?? ""}
                        onChange={(e) =>
                          updatePrinciple(p.number, "notes", e.target.value)
                        }
                        className="h-7 text-xs flex-1 min-w-[120px]"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Protocol Sections */}
      <Collapsible
        open={openSections.has("protocol")}
        onOpenChange={() => toggleSection("protocol")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCheck className="h-4 w-4 text-green-400" />
                  Protocol Sections (6.1–6.16)
                </CardTitle>
                {openSections.has("protocol") ? (
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              {GCP_PROTOCOL_SECTIONS.map((s) => {
                const entry = getProtocolSection(s.sectionNumber);
                return (
                  <div
                    key={s.sectionNumber}
                    className="rounded-lg border border-zinc-800 p-3 space-y-2"
                  >
                    <div>
                      <span className="text-xs font-mono text-zinc-500 mr-2">
                        {s.sectionNumber}
                      </span>
                      <span className="text-sm font-medium text-zinc-200">
                        {s.title}
                      </span>
                      {s.picoMapping.length > 0 && (
                        <span className="ml-2 text-xs text-blue-400/70">
                          (auto: {s.picoMapping.join(", ")})
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={entry.status}
                        onValueChange={(v) =>
                          updateProtocolSection(s.sectionNumber, "status", v)
                        }
                      >
                        <SelectTrigger className="h-7 w-[170px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_assessed">
                            Not Assessed
                          </SelectItem>
                          <SelectItem value="compliant">Compliant</SelectItem>
                          <SelectItem value="partially_compliant">
                            Partially Compliant
                          </SelectItem>
                          <SelectItem value="non_compliant">
                            Non-Compliant
                          </SelectItem>
                          <SelectItem value="not_applicable">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Notes..."
                        value={entry.notes ?? ""}
                        onChange={(e) =>
                          updateProtocolSection(
                            s.sectionNumber,
                            "notes",
                            e.target.value,
                          )
                        }
                        className="h-7 text-xs flex-1 min-w-[120px]"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Essential Documents */}
      <Collapsible
        open={openSections.has("documents")}
        onOpenChange={() => toggleSection("documents")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-4 w-4 text-yellow-400" />
                  Essential Documents (Section 8)
                </CardTitle>
                {openSections.has("documents") ? (
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* Before */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-3">
                  Before Clinical Phase ({beforeDocs.length} documents)
                </h4>
                <div className="space-y-2">
                  {beforeDocs.map((doc) => {
                    const entry = getDocument(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className="rounded-lg border border-zinc-800 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-mono text-zinc-500 mr-2">
                              {doc.id}
                            </span>
                            <span className="text-sm text-zinc-200">
                              {doc.title}
                            </span>
                            {doc.trackedByVaxEvidence && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs border-blue-500/30 text-blue-400"
                              >
                                Tracked
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={entry.status}
                            onValueChange={(v) =>
                              updateDocument(doc.id, "status", v)
                            }
                          >
                            <SelectTrigger className="h-7 w-[170px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_assessed">
                                Not Assessed
                              </SelectItem>
                              <SelectItem value="compliant">
                                Available
                              </SelectItem>
                              <SelectItem value="partially_compliant">
                                In Progress
                              </SelectItem>
                              <SelectItem value="non_compliant">
                                Missing
                              </SelectItem>
                              <SelectItem value="not_applicable">
                                N/A
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Notes or file reference..."
                            value={entry.notes ?? ""}
                            onChange={(e) =>
                              updateDocument(doc.id, "notes", e.target.value)
                            }
                            className="h-7 text-xs flex-1 min-w-[120px]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* During */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-3">
                  During Clinical Conduct ({duringDocs.length} documents)
                </h4>
                <div className="space-y-2">
                  {duringDocs.map((doc) => {
                    const entry = getDocument(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className="rounded-lg border border-zinc-800 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-mono text-zinc-500 mr-2">
                              {doc.id}
                            </span>
                            <span className="text-sm text-zinc-200">
                              {doc.title}
                            </span>
                            {doc.trackedByVaxEvidence && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs border-blue-500/30 text-blue-400"
                              >
                                Tracked
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={entry.status}
                            onValueChange={(v) =>
                              updateDocument(doc.id, "status", v)
                            }
                          >
                            <SelectTrigger className="h-7 w-[170px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_assessed">
                                Not Assessed
                              </SelectItem>
                              <SelectItem value="compliant">
                                Available
                              </SelectItem>
                              <SelectItem value="partially_compliant">
                                In Progress
                              </SelectItem>
                              <SelectItem value="non_compliant">
                                Missing
                              </SelectItem>
                              <SelectItem value="not_applicable">
                                N/A
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Notes or file reference..."
                            value={entry.notes ?? ""}
                            onChange={(e) =>
                              updateDocument(doc.id, "notes", e.target.value)
                            }
                            className="h-7 text-xs flex-1 min-w-[120px]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* After */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-3">
                  After Completion ({afterDocs.length} documents)
                </h4>
                <div className="space-y-2">
                  {afterDocs.map((doc) => {
                    const entry = getDocument(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className="rounded-lg border border-zinc-800 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-mono text-zinc-500 mr-2">
                              {doc.id}
                            </span>
                            <span className="text-sm text-zinc-200">
                              {doc.title}
                            </span>
                            {doc.trackedByVaxEvidence && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs border-blue-500/30 text-blue-400"
                              >
                                Tracked
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={entry.status}
                            onValueChange={(v) =>
                              updateDocument(doc.id, "status", v)
                            }
                          >
                            <SelectTrigger className="h-7 w-[170px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_assessed">
                                Not Assessed
                              </SelectItem>
                              <SelectItem value="compliant">
                                Available
                              </SelectItem>
                              <SelectItem value="partially_compliant">
                                In Progress
                              </SelectItem>
                              <SelectItem value="non_compliant">
                                Missing
                              </SelectItem>
                              <SelectItem value="not_applicable">
                                N/A
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Notes or file reference..."
                            value={entry.notes ?? ""}
                            onChange={(e) =>
                              updateDocument(doc.id, "notes", e.target.value)
                            }
                            className="h-7 text-xs flex-1 min-w-[120px]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
