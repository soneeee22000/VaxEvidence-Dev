"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DatasetCard } from "@/components/datasets/dataset-card";
import {
  DatasetFilters,
  type DatasetFilterState,
} from "@/components/datasets/dataset-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  getDatasetFileUrl,
  getTotalStorageUsed,
  createDataset,
} from "@/lib/supabase/datasets";
import { useDatasetList, useDatasetTags, queryKeys } from "@/lib/query/hooks";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { buildPaginationMeta, DEFAULT_PAGE_SIZE } from "@/lib/types/pagination";
import type { Dataset } from "@/lib/validators/dataset";
import { formatFileSize } from "@/lib/validators/dataset";
import type { FileType } from "@/lib/validators/dataset";
import {
  Search,
  Filter,
  Upload,
  HardDrive,
  Database,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { SAMPLE_DATASETS } from "@/lib/demo/sample-datasets";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type SortField =
  | "created_at"
  | "updated_at"
  | "name"
  | "file_size"
  | "row_count";

function DatasetsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  const initialPage = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const initialPageSize =
    parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) ||
    DEFAULT_PAGE_SIZE;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [totalStorage, setTotalStorage] = useState(0);
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);

  const [filters, setFilters] = useState<DatasetFilterState>({
    types: [],
    fileTypes: [],
    statuses: [],
    tags: [],
  });

  const {
    inputValue: searchInput,
    debouncedValue: search,
    setInputValue: setSearchInput,
  } = useDebouncedSearch("");

  const { data, isLoading, isError } = useDatasetList({
    page,
    pageSize,
    search: search || undefined,
    types: filters.types.length > 0 ? filters.types : undefined,
    statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
    fileTypes:
      filters.fileTypes.length > 0
        ? (filters.fileTypes as FileType[])
        : undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined,
    sortBy: sortField,
    sortDirection,
  });

  const { data: availableTags } = useDatasetTags();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pagination = buildPaginationMeta(totalCount, page, pageSize);

  useEffect(() => {
    getTotalStorageUsed().then(({ data: storageData }) => {
      setTotalStorage(storageData || 0);
    });
  }, []);

  const updateUrl = (newPage: number, newPageSize: number) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (newPageSize !== DEFAULT_PAGE_SIZE)
      params.set("pageSize", String(newPageSize));
    const qs = params.toString();
    router.replace(`/app/datasets${qs ? `?${qs}` : ""}`, { scroll: false });
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

  const handleFilterChange = (newFilters: DatasetFilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleDownload = async (dataset: Dataset) => {
    const { data: urlData, error } = await getDatasetFileUrl(
      dataset.storage_path,
    );
    if (error || !urlData) {
      toast.error("Failed to get download link");
      return;
    }
    window.open(urlData.signedUrl, "_blank");
  };

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split("-") as [SortField, "asc" | "desc"];
    setSortField(field);
    setSortDirection(direction);
    setPage(1);
  };

  const handleLoadSampleData = async () => {
    setIsLoadingSampleData(true);
    try {
      if (!authUser) throw new Error("Not authenticated");

      const sampleDataset = SAMPLE_DATASETS[0];
      const demoStoragePath = `demo:${sampleDataset.filePath}`;

      const datasetPayload = {
        name: sampleDataset.name,
        description: sampleDataset.description,
        dataset_type: sampleDataset.datasetType,
        tags: sampleDataset.tags,
        status: "draft" as const,
        user_id: authUser.id,
        file_name: sampleDataset.fileName,
        file_size: 5000,
        file_type: "csv" as const,
        storage_path: demoStoragePath,
        row_count: sampleDataset.rowCount,
        column_count: sampleDataset.columnCount,
      };

      const { error: createError } = await createDataset(datasetPayload);
      if (createError) throw new Error(createError.message);

      toast.success(
        "Vaccine clinical trial sample dataset has been added to your library.",
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.datasets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets.tags() });
      getTotalStorageUsed().then(({ data: storageData }) => {
        setTotalStorage(storageData || 0);
      });
    } catch (error) {
      console.error("Error loading sample data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load sample data",
      );
    } finally {
      setIsLoadingSampleData(false);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-7xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading datasets...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Dataset Library</CardTitle>
              <CardDescription>
                Manage and analyze your vaccine study datasets
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                <span>{formatFileSize(totalStorage)} used</span>
              </div>
              <Button asChild>
                <Link href="/app/datasets/new">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Dataset
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Desktop Filters */}
          <aside className="hidden lg:block">
            <Card>
              <CardContent className="pt-6">
                <DatasetFilters
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                  availableTags={availableTags ?? []}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Search and Sort */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search datasets..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Filter */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <div className="mt-6">
                      <DatasetFilters
                        filters={filters}
                        onFiltersChange={handleFilterChange}
                        availableTags={availableTags ?? []}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select
                  value={`${sortField}-${sortDirection}`}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">
                      Newest first
                    </SelectItem>
                    <SelectItem value="created_at-asc">Oldest first</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="file_size-desc">
                      Largest first
                    </SelectItem>
                    <SelectItem value="file_size-asc">
                      Smallest first
                    </SelectItem>
                    <SelectItem value="row_count-desc">Most rows</SelectItem>
                    <SelectItem value="row_count-asc">Fewest rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${totalCount} dataset${totalCount !== 1 ? "s" : ""} found`}
            </p>

            {isError && (
              <Card>
                <CardContent className="py-6 text-center text-destructive">
                  Failed to load datasets. Please try again.
                </CardContent>
              </Card>
            )}

            {/* Dataset Grid */}
            {items.length === 0 && !isLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground mb-4">
                    {search || filters.types.length > 0
                      ? "No datasets match your filters"
                      : "No datasets yet"}
                  </p>
                  {!search && filters.types.length === 0 && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex gap-2">
                        <Button asChild>
                          <Link href="/app/datasets/new">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload your first dataset
                          </Link>
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-sm">or</span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleLoadSampleData}
                        disabled={isLoadingSampleData}
                      >
                        {isLoadingSampleData ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading sample data...
                          </>
                        ) : (
                          <>
                            <Database className="mr-2 h-4 w-4" />
                            Load Sample Clinical Trial Data
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center max-w-sm">
                        Try VaxEvidence with a sample vaccine clinical trial
                        dataset containing 50 participant records.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((dataset) => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}

            {totalCount > 0 && (
              <div className="mt-4">
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

export default function DatasetsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-12">
          <div className="mx-auto w-full max-w-7xl">
            <Card>
              <CardHeader>
                <CardTitle>Loading datasets...</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </main>
      }
    >
      <DatasetsContent />
    </Suspense>
  );
}
