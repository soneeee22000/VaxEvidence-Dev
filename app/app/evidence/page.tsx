"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { EvidenceCard } from "@/components/evidence/evidence-card";
import { PubMedSearch } from "@/components/evidence/pubmed-search";
import { QuickImport } from "@/components/evidence/quick-import";
import { TrialSearch } from "@/components/evidence/trial-search";
import {
  EvidenceFilters,
  type FilterState,
} from "@/components/evidence/evidence-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useEvidenceList, useEvidenceTags, queryKeys } from "@/lib/query/hooks";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { buildPaginationMeta, DEFAULT_PAGE_SIZE } from "@/lib/types/pagination";
import type { EvidenceItem } from "@/lib/validators/evidence";
import type { EvidenceType, EvidenceStatus } from "@/lib/validators/evidence";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

/**
 * Map UI sort option to API sort params.
 */
function parseSortOption(sort: SortOption): {
  sortBy: string;
  sortDirection: "asc" | "desc";
} {
  switch (sort) {
    case "newest":
      return { sortBy: "updated_at", sortDirection: "desc" };
    case "oldest":
      return { sortBy: "updated_at", sortDirection: "asc" };
    case "title-asc":
      return { sortBy: "title", sortDirection: "asc" };
    case "title-desc":
      return { sortBy: "title", sortDirection: "desc" };
  }
}

function EvidenceLibraryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const initialPage = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const initialPageSize =
    parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) ||
    DEFAULT_PAGE_SIZE;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    statuses: [],
    tags: [],
    dateFrom: "",
    dateTo: "",
  });

  const {
    inputValue: searchInput,
    debouncedValue: search,
    setInputValue: setSearchInput,
  } = useDebouncedSearch("");

  const sortParams = parseSortOption(sortBy);

  const { data, isLoading, isError } = useEvidenceList({
    page,
    pageSize,
    search: search || undefined,
    types: filters.types.length > 0 ? filters.types : undefined,
    statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    ...sortParams,
  });

  const { data: availableTags } = useEvidenceTags();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pagination = buildPaginationMeta(totalCount, page, pageSize);

  /**
   * Update URL search params to reflect current page.
   */
  const updateUrl = (newPage: number, newPageSize: number) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (newPageSize !== DEFAULT_PAGE_SIZE)
      params.set("pageSize", String(newPageSize));
    const qs = params.toString();
    router.replace(`/app/evidence${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    updateUrl(1, newSize);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleImportedEvidence = (_item: EvidenceItem) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.evidence.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.evidence.tags() });
  };

  if (isLoading && items.length === 0) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto w-full max-w-7xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading Evidence Library...</CardTitle>
              <CardDescription>Please wait a moment.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Evidence Library
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse and manage vaccine research evidence
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search External Databases</CardTitle>
            <CardDescription>
              Import studies from PubMed, DOI/PMID, and ClinicalTrials.gov.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <PubMedSearch onImported={handleImportedEvidence} />
            <QuickImport onImported={handleImportedEvidence} />
            <TrialSearch onImported={handleImportedEvidence} />
          </CardContent>
        </Card>

        {/* Search and Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search evidence..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <div className="mt-6">
                  <EvidenceFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    availableTags={availableTags ?? []}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Button asChild>
              <Link href="/app/evidence/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Evidence
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="pt-6">
                <EvidenceFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  availableTags={availableTags ?? []}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Evidence Grid */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `Showing ${items.length} of ${totalCount} items`}
            </div>

            {isError && (
              <Card className="mb-4">
                <CardContent className="py-6 text-center text-destructive">
                  Failed to load evidence. Please try again.
                </CardContent>
              </Card>
            )}

            {items.length === 0 && !isLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg font-medium text-muted-foreground">
                    No evidence found
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <EvidenceCard key={item.id} evidence={item} />
                ))}
              </div>
            )}

            {totalCount > 0 && (
              <div className="mt-6">
                <PaginationControls
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function EvidenceLibraryPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Card>
              <CardHeader>
                <CardTitle>Loading Evidence Library...</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </main>
      }
    >
      <EvidenceLibraryContent />
    </Suspense>
  );
}
