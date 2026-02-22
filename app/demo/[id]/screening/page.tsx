"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/demo-context";
import { DemoCtaCard } from "@/components/demo/demo-cta-card";
import {
  ArrowLeft,
  BarChart3,
  GitBranch,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

const STAGE_LABELS: Record<string, string> = {
  identification: "Identification",
  screening: "Screening",
  eligibility: "Eligibility",
  included: "Included",
};

/**
 * Demo screening page — static PRISMA pipeline with pre-populated decisions.
 */
export default function DemoScreeningPage() {
  const { protocol, evidenceItems, screeningDecisions, counts } = useDemo();

  const handleDemoAction = () => {
    toast.info("Sign up for a free account to make screening decisions.");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Back nav */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/demo/${protocol.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to protocol
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Systematic Review: Screening</h1>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(counts) as Array<keyof typeof counts>).map((stage) => {
            const c = counts[stage];
            return (
              <Card key={stage} className="p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {STAGE_LABELS[stage]}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{c.total}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.include} included / {c.exclude} excluded
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="pipeline">
          <TabsList>
            <TabsTrigger value="pipeline">
              <GitBranch className="mr-2 h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="prisma">
              <BarChart3 className="mr-2 h-4 w-4" />
              PRISMA Diagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4 pt-4">
            {/* Screening decisions list */}
            {screeningDecisions.map((decision) => {
              const evidence = evidenceItems.find(
                (e) => e.id === decision.evidence_id,
              );
              if (!evidence) return null;

              return (
                <Card key={decision.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{evidence.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {evidence.authors} — {evidence.source} ({evidence.year})
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {STAGE_LABELS[decision.stage]}
                        </Badge>
                        {decision.decision === "include" ? (
                          <Badge className="bg-green-500/15 text-green-600 text-[10px]">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Included
                          </Badge>
                        ) : decision.decision === "exclude" ? (
                          <Badge className="bg-red-500/15 text-red-600 text-[10px]">
                            <XCircle className="mr-1 h-3 w-3" />
                            Excluded
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      {"exclusion_reason" in decision &&
                        decision.exclusion_reason && (
                          <p className="text-xs text-muted-foreground italic pt-1">
                            Reason: {decision.exclusion_reason}
                          </p>
                        )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDemoAction}
                      >
                        Include
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDemoAction}
                      >
                        Exclude
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            <DemoCtaCard action="make screening decisions" />
          </TabsContent>

          <TabsContent value="prisma" className="pt-4">
            {/* Static PRISMA flow diagram */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PRISMA Flow Diagram</CardTitle>
                <CardDescription>
                  Preferred Reporting Items for Systematic Reviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  {/* Identification */}
                  <div className="w-64 rounded-lg border-2 border-blue-500/30 bg-blue-500/5 p-4 text-center">
                    <p className="text-xs font-medium uppercase text-blue-600">
                      Identification
                    </p>
                    <p className="text-2xl font-bold">
                      {counts.identification.total}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Records identified
                    </p>
                  </div>

                  <div className="h-6 w-px bg-border" />

                  {/* Screening */}
                  <div className="flex items-center gap-8">
                    <div className="w-64 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5 p-4 text-center">
                      <p className="text-xs font-medium uppercase text-yellow-600">
                        Screening
                      </p>
                      <p className="text-2xl font-bold">
                        {counts.screening.total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Records screened
                      </p>
                    </div>
                    <div className="rounded-lg border border-dashed border-red-300 bg-red-500/5 px-3 py-2 text-center">
                      <p className="text-sm font-bold text-red-600">
                        {counts.identification.exclude +
                          counts.screening.exclude}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Excluded
                      </p>
                    </div>
                  </div>

                  <div className="h-6 w-px bg-border" />

                  {/* Eligibility */}
                  <div className="w-64 rounded-lg border-2 border-orange-500/30 bg-orange-500/5 p-4 text-center">
                    <p className="text-xs font-medium uppercase text-orange-600">
                      Eligibility
                    </p>
                    <p className="text-2xl font-bold">
                      {counts.eligibility.total}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Full-text assessed
                    </p>
                  </div>

                  <div className="h-6 w-px bg-border" />

                  {/* Included */}
                  <div className="w-64 rounded-lg border-2 border-green-500/30 bg-green-500/5 p-4 text-center">
                    <p className="text-xs font-medium uppercase text-green-600">
                      Included
                    </p>
                    <p className="text-2xl font-bold">
                      {counts.included.total}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Studies included
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
