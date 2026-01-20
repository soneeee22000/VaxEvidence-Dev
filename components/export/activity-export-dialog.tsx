"use client"

import { useState } from "react"
import { Loader2, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

// =============================================================================
// ACTIVITY EXPORT DIALOG COMPONENT
// =============================================================================
// Modal for exporting activity logs with date range filters
// =============================================================================

interface ActivityExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  format: 'csv' | 'pdf'
}

export function ActivityExportDialog({
  open,
  onOpenChange,
  format,
}: ActivityExportDialogProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const endpoint = format === 'csv'
        ? '/api/export/activity/csv'
        : '/api/export/activity/pdf'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const fromStr = fromDate ? fromDate : 'all'
      const toStr = toDate ? toDate : 'all'
      const extension = format === 'csv' ? 'csv' : 'pdf'
      a.download = `activity-log-${fromStr}-to-${toStr}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Export successful',
        description: `Activity log exported as ${format.toUpperCase()}`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to generate export',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            Export Activity Log as {format.toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Export activity logs with optional date range filtering
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="from-date" className="text-sm font-medium">
              From Date (optional)
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-date" className="text-sm font-medium">
              To Date (optional)
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Leave dates empty to export all activity logs. 
            {format === 'pdf' && ' PDF exports are limited to 500 entries.'}
            {format === 'csv' && ' CSV exports can include up to 1000 entries.'}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExporting ? 'Generating...' : `Export ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
