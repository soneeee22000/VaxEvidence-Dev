"use client"

import { useCallback, useState } from "react"
import { validateFile, formatFileSize } from "@/lib/validators/dataset"
import { Upload, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  selectedFile: File | null
  uploadProgress?: number
  disabled?: boolean
}

export function UploadDropzone({
  onFileSelect,
  onFileRemove,
  selectedFile,
  uploadProgress,
  disabled = false,
}: UploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      setError(null)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        const file = files[0]
        const validation = validateFile(file)

        if (!validation.valid) {
          setError(validation.error || "Invalid file")
          return
        }

        onFileSelect(file)
      }
    },
    [disabled, onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null)

      const files = e.target.files
      if (files && files.length > 0) {
        const file = files[0]
        const validation = validateFile(file)

        if (!validation.valid) {
          setError(validation.error || "Invalid file")
          return
        }

        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8
            transition-colors cursor-pointer
            ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileInput}
            accept=".csv,.xlsx,.xls,.json,.txt"
            disabled={disabled}
          />

          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drop your dataset file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports CSV, Excel, JSON, TXT (max 100MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="rounded bg-background p-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
                {uploadProgress !== undefined && uploadProgress < 100 && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress} className="h-1" />
                    <p className="text-xs text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            {!uploadProgress && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
