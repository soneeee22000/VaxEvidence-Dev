"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Shield, ClipboardCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistPanel } from "@/components/regulatory/checklist-panel";
import { GCPCompliancePanel } from "@/components/regulatory/gcp-compliance-panel";

/**
 * Regulatory Compliance Hub — CONSORT/STROBE checklists + ICH GCP tracker.
 */
export default function RegulatoryPage() {
  const params = useParams<{ id: string }>();
  const protocolId = params?.id;

  if (!protocolId) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-4xl">
          <p className="text-muted-foreground">Missing protocol ID.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/app/${protocolId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Protocol
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Regulatory Compliance
              </h1>
              <p className="text-sm text-muted-foreground">
                Reporting checklists and GCP compliance tracking
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="consort" className="space-y-4">
          <TabsList>
            <TabsTrigger value="consort" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              CONSORT
            </TabsTrigger>
            <TabsTrigger value="strobe" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              STROBE
            </TabsTrigger>
            <TabsTrigger value="gcp" className="gap-2">
              <Shield className="h-4 w-4" />
              ICH GCP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consort">
            <ChecklistPanel protocolId={protocolId} checklistType="consort" />
          </TabsContent>

          <TabsContent value="strobe">
            <ChecklistPanel protocolId={protocolId} checklistType="strobe" />
          </TabsContent>

          <TabsContent value="gcp">
            <GCPCompliancePanel protocolId={protocolId} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
