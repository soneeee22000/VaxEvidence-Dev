"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyManager } from "@/components/settings/api-key-manager";
import { WebhookManager } from "@/components/settings/webhook-manager";
import { SsoConfigPanel } from "@/components/settings/sso-config-panel";
import { IntegrationPanel } from "@/components/settings/integration-panel";
import { AuditLogViewer } from "@/components/settings/audit-log-viewer";
import { ComplianceDashboard } from "@/components/settings/compliance-dashboard";
import { DataResidencyPanel } from "@/components/settings/data-residency-panel";
import { createClient } from "@/lib/supabase/browser";
import {
  Key,
  Webhook,
  ShieldCheck,
  Puzzle,
  Scale,
  Shield,
  Loader2,
} from "lucide-react";

// =============================================================================
// SETTINGS PAGE
// =============================================================================
// Tabbed settings page for workspace configuration: API Keys, Webhooks, SSO,
// Integrations, Audit Log, and Compliance. All tabs active (Phase 12 M1-M5).
// =============================================================================

/** Minimal workspace shape from the `workspaces` table. */
interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export default function SettingsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("workspaces").select("*");
        if (data) {
          setWorkspaces(data as Workspace[]);
        }
      } catch (error) {
        console.error("Failed to load workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Loading settings...
              </span>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (workspaces.length === 0) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your workspace configuration
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>No Workspace Found</CardTitle>
              <CardDescription>
                You need at least one workspace to manage settings. Create a
                workspace first to access API keys, webhooks, and integrations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  const activeWorkspaceId = workspaces[0].id;

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace configuration, API access, and integrations
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="api-keys" className="space-y-4">
          <TabsList>
            <TabsTrigger value="api-keys" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="sso" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              SSO
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Puzzle className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="audit-log" className="gap-2">
              <Scale className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys">
            <ApiKeyManager workspaceId={activeWorkspaceId} />
          </TabsContent>

          <TabsContent value="webhooks">
            <WebhookManager workspaceId={activeWorkspaceId} />
          </TabsContent>

          <TabsContent value="sso">
            <SsoConfigPanel workspaceId={activeWorkspaceId} />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationPanel workspaceId={activeWorkspaceId} />
          </TabsContent>

          <TabsContent value="audit-log">
            <AuditLogViewer workspaceId={activeWorkspaceId} />
          </TabsContent>

          <TabsContent value="compliance">
            <div className="space-y-6">
              <ComplianceDashboard workspaceId={activeWorkspaceId} />
              <DataResidencyPanel workspaceId={activeWorkspaceId} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
