"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Search } from "lucide-react"
import { exportToCSV } from "@/lib/utils/file-parser"

interface DataPreviewProps {
  data: Record<string, unknown>[]
  columns: string[]
  maxRows?: number
}

export function DataPreview({ data, columns, maxRows = 50 }: DataPreviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 25

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data

    const query = searchQuery.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    )
  }, [data, searchQuery])

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredData.slice(start, Math.min(end, maxRows))
  }, [filteredData, currentPage, maxRows])

  const totalPages = Math.ceil(
    Math.min(filteredData.length, maxRows) / rowsPerPage
  )

  const handleExport = () => {
    const exportData = filteredData.slice(0, maxRows)
    exportToCSV(exportData, `data-export-${Date.now()}.csv`)
  }

  return (
    <div className="space-y-4">
      {/* Search and Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search in data..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export ({Math.min(filteredData.length, maxRows)} rows)
        </Button>
      </div>

      {/* Data Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {paginatedData.length} of{" "}
          {Math.min(filteredData.length, maxRows)} rows
        </span>
        {data.length > maxRows && (
          <Badge variant="secondary" className="text-xs">
            Preview limited to {maxRows} rows
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-auto max-h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12 text-xs">#</TableHead>
              {columns.map((column) => (
                <TableHead key={column} className="text-xs whitespace-nowrap">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No matching rows found" : "No data to display"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="text-xs text-muted-foreground">
                    {(currentPage - 1) * rowsPerPage + rowIndex + 1}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column} className="text-xs max-w-xs truncate">
                      {row[column] != null ? String(row[column]) : "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
