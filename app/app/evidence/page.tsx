"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EvidenceCard } from "@/components/evidence/evidence-card"
import {
  EvidenceFilters,
  type FilterState,
} from "@/components/evidence/evidence-filters"
import { fetchEvidenceItems, getUniqueTags } from "@/lib/supabase/evidence"
import type { EvidenceItem } from "@/lib/validators/evidence"
import { Search, Plus, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc"

export default function EvidenceLibraryPage() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [filteredEvidence, setFilteredEvidence] = useState<EvidenceItem[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    statuses: [],
    tags: [],
    dateFrom: "",
    dateTo: "",
  })

  // Load evidence and tags
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Fetch all evidence
        const { data: evidenceData, error: evidenceError } =
          await fetchEvidenceItems()

        if (evidenceError) {
          console.error("Error fetching evidence:", evidenceError)
          setEvidence([])
        } else {
          setEvidence(evidenceData || [])
        }

        // Fetch unique tags
        const { data: tagsData, error: tagsError } = await getUniqueTags()
        if (!tagsError && tagsData) {
          setAvailableTags(tagsData)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Apply filters and search
  useEffect(() => {
    let result = [...evidence]

    // Apply type filter
    if (filters.types.length > 0) {
      result = result.filter((item) => filters.types.includes(item.type))
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      result = result.filter((item) => filters.statuses.includes(item.status))
    }

    // Apply tags filter
    if (filters.tags.length > 0) {
      result = result.filter((item) =>
        filters.tags.some((tag) => item.tags.includes(tag))
      )
    }

    // Apply date range filter
    if (filters.dateFrom) {
      result = result.filter((item) => {
        const itemDate = item.publication_date || item.created_at
        return itemDate >= filters.dateFrom
      })
    }

    if (filters.dateTo) {
      result = result.filter((item) => {
        const itemDate = item.publication_date || item.created_at
        return itemDate <= filters.dateTo
      })
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.authors?.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        break
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        )
        break
      case "title-asc":
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "title-desc":
        result.sort((a, b) => b.title.localeCompare(a.title))
        break
    }

    setFilteredEvidence(result)
  }, [evidence, filters, searchQuery, sortBy])

  if (isLoading) {
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
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Evidence Library</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and manage vaccine research evidence
          </p>
        </div>

        {/* Search and Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
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
                    onFilterChange={setFilters}
                    availableTags={availableTags}
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
                  onFilterChange={setFilters}
                  availableTags={availableTags}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Evidence Grid */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredEvidence.length} of {evidence.length} items
            </div>

            {filteredEvidence.length === 0 ? (
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
                {filteredEvidence.map((item) => (
                  <EvidenceCard key={item.id} evidence={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
