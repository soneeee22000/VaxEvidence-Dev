"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDemo } from "@/lib/demo/demo-context";
import { DemoCtaCard } from "@/components/demo/demo-cta-card";
import { ArrowLeft, FlaskConical, FileSearch } from "lucide-react";

/**
 * Demo protocol detail — read-only PICO view with evidence summary.
 */
export default function DemoProtocolDetail() {
  const { protocol, evidenceItems } = useDemo();

  const picoFields = [
    { label: "Population", value: protocol.population },
    { label: "Intervention", value: protocol.intervention },
    { label: "Comparator", value: protocol.comparator },
    { label: "Outcomes", value: protocol.outcomes },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Back nav */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/demo">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        {/* Protocol header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{protocol.title}</CardTitle>
                <CardDescription>{protocol.study_question}</CardDescription>
              </div>
              <Badge variant="secondary" className="capitalize shrink-0">
                {protocol.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Study Design
                </p>
                <p className="text-sm">{protocol.design}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PICO Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PICO Framework</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {picoFields.map((field) => (
              <div key={field.label} className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </p>
                <p className="text-sm leading-relaxed">{field.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Edit CTA */}
        <DemoCtaCard action="edit this protocol" />

        {/* Linked Evidence */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Linked Evidence</CardTitle>
            <Badge variant="outline">{evidenceItems.length} items</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidenceItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.authors} — {item.source} ({item.year})
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 capitalize text-[10px]"
                >
                  {item.evidence_type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Systematic Review link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Systematic Review
            </CardTitle>
            <CardDescription>
              Screen evidence through the PRISMA pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`/demo/${protocol.id}/screening`}>
                <FileSearch className="mr-2 h-4 w-4" />
                View Screening Pipeline
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
