"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  datasetTypes,
  datasetStatuses,
  fileTypes,
  getDatasetTypeLabel,
  type DatasetType,
  type DatasetStatus,
  type FileType,
} from "@/lib/validators/dataset"
import { X } from "lucide-react"

export interface DatasetFilterState {
  types: DatasetType[]
  fileTypes: FileType[]
  statuses: DatasetStatus[]
  tags: string[]
}

interface DatasetFiltersProps {
  filters: DatasetFilterState
  onFiltersChange: (filters: DatasetFilterState) => void
  availableTags?: string[]
}

export function DatasetFilters({
  filters,
  onFiltersChange,
  availableTags = [],
}: DatasetFiltersProps) {
  const toggleType = (type: DatasetType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type]
    onFiltersChange({ ...filters, types: newTypes })
  }

  const toggleFileType = (fileType: FileType) => {
    const newFileTypes = filters.fileTypes.includes(fileType)
      ? filters.fileTypes.filter((t) => t !== fileType)
      : [...filters.fileTypes, fileType]
    onFiltersChange({ ...filters, fileTypes: newFileTypes })
  }

  const toggleStatus = (status: DatasetStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status]
    onFiltersChange({ ...filters, statuses: newStatuses })
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    onFiltersChange({ ...filters, tags: newTags })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      types: [],
      fileTypes: [],
      statuses: [],
      tags: [],
    })
  }

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.fileTypes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.tags.length > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Dataset Type Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Dataset Type</Label>
        <div className="space-y-2">
          {datasetTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.types.includes(type)}
                onCheckedChange={() => toggleType(type)}
              />
              <label
                htmlFor={`type-${type}`}
                className="text-sm cursor-pointer flex-1"
              >
                {getDatasetTypeLabel(type)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* File Type Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">File Type</Label>
        <div className="space-y-2">
          {fileTypes.map((fileType) => (
            <div key={fileType} className="flex items-center space-x-2">
              <Checkbox
                id={`file-${fileType}`}
                checked={filters.fileTypes.includes(fileType)}
                onCheckedChange={() => toggleFileType(fileType)}
              />
              <label
                htmlFor={`file-${fileType}`}
                className="text-sm cursor-pointer flex-1 uppercase"
              >
                {fileType}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Status</Label>
        <div className="space-y-2">
          {datasetStatuses.map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={filters.statuses.includes(status)}
                onCheckedChange={() => toggleStatus(status)}
              />
              <label
                htmlFor={`status-${status}`}
                className="text-sm cursor-pointer flex-1 capitalize"
              >
                {status}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Tags ({availableTags.length})
            </Label>
            <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={filters.tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
