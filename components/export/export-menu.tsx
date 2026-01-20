"use client"

import { useState } from "react"
import { Download, FileText, FileType, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExportDialog } from "./export-dialog"
import { BibliographyDialog } from "./bibliography-dialog"

// =============================================================================
// EXPORT MENU COMPONENT
// =============================================================================
// Dropdown menu for protocol export options
// =============================================================================

interface ExportMenuProps {
  protocolId: string
  protocolTitle: string
  hasEvidence?: boolean
}

export function ExportMenu({ protocolId, protocolTitle, hasEvidence = false }: ExportMenuProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'word'>('pdf')
  const [bibliographyDialogOpen, setBibliographyDialogOpen] = useState(false)

  const handleExportClick = (format: 'pdf' | 'word') => {
    setExportFormat(format)
    setExportDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleExportClick('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExportClick('word')}>
            <FileType className="mr-2 h-4 w-4" />
            Export as Word
          </DropdownMenuItem>
          {hasEvidence && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setBibliographyDialogOpen(true)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Export Bibliography
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        protocolId={protocolId}
        protocolTitle={protocolTitle}
        format={exportFormat}
      />

      <BibliographyDialog
        open={bibliographyDialogOpen}
        onOpenChange={setBibliographyDialogOpen}
        protocolId={protocolId}
      />
    </>
  )
}
