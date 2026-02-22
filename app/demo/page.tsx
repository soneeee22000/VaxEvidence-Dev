"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "@/lib/demo/demo-context";
import { DemoCtaCard } from "@/components/demo/demo-cta-card";

/**
 * Demo dashboard — shows the pre-loaded demo protocol card.
 */
export default function DemoDashboard() {
  const { protocol } = useDemo();

  const formatDate = (value: string) => new Date(value).toLocaleDateString();

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Protocol Builder</CardTitle>
              <CardDescription>
                Explore a sample RSV vaccine effectiveness study
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demo protocol card */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-muted/70">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{protocol.title}</CardTitle>
                  </div>
                  <CardDescription className="capitalize">
                    <Badge variant="secondary" className="mr-2">
                      {protocol.status.replace("_", " ")}
                    </Badge>
                    Updated {formatDate(protocol.updated_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="line-clamp-3">{protocol.study_question}</p>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/demo/${protocol.id}`}>View protocol</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <DemoCtaCard action="create your own protocols" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
