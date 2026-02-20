"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  fetchDatasets,
  getDatasetFileUrl,
  getTotalStorageUsed,
  getUniqueTags,
  createDataset,
  type DatasetSortOptions,
} from "@/lib/supabase/datasets";
import type { Dataset } from "@/lib/validators/dataset";
import { formatFileSize } from "@/lib/validators/dataset";
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

type SortField =
  | "created_at"
  | "updated_at"
  | "name"
  | "file_size"
  | "row_count";

export default function DatasetsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [totalStorage, setTotalStorage] = useState(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [filters, setFilters] = useState<DatasetFilterState>({
    types: [],
    fileTypes: [],
    statuses: [],
    tags: [],
  });

  useEffect(() => {
    loadDatasets();
    loadTotalStorage();
    loadUniqueTags();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [datasets, searchQuery, filters, sortField, sortDirection]);

  const loadDatasets = async () => {
    setIsLoading(true);
    const { data, error } = await fetchDatasets();

    if (error || !data) {
      toast.error("Failed to load datasets");
      setIsLoading(false);
      return;
    }

    setDatasets(data);
    setIsLoading(false);
  };

  const loadTotalStorage = async () => {
    const { data } = await getTotalStorageUsed();
    setTotalStorage(data || 0);
  };

  const loadUniqueTags = async () => {
    const { data } = await getUniqueTags();
    setAvailableTags(data || []);
  };

  const applyFilters = () => {
    let filtered = [...datasets];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dataset) =>
          dataset.name.toLowerCase().includes(query) ||
          dataset.description.toLowerCase().includes(query) ||
          dataset.file_name.toLowerCase().includes(query) ||
          dataset.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Apply type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter((dataset) =>
        filters.types.includes(dataset.dataset_type),
      );
    }

    // Apply file type filter
    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter((dataset) =>
        filters.fileTypes.includes(dataset.file_type),
      );
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((dataset) =>
        filters.statuses.includes(dataset.status),
      );
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((dataset) =>
        filters.tags.some((tag) => dataset.tags.includes(tag)),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: unknown = a[sortField];
      let bValue: unknown = b[sortField];

      // Handle null values
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Convert to comparable values
      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue! < bValue!) return sortDirection === "asc" ? -1 : 1;
      if (aValue! > bValue!) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredDatasets(filtered);
  };

  const handleDownload = async (dataset: Dataset) => {
    const { data, error } = await getDatasetFileUrl(dataset.storage_path);

    if (error || !data) {
      toast.error("Failed to get download link");
      return;
    }

    // Open download link
    window.open(data.signedUrl, "_blank");
  };

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split("-") as [SortField, "asc" | "desc"];
    setSortField(field);
    setSortDirection(direction);
  };

  const handleLoadSampleData = async () => {
    setIsLoadingSampleData(true);

    try {
      if (!authUser) {
        throw new Error("Not authenticated");
      }
      const user = authUser;

      // Load the sample dataset metadata (no storage upload needed for demo data)
      const sampleDataset = SAMPLE_DATASETS[0];

      // Use demo: prefix - file is served directly from public folder
      const demoStoragePath = `demo:${sampleDataset.filePath}`;

      // Create dataset record with demo path (no actual file upload)
      const datasetPayload = {
        name: sampleDataset.name,
        description: sampleDataset.description,
        dataset_type: sampleDataset.datasetType,
        tags: sampleDataset.tags,
        status: "draft" as const,
        user_id: user.id,
        file_name: sampleDataset.fileName,
        file_size: 5000,
        file_type: "csv" as const,
        storage_path: demoStoragePath,
        row_count: sampleDataset.rowCount,
        column_count: sampleDataset.columnCount,
      };

      const { data: dataset, error: createError } =
        await createDataset(datasetPayload);

      if (createError || !dataset) {
        throw new Error(
          createError?.message || "Failed to create dataset record",
        );
      }

      toast.success(
        "Vaccine clinical trial sample dataset has been added to your library.",
      );

      // Refresh datasets
      loadDatasets();
      loadTotalStorage();
      loadUniqueTags();
    } catch (error) {
      console.error("Error loading sample data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load sample data",
      );
    } finally {
      setIsLoadingSampleData(false);
    }
  };

  if (isLoading) {
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
                  onFiltersChange={setFilters}
                  availableTags={availableTags}
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                        onFiltersChange={setFilters}
                        availableTags={availableTags}
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
              {filteredDatasets.length} dataset
              {filteredDatasets.length !== 1 ? "s" : ""} found
            </p>

            {/* Dataset Grid */}
            {filteredDatasets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || filters.types.length > 0
                      ? "No datasets match your filters"
                      : "No datasets yet"}
                  </p>
                  {!searchQuery && filters.types.length === 0 && (
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
                {filteredDatasets.map((dataset) => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
