import { z } from "zod"

// =============================================================================
// DATASET VALIDATORS & TYPES
// =============================================================================

/**
 * Dataset types
 */
export const datasetTypes = [
  "clinical_trial",
  "surveillance",
  "safety",
  "efficacy",
  "other",
] as const

export type DatasetType = (typeof datasetTypes)[number]

/**
 * Dataset status
 */
export const datasetStatuses = ["draft", "validated", "archived"] as const

export type DatasetStatus = (typeof datasetStatuses)[number]

/**
 * File types
 */
export const fileTypes = ["csv", "xlsx", "json", "txt"] as const

export type FileType = (typeof fileTypes)[number]

/**
 * Max file size: 100MB in bytes
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

/**
 * Allowed file extensions
 */
export const ALLOWED_FILE_EXTENSIONS = [".csv", ".xlsx", ".xls", ".json", ".txt"]

/**
 * Base dataset schema
 */
export const datasetSchema = z.object({
  name: z
    .string()
    .min(1, "Dataset name is required")
    .max(200, "Dataset name must be less than 200 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be less than 2000 characters"),
  dataset_type: z.enum(datasetTypes, {
    required_error: "Dataset type is required",
  }),
  tags: z.array(z.string()).default([]),
  date_range_start: z.string().optional(),
  date_range_end: z.string().optional(),
  status: z.enum(datasetStatuses).default("draft"),
})

/**
 * Dataset creation schema (with file info)
 */
export const datasetCreateSchema = datasetSchema.extend({
  file_name: z.string().min(1, "File name is required"),
  file_size: z.number().positive("File size must be positive"),
  file_type: z.enum(fileTypes),
  storage_path: z.string().min(1, "Storage path is required"),
  row_count: z.number().int().positive().optional(),
  column_count: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Dataset update schema (partial)
 */
export const datasetUpdateSchema = datasetSchema.partial()

/**
 * Dataset link schema
 */
export const datasetLinkSchema = z.object({
  protocol_id: z.string().uuid("Invalid protocol ID"),
  dataset_id: z.string().uuid("Invalid dataset ID"),
  note: z.string().max(500, "Note must be less than 500 characters").optional(),
})

/**
 * File validation schema
 */
export const fileValidationSchema = z.object({
  name: z.string(),
  size: z
    .number()
    .max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  type: z.string().refine(
    (type) => {
      const extension = "." + type.split("/").pop()
      return ALLOWED_FILE_EXTENSIONS.includes(extension)
    },
    {
      message: `File type must be one of: ${ALLOWED_FILE_EXTENSIONS.join(", ")}`,
    }
  ),
})

/**
 * TypeScript types derived from schemas
 */
export type DatasetFormValues = z.infer<typeof datasetSchema>
export type DatasetCreateValues = z.infer<typeof datasetCreateSchema>
export type DatasetUpdateValues = z.infer<typeof datasetUpdateSchema>
export type DatasetLinkValues = z.infer<typeof datasetLinkSchema>
export type FileValidation = z.infer<typeof fileValidationSchema>

/**
 * Full dataset interface (from database)
 */
export interface Dataset {
  id: string
  user_id: string
  name: string
  description: string
  dataset_type: DatasetType
  file_name: string
  file_size: number
  file_type: FileType
  storage_path: string
  row_count: number | null
  column_count: number | null
  date_range_start: string | null
  date_range_end: string | null
  tags: string[]
  status: DatasetStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * Dataset link interface
 */
export interface DatasetLink {
  id: string
  protocol_id: string
  dataset_id: string
  note: string | null
  linked_at: string
}

/**
 * Suggested tags for datasets
 */
export const suggestedDatasetTags = [
  // Vaccine types
  "COVID-19",
  "influenza",
  "HPV",
  "measles",
  "pneumococcal",
  "hepatitis",
  "mRNA vaccine",
  "viral vector",
  "inactivated vaccine",
  
  // Study types
  "RCT",
  "Phase 1",
  "Phase 2",
  "Phase 3",
  "Phase 4",
  "observational study",
  "case-control",
  "cohort study",
  "real-world evidence",
  "test-negative design",
  
  // Data types
  "efficacy",
  "effectiveness",
  "safety",
  "immunogenicity",
  "surveillance",
  "adverse events",
  "coverage",
  "breakthrough infections",
  
  // Outcomes
  "hospitalization",
  "mortality",
  "antibody titers",
  "seroconversion",
  "viral load",
  "symptom severity",
  
  // Safety signals
  "myocarditis",
  "anaphylaxis",
  "thrombosis",
  "Guillain-Barré syndrome",
  
  // Populations
  "adults",
  "children",
  "pediatric",
  "adolescents",
  "elderly",
  "pregnancy",
  "immunocompromised",
  "young adults",
  
  // Data sources
  "VAERS",
  "VSD",
  "clinical trial",
  "EHR data",
  "claims data",
  "laboratory data",
  "registry data",
] as const

/**
 * Helper function to validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
    }
  }

  // Check file extension
  const extension = "." + file.name.split(".").pop()?.toLowerCase()
  if (!extension || !ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File type "${extension}" is not allowed. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(", ")}`,
    }
  }

  return { valid: true }
}

/**
 * Helper function to get file type from file name
 */
export function getFileType(fileName: string): FileType | null {
  const extension = fileName.split(".").pop()?.toLowerCase()
  
  if (extension === "csv") return "csv"
  if (extension === "xlsx" || extension === "xls") return "xlsx"
  if (extension === "json") return "json"
  if (extension === "txt") return "txt"
  
  return null
}

/**
 * Helper function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/**
 * Helper function to get dataset type display name
 */
export function getDatasetTypeLabel(type: DatasetType): string {
  const labels: Record<DatasetType, string> = {
    clinical_trial: "Clinical Trial",
    surveillance: "Surveillance",
    safety: "Safety",
    efficacy: "Efficacy",
    other: "Other",
  }
  
  return labels[type]
}

/**
 * Helper function to get dataset type color
 */
export function getDatasetTypeColor(type: DatasetType): string {
  const colors: Record<DatasetType, string> = {
    clinical_trial: "blue",
    surveillance: "purple",
    safety: "orange",
    efficacy: "green",
    other: "gray",
  }
  
  return colors[type]
}
