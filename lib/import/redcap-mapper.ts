// =============================================================================
// REDCAP → VAXEVIDENCE DATASET MAPPER
// =============================================================================
// Maps REDCap records and metadata to VaxEvidence dataset schema.
// Provides auto-detection of field types and configurable field mapping.
// =============================================================================

import type { REDCapField, REDCapRecord } from "@/lib/api/redcap";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Configuration for mapping REDCap fields to VaxEvidence columns. */
export interface REDCapMappingConfig {
  /** REDCap field name → VaxEvidence column name. */
  fieldMap: Record<string, string>;
  /** REDCap field names that contain date values. */
  dateFields: string[];
  /** REDCap field names that contain numeric values. */
  numericFields: string[];
}

/** Result of mapping REDCap records to a tabular dataset. */
interface MappedDataset {
  columns: string[];
  rows: string[][];
}

/** Metadata describing the imported dataset. */
interface DatasetMetadata {
  name: string;
  description: string;
  dataset_type: string;
  row_count: number;
  column_count: number;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** REDCap field types that typically contain date values. */
const DATE_FIELD_TYPES = new Set([
  "text_date",
  "text_datetime",
  "text_datetime_seconds",
]);

/** REDCap validation patterns that indicate date fields. */
const DATE_VALIDATION_PATTERNS = ["date_", "datetime_"];

/** REDCap field types that typically contain numeric values. */
const NUMERIC_FIELD_TYPES = new Set(["calc", "slider"]);

/** REDCap validation patterns that indicate numeric fields. */
const NUMERIC_VALIDATION_PATTERNS = ["number", "integer", "float"];

/** Common REDCap field names and their VaxEvidence equivalents. */
const KNOWN_FIELD_MAPPINGS: Record<string, string> = {
  record_id: "participant_id",
  subject_id: "participant_id",
  participant_id: "participant_id",
  study_id: "study_id",
  enrollment_date: "enrollment_date",
  enroll_date: "enrollment_date",
  dob: "date_of_birth",
  date_of_birth: "date_of_birth",
  sex: "sex",
  gender: "gender",
  age: "age",
  site: "site",
  study_site: "site",
  vaccine_date: "vaccination_date",
  vax_date: "vaccination_date",
  vaccination_date: "vaccination_date",
  adverse_event: "adverse_event",
  ae_description: "adverse_event_description",
  ae_date: "adverse_event_date",
  ae_grade: "adverse_event_grade",
  outcome: "outcome",
  status: "status",
};

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

/**
 * Auto-detect a reasonable field mapping from REDCap metadata.
 * Uses field types, validation patterns, and known field name heuristics.
 */
export function autoDetectMapping(
  metadata: REDCapField[],
): REDCapMappingConfig {
  const fieldMap: Record<string, string> = {};
  const dateFields: string[] = [];
  const numericFields: string[] = [];

  for (const field of metadata) {
    const name = field.field_name;

    /* Detect date fields by type or validation pattern. */
    const isDate =
      DATE_FIELD_TYPES.has(field.field_type) ||
      DATE_VALIDATION_PATTERNS.some((p) =>
        field.select_choices_or_calculations.includes(p),
      ) ||
      name.toLowerCase().includes("date");

    if (isDate) {
      dateFields.push(name);
    }

    /* Detect numeric fields by type or validation pattern. */
    const isNumeric =
      NUMERIC_FIELD_TYPES.has(field.field_type) ||
      NUMERIC_VALIDATION_PATTERNS.some((p) =>
        field.select_choices_or_calculations.includes(p),
      );

    if (isNumeric) {
      numericFields.push(name);
    }

    /* Map to known VaxEvidence column names when possible. */
    const knownMapping = KNOWN_FIELD_MAPPINGS[name.toLowerCase()];
    if (knownMapping) {
      fieldMap[name] = knownMapping;
    } else {
      /* Default: use the REDCap field name as-is, snake_case preserved. */
      fieldMap[name] = name;
    }
  }

  return { fieldMap, dateFields, numericFields };
}

/**
 * Map REDCap records to a flat tabular dataset using the provided mapping.
 * Returns column headers and string[][] rows suitable for CSV/dataset storage.
 */
export function mapREDCapToDataset(
  records: REDCapRecord[],
  config: REDCapMappingConfig,
): MappedDataset {
  if (records.length === 0) {
    return { columns: Object.values(config.fieldMap), rows: [] };
  }

  /* Build ordered column list from the field map values. */
  const redcapFields = Object.keys(config.fieldMap);
  const columns = redcapFields.map((f) => config.fieldMap[f]);

  const rows: string[][] = records.map((record) =>
    redcapFields.map((field) => {
      const raw = record[field] ?? "";

      /* Format date fields to ISO date string. */
      if (config.dateFields.includes(field) && raw) {
        const parsed = new Date(raw);
        return isNaN(parsed.getTime())
          ? raw
          : parsed.toISOString().split("T")[0];
      }

      /* Validate numeric fields — pass through if valid, keep raw otherwise. */
      if (config.numericFields.includes(field) && raw) {
        const num = Number(raw);
        return isNaN(num) ? raw : String(num);
      }

      return raw;
    }),
  );

  return { columns, rows };
}

/**
 * Generate dataset metadata from REDCap records for the datasets table.
 */
export function generateDatasetMetadata(
  records: REDCapRecord[],
  projectName: string,
): DatasetMetadata {
  const columnCount = records.length > 0 ? Object.keys(records[0]).length : 0;

  return {
    name: `REDCap Import: ${projectName}`,
    description: `Imported from REDCap project "${projectName}" on ${new Date().toISOString().split("T")[0]}. Contains ${records.length} records across ${columnCount} fields.`,
    dataset_type: "clinical",
    row_count: records.length,
    column_count: columnCount,
  };
}
