"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// =============================================================================
// WORKSPACE EXPORT BUTTON COMPONENT
// =============================================================================
// Button and dialog for exporting entire workspace
// =============================================================================

export function WorkspaceExportButton() {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState<'zip' | 'json'>('zip')

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const response = await fetch('/api/export/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
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
      
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = format === 'zip'
        ? `vaxevidence-workspace-${dateStr}.zip`
        : `vaxevidence-export-${dateStr}.zip`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Export successful',
        description: 'Workspace data exported successfully',
      })

      setIsOpen(false)
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Export Workspace</DialogTitle>
          <DialogDescription>
            Export all your protocols, evidence, and datasets as an archive
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label className="text-sm font-medium">Export Format:</Label>
          <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="zip" id="format-zip" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="format-zip" className="font-normal cursor-pointer">
                  <div className="font-medium">Complete Archive (ZIP)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Includes PDFs for all protocols, CSV exports, and JSON data
                  </div>
                </Label>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="json" id="format-json" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="format-json" className="font-normal cursor-pointer">
                  <div className="font-medium">Data Only (ZIP with JSON)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Lightweight export with just your data in JSON format
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Note:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Large workspaces may take a minute to export</li>
              <li>The complete archive includes PDFs for all protocols</li>
              <li>JSON exports are smaller and faster</li>
              <li>All exports include complete data for re-import</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExporting ? 'Exporting...' : 'Export Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
