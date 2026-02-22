import { describe, it, expect, vi, afterEach } from "vitest";
import {
  autoDetectMapping,
  mapREDCapToDataset,
  generateDatasetMetadata,
  type REDCapMappingConfig,
} from "@/lib/import/redcap-mapper";
import type { REDCapField, REDCapRecord } from "@/lib/api/redcap";

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/** Create a minimal REDCapField for testing. */
function makeField(
  overrides: Partial<REDCapField> & { field_name: string },
): REDCapField {
  return {
    form_name: "default_form",
    field_type: "text",
    field_label: overrides.field_name,
    field_note: "",
    select_choices_or_calculations: "",
    ...overrides,
  };
}

/** Create a simple mapping config for testing mapREDCapToDataset. */
function makeConfig(
  overrides: Partial<REDCapMappingConfig> = {},
): REDCapMappingConfig {
  return {
    fieldMap: { record_id: "participant_id", age: "age" },
    dateFields: [],
    numericFields: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// autoDetectMapping
// ---------------------------------------------------------------------------

describe("autoDetectMapping", () => {
  it("maps known REDCap field names to VaxEvidence equivalents", () => {
    const fields = [
      makeField({ field_name: "record_id" }),
      makeField({ field_name: "enrollment_date" }),
      makeField({ field_name: "sex" }),
    ];
    const result = autoDetectMapping(fields);

    expect(result.fieldMap.record_id).toBe("participant_id");
    expect(result.fieldMap.enrollment_date).toBe("enrollment_date");
    expect(result.fieldMap.sex).toBe("sex");
  });

  it("preserves unknown field names as-is", () => {
    const fields = [makeField({ field_name: "custom_measurement" })];
    const result = autoDetectMapping(fields);
    expect(result.fieldMap.custom_measurement).toBe("custom_measurement");
  });

  it("detects date fields by field type", () => {
    const fields = [
      makeField({ field_name: "visit_date", field_type: "text_date" }),
    ];
    const result = autoDetectMapping(fields);
    expect(result.dateFields).toContain("visit_date");
  });

  it("detects date fields by datetime field type", () => {
    const fields = [
      makeField({ field_name: "timestamp", field_type: "text_datetime" }),
    ];
    const result = autoDetectMapping(fields);
    expect(result.dateFields).toContain("timestamp");
  });

  it("detects date fields by name containing 'date'", () => {
    const fields = [makeField({ field_name: "vax_date", field_type: "text" })];
    const result = autoDetectMapping(fields);
    expect(result.dateFields).toContain("vax_date");
  });

  it("detects date fields by validation pattern in select_choices_or_calculations", () => {
    const fields = [
      makeField({
        field_name: "start",
        select_choices_or_calculations: "date_ymd",
      }),
    ];
    const result = autoDetectMapping(fields);
    expect(result.dateFields).toContain("start");
  });

  it("detects numeric fields by calc field type", () => {
    const fields = [makeField({ field_name: "bmi", field_type: "calc" })];
    const result = autoDetectMapping(fields);
    expect(result.numericFields).toContain("bmi");
  });

  it("detects numeric fields by slider field type", () => {
    const fields = [
      makeField({ field_name: "pain_level", field_type: "slider" }),
    ];
    const result = autoDetectMapping(fields);
    expect(result.numericFields).toContain("pain_level");
  });

  it("detects numeric fields by validation pattern", () => {
    const fields = [
      makeField({
        field_name: "weight_kg",
        select_choices_or_calculations: "number",
      }),
    ];
    const result = autoDetectMapping(fields);
    expect(result.numericFields).toContain("weight_kg");
  });

  it("returns empty arrays when no date/numeric fields found", () => {
    const fields = [makeField({ field_name: "notes", field_type: "textarea" })];
    const result = autoDetectMapping(fields);
    expect(result.dateFields).toEqual([]);
    expect(result.numericFields).toEqual([]);
  });

  it("handles empty metadata array", () => {
    const result = autoDetectMapping([]);
    expect(result.fieldMap).toEqual({});
    expect(result.dateFields).toEqual([]);
    expect(result.numericFields).toEqual([]);
  });

  it("maps vaccine-related field names correctly", () => {
    const fields = [
      makeField({ field_name: "vaccine_date" }),
      makeField({ field_name: "adverse_event" }),
      makeField({ field_name: "ae_grade" }),
    ];
    const result = autoDetectMapping(fields);
    expect(result.fieldMap.vaccine_date).toBe("vaccination_date");
    expect(result.fieldMap.adverse_event).toBe("adverse_event");
    expect(result.fieldMap.ae_grade).toBe("adverse_event_grade");
  });

  it("maps subject_id to participant_id", () => {
    const fields = [makeField({ field_name: "subject_id" })];
    const result = autoDetectMapping(fields);
    expect(result.fieldMap.subject_id).toBe("participant_id");
  });
});

// ---------------------------------------------------------------------------
// mapREDCapToDataset
// ---------------------------------------------------------------------------

describe("mapREDCapToDataset", () => {
  it("returns column headers from the field map values", () => {
    const config = makeConfig({
      fieldMap: { record_id: "participant_id", site: "site" },
    });
    const records: REDCapRecord[] = [{ record_id: "1", site: "A" }];

    const result = mapREDCapToDataset(records, config);
    expect(result.columns).toEqual(["participant_id", "site"]);
  });

  it("maps record values to the correct column order", () => {
    const config = makeConfig({
      fieldMap: { record_id: "participant_id", age: "age" },
    });
    const records: REDCapRecord[] = [{ record_id: "101", age: "35" }];

    const result = mapREDCapToDataset(records, config);
    expect(result.rows).toEqual([["101", "35"]]);
  });

  it("handles empty records array", () => {
    const config = makeConfig({
      fieldMap: { record_id: "participant_id", age: "age" },
    });
    const result = mapREDCapToDataset([], config);

    expect(result.columns).toEqual(["participant_id", "age"]);
    expect(result.rows).toEqual([]);
  });

  it("uses empty string for missing record fields", () => {
    const config = makeConfig({
      fieldMap: { record_id: "participant_id", missing_field: "missing" },
    });
    const records: REDCapRecord[] = [{ record_id: "1" }];

    const result = mapREDCapToDataset(records, config);
    expect(result.rows[0]).toEqual(["1", ""]);
  });

  it("formats date fields to ISO date string", () => {
    const config = makeConfig({
      fieldMap: { enroll_date: "enrollment_date" },
      dateFields: ["enroll_date"],
    });
    const records: REDCapRecord[] = [{ enroll_date: "2024-06-15" }];

    const result = mapREDCapToDataset(records, config);
    expect(result.rows[0][0]).toBe("2024-06-15");
  });

  it("keeps raw value for unparsable date fields", () => {
    const config = makeConfig({
      fieldMap: { bad_date: "date" },
      dateFields: ["bad_date"],
    });
    const records: REDCapRecord[] = [{ bad_date: "not-a-date" }];

    const result = mapREDCapToDataset(records, config);
    expect(result.rows[0][0]).toBe("not-a-date");
  });

  it("validates and passes through valid numeric fields", () => {
    const config = makeConfig({
      fieldMap: { weight: "weight" },
      numericFields: ["weight"],
    });
    const records: REDCapRecord[] = [{ weight: "72.5" }];

    const result = mapREDCapToDataset(records, config);
    expect(result.rows[0][0]).toBe("72.5");
  });

  it("keeps raw value for non-numeric values in numeric fields", () => {
    const config = makeConfig({
      fieldMap: { weight: "weight" },
      numericFields: ["weight"],
    });
    const records: REDCapRecord[] = [{ weight: "N/A" }];

    const result = mapREDCapToDataset(records, config);
    expect(result.rows[0][0]).toBe("N/A");
  });

  it("handles multiple records correctly", () => {
    const config = makeConfig({
      fieldMap: { record_id: "participant_id", age: "age" },
    });
    const records: REDCapRecord[] = [
      { record_id: "1", age: "25" },
      { record_id: "2", age: "30" },
      { record_id: "3", age: "45" },
    ];

    const result = mapREDCapToDataset(records, config);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual(["1", "25"]);
    expect(result.rows[2]).toEqual(["3", "45"]);
  });

  it("does not format empty date fields", () => {
    const config = makeConfig({
      fieldMap: { visit_date: "date" },
      dateFields: ["visit_date"],
    });
    const records: REDCapRecord[] = [{ visit_date: "" }];

    const result = mapREDCapToDataset(records, config);
    expect(result.rows[0][0]).toBe("");
  });

  it("does not validate empty numeric fields", () => {
    const config = makeConfig({
      fieldMap: { score: "score" },
      numericFields: ["score"],
    });
    const records: REDCapRecord[] = [{ score: "" }];

    const result = mapREDCapToDataset(records, config);
    expect(result.rows[0][0]).toBe("");
  });
});

// ---------------------------------------------------------------------------
// generateDatasetMetadata
// ---------------------------------------------------------------------------

describe("generateDatasetMetadata", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates a name with the project name", () => {
    const records: REDCapRecord[] = [{ record_id: "1", age: "25" }];
    const meta = generateDatasetMetadata(records, "COVID Vaccine Trial");

    expect(meta.name).toBe("REDCap Import: COVID Vaccine Trial");
  });

  it("sets dataset_type to clinical", () => {
    const meta = generateDatasetMetadata([], "Test");
    expect(meta.dataset_type).toBe("clinical");
  });

  it("counts rows correctly", () => {
    const records: REDCapRecord[] = [
      { record_id: "1" },
      { record_id: "2" },
      { record_id: "3" },
    ];
    const meta = generateDatasetMetadata(records, "Test");
    expect(meta.row_count).toBe(3);
  });

  it("counts columns from the first record", () => {
    const records: REDCapRecord[] = [{ record_id: "1", age: "25", sex: "M" }];
    const meta = generateDatasetMetadata(records, "Test");
    expect(meta.column_count).toBe(3);
  });

  it("returns zero columns for empty records", () => {
    const meta = generateDatasetMetadata([], "Empty Project");
    expect(meta.column_count).toBe(0);
    expect(meta.row_count).toBe(0);
  });

  it("includes today's date in the description", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-22T12:00:00Z"));

    const records: REDCapRecord[] = [{ record_id: "1" }];
    const meta = generateDatasetMetadata(records, "My Project");

    expect(meta.description).toContain("2026-02-22");
    expect(meta.description).toContain("My Project");
    expect(meta.description).toContain("1 records");
  });

  it("includes record and field counts in the description", () => {
    const records: REDCapRecord[] = [
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ];
    const meta = generateDatasetMetadata(records, "Trial");

    expect(meta.description).toContain("2 records");
    expect(meta.description).toContain("3 fields");
  });
});
