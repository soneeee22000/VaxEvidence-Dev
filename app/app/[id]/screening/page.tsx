"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScreeningPipeline } from "@/components/screening/screening-pipeline";
import { DuplicateDetectorDialog } from "@/components/screening/duplicate-detector-dialog";
import { PrismaFlowDiagram } from "@/components/screening/prisma-flow-diagram";
import { RobSummaryTable } from "@/components/risk-of-bias/rob-summary-table";
import { MetaAnalysisPanel } from "@/components/meta-analysis/meta-analysis-panel";
import type {
  ScreeningStageCounts,
  ScreeningStage,
} from "@/lib/validators/screening";
import { screeningStages } from "@/lib/validators/screening";
import { fetchProtocolById } from "@/lib/supabase/protocols";
import { getLinkedEvidence } from "@/lib/supabase/evidence";
import { useScreeningDecisions, queryKeys } from "@/lib/query/hooks";
import {
  ArrowLeft,
  Loader2,
  BarChart3,
  GitBranch,
  Shield,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics/track-event";

/** Screening page for a protocol's systematic review workflow. */
export default function ScreeningPage() {
  const { id: protocolId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [protocolTitle, setProtocolTitle] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [protocolNotFound, setProtocolNotFound] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("screening");
  const hasInitialized = useRef(false);

  const { data: decisions = [], isLoading: isLoadingDecisions } =
    useScreeningDecisions(protocolId);

  /** Compute stage counts from decisions array. */
  const counts = useMemo<ScreeningStageCounts>(() => {
    const result: ScreeningStageCounts = {
      identification: {
        total: 0,
        pending: 0,
        include: 0,
        exclude: 0,
        duplicate: 0,
      },
      screening: { total: 0, pending: 0, include: 0, exclude: 0, duplicate: 0 },
      eligibility: {
        total: 0,
        pending: 0,
        include: 0,
        exclude: 0,
        duplicate: 0,
      },
      included: { total: 0, pending: 0, include: 0, exclude: 0, duplicate: 0 },
    };
    for (const d of decisions) {
      const stage = d.stage as ScreeningStage;
      if (result[stage]) {
        result[stage].total++;
        const key = d.decision as keyof (typeof result)[typeof stage];
        if (key in result[stage]) {
          (result[stage] as Record<string, number>)[key]++;
        }
      }
    }
    return result;
  }, [decisions]);

  /** Helper to invalidate screening queries after mutations. */
  const invalidateScreening = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.screening.byProtocol(protocolId),
    });
  }, [queryClient, protocolId]);

  /** Initialize: load protocol title, auto-initialize from linked evidence if needed. */
  useEffect(() => {
    if (hasInitialized.current) return;
    if (isLoadingDecisions) return;

    hasInitialized.current = true;

    async function init() {
      setIsInitializing(true);
      try {
        // Load protocol title
        const { data: protocol } = await fetchProtocolById(protocolId);
        if (!protocol) {
          setProtocolNotFound(true);
          setIsInitializing(false);
          return;
        }
        setProtocolTitle(protocol.title);

        // If no decisions exist, auto-initialize from linked evidence
        if (decisions.length === 0) {
          const { data: linkedEvidence } = await getLinkedEvidence(protocolId);
          if (linkedEvidence && linkedEvidence.length > 0) {
            const evidenceIds = linkedEvidence.map((e: { id: string }) => e.id);
            await fetch("/api/screening", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                protocol_id: protocolId,
                evidence_ids: evidenceIds,
                stage: "identification",
              }),
            });
            invalidateScreening();
          }
        }
      } catch {
        toast.error("Failed to initialize screening");
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, [protocolId, decisions.length, isLoadingDecisions, invalidateScreening]);

  /** Handle include/exclude/duplicate decision. */
  const handleDecision = useCallback(
    async (
      id: string,
      decision: "include" | "exclude" | "duplicate",
      exclusionReason?: string,
      notes?: string,
    ) => {
      const res = await fetch(`/api/screening/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          exclusion_reason: exclusionReason ?? null,
          notes: notes ?? null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      trackEvent("screening_decision", { decision, protocolId });
      invalidateScreening();
    },
    [invalidateScreening, protocolId],
  );

  /** Revert a decision back to pending. */
  const handleRevert = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/screening/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "pending",
          exclusion_reason: null,
          notes: null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      invalidateScreening();
    },
    [invalidateScreening],
  );

  /** Advance included items from current stage to next stage. */
  const handleAdvanceIncluded = useCallback(
    async (currentStage: ScreeningStage) => {
      const stageIdx = screeningStages.indexOf(currentStage);
      if (stageIdx >= screeningStages.length - 1) return;
      const nextStage = screeningStages[stageIdx + 1];

      const includedInStage = decisions.filter(
        (d) => d.stage === currentStage && d.decision === "include",
      );
      if (includedInStage.length === 0) return;

      const evidenceIds = includedInStage.map((d) => d.evidence_id);
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol_id: protocolId,
          evidence_ids: evidenceIds,
          stage: nextStage,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      invalidateScreening();
    },
    [protocolId, decisions, invalidateScreening],
  );

  if (protocolNotFound) {
    return (
      <div className="container max-w-6xl mx-auto py-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <h2 className="text-xl font-semibold">Protocol not found</h2>
          <p className="text-muted-foreground">
            The protocol you are looking for does not exist or you do not have
            access to it.
          </p>
          <Button variant="outline" asChild>
            <Link href="/app">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingDecisions || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/app/${protocolId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Systematic Review</h1>
          {protocolTitle && (
            <p className="text-sm text-muted-foreground">{protocolTitle}</p>
          )}
        </div>
      </div>

      {/* Tabs: Screening | PRISMA Diagram | Risk of Bias | Meta-Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="screening" className="gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Screening
          </TabsTrigger>
          <TabsTrigger value="prisma" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            PRISMA Diagram
          </TabsTrigger>
          <TabsTrigger value="rob" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Risk of Bias
          </TabsTrigger>
          <TabsTrigger value="meta" className="gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Meta-Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screening" className="mt-4">
          <ScreeningPipeline
            protocolId={protocolId}
            decisions={decisions}
            counts={counts}
            onDecision={handleDecision}
            onRevert={handleRevert}
            onAdvanceIncluded={handleAdvanceIncluded}
            onDetectDuplicates={() => setShowDuplicateDialog(true)}
          />
        </TabsContent>

        <TabsContent value="prisma" className="mt-4">
          <PrismaFlowDiagram counts={counts} />
        </TabsContent>

        <TabsContent value="rob" className="mt-4">
          <RobSummaryTable
            protocolId={protocolId}
            includedEvidence={decisions
              .filter((d) => d.stage === "included" && d.decision === "include")
              .map((d) => d.evidence_items)}
          />
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <MetaAnalysisPanel protocolId={protocolId} />
        </TabsContent>
      </Tabs>

      {/* Duplicate detection dialog */}
      <DuplicateDetectorDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        protocolId={protocolId}
        decisions={decisions.filter((d) => d.stage === "identification")}
        onResolved={invalidateScreening}
      />
    </div>
  );
}
