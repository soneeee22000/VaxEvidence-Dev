"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { PicoGeneratorPanel } from "./PicoGeneratorPanel";
import { EvidenceSynthesisPanel } from "./EvidenceSynthesisPanel";
import { GapAnalysisPanel } from "./GapAnalysisPanel";
import { PaperRecommendationsPanel } from "./PaperRecommendationsPanel";
import type { PicoOutput } from "@/lib/ai/ai-validators";

/**
 * AI Research Assistant orchestrator panel.
 * Contains all four AI features in a tabbed interface.
 * Inserted into the protocol detail page after linked evidence.
 */
interface AiAssistantPanelProps {
  protocolId: string;
  /** Current study question to pre-fill the PICO generator. */
  studyQuestion?: string;
  /** Number of linked evidence items. */
  linkedEvidenceCount: number;
  /** PMIDs from linked evidence (external_id where external_source is "pubmed"). */
  linkedPmids: string[];
  /** Callback when PICO is generated — parent applies to form fields. */
  onPicoGenerated: (pico: PicoOutput) => void;
  /** Callback after a paper is imported from recommendations. */
  onEvidenceImported?: () => void;
}

export function AiAssistantPanel({
  protocolId,
  studyQuestion,
  linkedEvidenceCount,
  linkedPmids,
  onPicoGenerated,
  onEvidenceImported,
}: AiAssistantPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Research Assistant
        </CardTitle>
        <CardDescription>
          AI-powered tools to help design your protocol and analyze evidence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pico">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pico">PICO</TabsTrigger>
            <TabsTrigger value="synthesis">Synthesis</TabsTrigger>
            <TabsTrigger value="gaps">Gaps</TabsTrigger>
            <TabsTrigger value="papers">Papers</TabsTrigger>
          </TabsList>

          <TabsContent value="pico" className="mt-4">
            <PicoGeneratorPanel
              onGenerated={onPicoGenerated}
              initialQuestion={studyQuestion}
            />
          </TabsContent>

          <TabsContent value="synthesis" className="mt-4">
            <EvidenceSynthesisPanel
              protocolId={protocolId}
              linkedEvidenceCount={linkedEvidenceCount}
            />
          </TabsContent>

          <TabsContent value="gaps" className="mt-4">
            <GapAnalysisPanel
              protocolId={protocolId}
              linkedEvidenceCount={linkedEvidenceCount}
            />
          </TabsContent>

          <TabsContent value="papers" className="mt-4">
            <PaperRecommendationsPanel
              protocolId={protocolId}
              linkedPmids={linkedPmids}
              onImported={onEvidenceImported}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
