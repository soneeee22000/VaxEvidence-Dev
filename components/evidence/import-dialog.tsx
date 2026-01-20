"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  metadata?: Array<{ label: string; value?: string | null }>
  confirmLabel?: string
  confirmDisabled?: boolean
  isConfirming?: boolean
  onConfirm?: () => void
  children?: React.ReactNode
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  metadata = [],
  confirmLabel = "Import",
  confirmDisabled,
  isConfirming,
  onConfirm,
  children,
}: ImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          {children}

          {metadata.length > 0 && (
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="space-y-2 text-sm">
                {metadata.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <span className="font-medium text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-foreground">
                      {item.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={onConfirm}
            disabled={confirmDisabled || isConfirming}
          >
            {isConfirming ? "Importing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
