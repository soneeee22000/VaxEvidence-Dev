"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceExportButton } from "@/components/export/workspace-export-button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useProtocolList } from "@/lib/query/hooks";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { buildPaginationMeta } from "@/lib/types/pagination";
import { useAuth } from "@/lib/auth/auth-context";
import { useOnboarding } from "@/lib/onboarding/onboarding-context";
import { Search, Loader2, FileText } from "lucide-react";

const DASHBOARD_PAGE_SIZE = 12;

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, signOut } = useAuth();
  const { isOnboarding } = useOnboarding();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const initialPage = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const [page, setPage] = useState(initialPage);

  const {
    inputValue: searchInput,
    debouncedValue: search,
    setInputValue: setSearchInput,
  } = useDebouncedSearch("");

  const { data, isLoading, isError } = useProtocolList({
    page,
    pageSize: DASHBOARD_PAGE_SIZE,
    search: search || undefined,
    sortBy: "updated_at",
    sortDirection: "desc",
  });

  const protocols = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pagination = buildPaginationMeta(totalCount, page, DASHBOARD_PAGE_SIZE);

  const email = authUser?.email ?? null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.replace("/auth");
    router.refresh();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router.replace(`/app${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const formatDate = (value: string) => new Date(value).toLocaleDateString();

  if (isLoading && protocols.length === 0) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading your workspace...</CardTitle>
              <CardDescription>Please wait a moment.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Protocol Builder</CardTitle>
              <CardDescription>
                {email
                  ? `Signed in as ${email}`
                  : "Your authenticated workspace"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/app/new">New protocol</Link>
              </Button>
              <WorkspaceExportButton />
              <Button
                variant="outline"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search protocols..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {isError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Failed to load protocols. Please try again.
              </p>
            )}

            {protocols.length === 0 && !isLoading && !isError && (
              <div className="rounded-lg border border-dashed border-muted px-4 py-6 text-center text-muted-foreground">
                {isOnboarding ? (
                  <>
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="mt-3 text-base font-medium text-foreground">
                      Setting up your workspace...
                    </p>
                    <p className="mt-1 text-sm">
                      We are creating a sample protocol to help you get started.
                    </p>
                  </>
                ) : (
                  <>
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                    <p className="text-base font-medium text-foreground">
                      {search
                        ? "No protocols match your search"
                        : "No protocols yet"}
                    </p>
                    <p className="mt-1 text-sm">
                      {search
                        ? "Try a different search term."
                        : "Create your first study protocol to get started."}
                    </p>
                  </>
                )}
              </div>
            )}

            {protocols.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {protocols.map((protocol) => (
                  <Card
                    key={protocol.id}
                    className="border-border hover:border-primary/30 card-hover"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {protocol.title}
                      </CardTitle>
                      <CardDescription>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize mr-2">
                          {protocol.status.replace("_", " ")}
                        </span>
                        Updated {formatDate(protocol.updated_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p className="line-clamp-3">{protocol.study_question}</p>
                    </CardContent>
                    <CardFooter className="justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/app/${protocol.id}`}>View protocol</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {totalCount > 0 && (
              <PaginationControls
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={() => {}}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function AppDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-12">
          <div className="mx-auto w-full max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Loading your workspace...</CardTitle>
                <CardDescription>Please wait a moment.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
