import { describe, it, expect } from "vitest";
import {
  datasetSchema,
  datasetCreateSchema,
  datasetUpdateSchema,
  datasetLinkSchema,
  fileValidationSchema,
  getFileType,
  formatFileSize,
  getDatasetTypeLabel,
  getDatasetTypeColor,
  MAX_FILE_SIZE,
  datasetTypes,
  datasetStatuses,
} from "@/lib/validators/dataset";

describe("datasetSchema", () => {
  const validDataset = {
    name: "VAERS 2024 Adverse Events",
    description: "Vaccine adverse event reporting system data for analysis",
    dataset_type: "clinical_trial" as const,
    tags: ["VAERS", "safety"],
  };

  it("accepts valid dataset", () => {
    const result = datasetSchema.safeParse(validDataset);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = datasetSchema.safeParse({ ...validDataset, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 characters", () => {
    const result = datasetSchema.safeParse({
      ...validDataset,
      name: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description under 10 characters", () => {
    const result = datasetSchema.safeParse({
      ...validDataset,
      description: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 characters", () => {
    const result = datasetSchema.safeParse({
      ...validDataset,
      description: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid dataset types", () => {
    for (const type of datasetTypes) {
      const result = datasetSchema.safeParse({
        ...validDataset,
        dataset_type: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid dataset type", () => {
    const result = datasetSchema.safeParse({
      ...validDataset,
      dataset_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("defaults tags to empty array", () => {
    const { tags, ...noTags } = validDataset;
    const result = datasetSchema.safeParse(noTags);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it("defaults status to draft", () => {
    const result = datasetSchema.safeParse(validDataset);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("draft");
    }
  });

  it("accepts all valid statuses", () => {
    for (const status of datasetStatuses) {
      const result = datasetSchema.safeParse({ ...validDataset, status });
      expect(result.success).toBe(true);
    }
  });
});

describe("datasetCreateSchema", () => {
  const validCreate = {
    name: "Trial Data",
    description: "Clinical trial data for Phase 3 study",
    dataset_type: "clinical_trial" as const,
    file_name: "trial-data.csv",
    file_size: 1024,
    file_type: "csv" as const,
    storage_path: "datasets/user123/trial-data.csv",
  };

  it("accepts valid create data", () => {
    const result = datasetCreateSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it("requires file_name", () => {
    const { file_name, ...noFileName } = validCreate;
    const result = datasetCreateSchema.safeParse(noFileName);
    expect(result.success).toBe(false);
  });

  it("requires positive file_size", () => {
    const result = datasetCreateSchema.safeParse({
      ...validCreate,
      file_size: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("datasetUpdateSchema", () => {
  it("accepts partial updates", () => {
    const result = datasetUpdateSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = datasetUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("datasetLinkSchema", () => {
  it("accepts valid UUIDs", () => {
    const result = datasetLinkSchema.safeParse({
      protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      dataset_id: "660e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID protocol_id", () => {
    const result = datasetLinkSchema.safeParse({
      protocol_id: "not-uuid",
      dataset_id: "660e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects note over 500 characters", () => {
    const result = datasetLinkSchema.safeParse({
      protocol_id: "550e8400-e29b-41d4-a716-446655440000",
      dataset_id: "660e8400-e29b-41d4-a716-446655440001",
      note: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("fileValidationSchema", () => {
  it("accepts valid file", () => {
    const result = fileValidationSchema.safeParse({
      name: "data.csv",
      size: 1024,
      type: "text/csv",
    });
    expect(result.success).toBe(true);
  });

  it("rejects file exceeding max size", () => {
    const result = fileValidationSchema.safeParse({
      name: "huge.csv",
      size: MAX_FILE_SIZE + 1,
      type: "text/csv",
    });
    expect(result.success).toBe(false);
  });
});

describe("getFileType", () => {
  it("returns csv for .csv files", () => {
    expect(getFileType("data.csv")).toBe("csv");
  });

  it("returns xlsx for .xlsx files", () => {
    expect(getFileType("data.xlsx")).toBe("xlsx");
  });

  it("returns xlsx for .xls files", () => {
    expect(getFileType("data.xls")).toBe("xlsx");
  });

  it("returns json for .json files", () => {
    expect(getFileType("data.json")).toBe("json");
  });

  it("returns txt for .txt files", () => {
    expect(getFileType("data.txt")).toBe("txt");
  });

  it("returns null for unsupported extensions", () => {
    expect(getFileType("data.pdf")).toBeNull();
  });
});

describe("formatFileSize", () => {
  it("formats 0 bytes", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
  });

  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 Bytes");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1 MB");
  });
});

describe("getDatasetTypeLabel", () => {
  it("returns correct label for each type", () => {
    expect(getDatasetTypeLabel("clinical_trial")).toBe("Clinical Trial");
    expect(getDatasetTypeLabel("surveillance")).toBe("Surveillance");
    expect(getDatasetTypeLabel("safety")).toBe("Safety");
    expect(getDatasetTypeLabel("efficacy")).toBe("Efficacy");
    expect(getDatasetTypeLabel("other")).toBe("Other");
  });
});

describe("getDatasetTypeColor", () => {
  it("returns a color for each type", () => {
    for (const type of datasetTypes) {
      expect(getDatasetTypeColor(type)).toBeTruthy();
    }
  });
});
