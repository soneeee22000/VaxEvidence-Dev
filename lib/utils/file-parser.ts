// =============================================================================
// FILE PARSING UTILITIES
// =============================================================================
// Client-side file parsing for CSV, Excel, and JSON files
// =============================================================================

import Papa from "papaparse";
import ExcelJS from "exceljs";

/**
 * Parsed data result
 */
export interface ParsedData {
  data: Record<string, unknown>[];
  rowCount: number;
  columnCount: number;
  columns: string[];
  error?: string;
}

/**
 * Column type information
 */
export interface ColumnType {
  name: string;
  type: "string" | "number" | "date" | "boolean" | "unknown";
  sampleValues: unknown[];
}

/**
 * Summary statistics for numeric columns
 */
export interface SummaryStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  count: number;
}

/**
 * Parse CSV file to array of objects
 */
export async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, unknown>[];
        const columns = results.meta.fields || [];

        resolve({
          data,
          rowCount: data.length,
          columnCount: columns.length,
          columns,
          error:
            results.errors.length > 0 ? results.errors[0].message : undefined,
        });
      },
      error: (error) => {
        resolve({
          data: [],
          rowCount: 0,
          columnCount: 0,
          columns: [],
          error: error.message,
        });
      },
    });
  });
}

/**
 * Parse Excel file to array of objects
 * Uses the first sheet by default
 */
export async function parseExcel(file: File): Promise<ParsedData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Get first sheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount === 0) {
      return {
        data: [],
        rowCount: 0,
        columnCount: 0,
        columns: [],
        error: worksheet ? "Sheet is empty" : "No sheets found in Excel file",
      };
    }

    // Extract header row (row 1)
    const headerRow = worksheet.getRow(1);
    const columns: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      columns[colNumber - 1] = String(cell.value ?? `Column${colNumber}`);
    });

    if (columns.length === 0) {
      return {
        data: [],
        rowCount: 0,
        columnCount: 0,
        columns: [],
        error: "Sheet is empty",
      };
    }

    // Extract data rows (row 2 onwards)
    const data: Record<string, unknown>[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const record: Record<string, unknown> = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colName = columns[colNumber - 1];
        if (colName) {
          record[colName] = cell.value;
        }
      });
      data.push(record);
    });

    return {
      data,
      rowCount: data.length,
      columnCount: columns.length,
      columns,
    };
  } catch (error) {
    return {
      data: [],
      rowCount: 0,
      columnCount: 0,
      columns: [],
      error:
        error instanceof Error ? error.message : "Failed to parse Excel file",
    };
  }
}

/**
 * Parse JSON file
 * Expects an array of objects
 */
export async function parseJSON(file: File): Promise<ParsedData> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      return {
        data: [],
        rowCount: 0,
        columnCount: 0,
        columns: [],
        error: "JSON must be an array of objects",
      };
    }

    const data = parsed as Record<string, unknown>[];

    if (data.length === 0) {
      return {
        data: [],
        rowCount: 0,
        columnCount: 0,
        columns: [],
      };
    }

    const columns =
      typeof data[0] === "object" && data[0] !== null
        ? Object.keys(data[0])
        : [];

    return {
      data,
      rowCount: data.length,
      columnCount: columns.length,
      columns,
    };
  } catch (error) {
    return {
      data: [],
      rowCount: 0,
      columnCount: 0,
      columns: [],
      error:
        error instanceof Error ? error.message : "Failed to parse JSON file",
    };
  }
}

/**
 * Parse file based on file type
 */
export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCSV(file);
  }

  if (extension === "xlsx" || extension === "xls") {
    return parseExcel(file);
  }

  if (extension === "json") {
    return parseJSON(file);
  }

  return {
    data: [],
    rowCount: 0,
    columnCount: 0,
    columns: [],
    error: "Unsupported file type",
  };
}

/**
 * Infer column types from data
 * Samples first 100 rows to determine type
 */
export function inferColumnTypes(
  data: Record<string, unknown>[],
  maxSamples = 100,
): ColumnType[] {
  if (data.length === 0) return [];

  const columns = Object.keys(data[0]);
  const sampleSize = Math.min(data.length, maxSamples);
  const samples = data.slice(0, sampleSize);

  return columns.map((columnName) => {
    const values = samples
      .map((row) => row[columnName])
      .filter((v) => v != null);
    const sampleValues = values.slice(0, 5); // First 5 non-null values

    if (values.length === 0) {
      return {
        name: columnName,
        type: "unknown" as const,
        sampleValues: [],
      };
    }

    // Check if all values are numbers
    const allNumbers = values.every(
      (v) => typeof v === "number" || !isNaN(Number(v)),
    );
    if (allNumbers) {
      return {
        name: columnName,
        type: "number" as const,
        sampleValues,
      };
    }

    // Check if all values are booleans
    const allBooleans = values.every(
      (v) => typeof v === "boolean" || v === "true" || v === "false",
    );
    if (allBooleans) {
      return {
        name: columnName,
        type: "boolean" as const,
        sampleValues,
      };
    }

    // Check if values look like dates
    const allDates = values.every((v) => {
      const dateValue = new Date(String(v));
      return !isNaN(dateValue.getTime());
    });
    if (allDates) {
      return {
        name: columnName,
        type: "date" as const,
        sampleValues,
      };
    }

    // Default to string
    return {
      name: columnName,
      type: "string" as const,
      sampleValues,
    };
  });
}

/**
 * Generate summary statistics for a numeric column
 */
export function generateSummaryStats(
  data: Record<string, unknown>[],
  columnName: string,
): SummaryStats | null {
  const values = data
    .map((row) => row[columnName])
    .filter((v) => v != null)
    .map((v) => Number(v))
    .filter((v) => !isNaN(v));

  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  const median =
    values.length % 2 === 0
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)];

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    count: values.length,
  };
}

/**
 * Get unique values for a column (useful for categorical data)
 * Limits to first 100 unique values
 */
export function getUniqueValues(
  data: Record<string, unknown>[],
  columnName: string,
  limit = 100,
): unknown[] {
  const values = data.map((row) => row[columnName]).filter((v) => v != null);
  const unique = Array.from(new Set(values));
  return unique.slice(0, limit);
}

/**
 * Get frequency distribution for categorical column
 */
export function getFrequencyDistribution(
  data: Record<string, unknown>[],
  columnName: string,
  topN = 10,
): Array<{ value: unknown; count: number }> {
  const values = data.map((row) => row[columnName]).filter((v) => v != null);

  const frequency = values.reduce(
    (acc: Record<string, number>, val) => {
      const key = String(val);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(frequency)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Export data to CSV
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
): void {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
