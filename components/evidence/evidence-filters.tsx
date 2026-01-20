"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { EvidenceType, EvidenceStatus } from "@/lib/validators/evidence"
import { evidenceTypes, evidenceStatuses } from "@/lib/validators/evidence"

export interface FilterState {
  types: EvidenceType[]
  statuses: EvidenceStatus[]
  tags: string[]
  dateFrom: string
  dateTo: string
}

interface EvidenceFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  availableTags?: string[]
}

export function EvidenceFilters({
  filters,
  onFilterChange,
  availableTags = [],
}: EvidenceFiltersProps) {
  const [selectedTag, setSelectedTag] = useState<string>("")

  const handleTypeToggle = (type: EvidenceType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type]
    onFilterChange({ ...filters, types: newTypes })
  }

  const handleStatusToggle = (status: EvidenceStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status]
    onFilterChange({ ...filters, statuses: newStatuses })
  }

  const handleAddTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      onFilterChange({ ...filters, tags: [...filters.tags, tag] })
    }
    setSelectedTag("")
  }

  const handleRemoveTag = (tag: string) => {
    onFilterChange({ ...filters, tags: filters.tags.filter((t) => t !== tag) })
  }

  const handleClearFilters = () => {
    onFilterChange({
      types: [],
      statuses: [],
      tags: [],
      dateFrom: "",
      dateTo: "",
    })
  }

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.statuses.length > 0 ||
    filters.tags.length > 0 ||
    filters.dateFrom ||
    filters.dateTo

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Evidence Type Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Evidence Type</Label>
        <div className="space-y-2">
          {evidenceTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.types.includes(type)}
                onCheckedChange={() => handleTypeToggle(type)}
              />
              <label
                htmlFor={`type-${type}`}
                className="text-sm font-normal capitalize cursor-pointer"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Status</Label>
        <div className="space-y-2">
          {evidenceStatuses.map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={filters.statuses.includes(status)}
                onCheckedChange={() => handleStatusToggle(status)}
              />
              <label
                htmlFor={`status-${status}`}
                className="text-sm font-normal capitalize cursor-pointer"
              >
                {status}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Tags</Label>
        <Select value={selectedTag} onValueChange={handleAddTag}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a tag..." />
          </SelectTrigger>
          <SelectContent>
            {availableTags
              .filter((tag) => !filters.tags.includes(tag))
              .map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filters.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="pr-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Publication Date</Label>
        <div className="space-y-2">
          <div>
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id="date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                onFilterChange({ ...filters, dateFrom: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                onFilterChange({ ...filters, dateTo: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
