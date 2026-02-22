import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  fetchREDCapMetadata,
  fetchREDCapRecords,
  exportREDCapReport,
  type REDCapField,
  type REDCapRecord,
} from "@/lib/api/redcap";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const API_URL = "https://redcap.example.edu/api/";
const API_TOKEN = "REDCAP_TOKEN_ABC123";

const sampleMetadata: REDCapField[] = [
  {
    field_name: "record_id",
    form_name: "demographics",
    field_type: "text",
    field_label: "Record ID",
    field_note: "",
    select_choices_or_calculations: "",
  },
  {
    field_name: "age",
    form_name: "demographics",
    field_type: "text",
    field_label: "Age",
    field_note: "In years",
    select_choices_or_calculations: "",
  },
];

const sampleRecords: REDCapRecord[] = [
  { record_id: "1", age: "45", sex: "1" },
  { record_id: "2", age: "32", sex: "2" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockOkResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  };
}

function mockErrorResponse(status: number) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({}),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("redcap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // fetchREDCapMetadata
  // =========================================================================

  describe("fetchREDCapMetadata", () => {
    it("sends POST with correct form-encoded body", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleMetadata));

      await fetchREDCapMetadata(API_URL, API_TOKEN);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(API_URL);
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe(
        "application/x-www-form-urlencoded",
      );

      const body = new URLSearchParams(options.body);
      expect(body.get("token")).toBe(API_TOKEN);
      expect(body.get("content")).toBe("metadata");
      expect(body.get("format")).toBe("json");
      expect(body.get("returnFormat")).toBe("json");
    });

    it("returns parsed field metadata array", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleMetadata));

      const result = await fetchREDCapMetadata(API_URL, API_TOKEN);

      expect(result).toHaveLength(2);
      expect(result[0].field_name).toBe("record_id");
      expect(result[1].field_label).toBe("Age");
    });

    it("throws on HTTP failure", async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(403));

      await expect(fetchREDCapMetadata(API_URL, API_TOKEN)).rejects.toThrow(
        "REDCap API request failed: 403",
      );
    });

    it("throws on REDCap logical error (200 with error body)", async () => {
      mockFetch.mockResolvedValue(
        mockOkResponse({ error: "You do not have permissions to use the API" }),
      );

      await expect(fetchREDCapMetadata(API_URL, API_TOKEN)).rejects.toThrow(
        "REDCap error: You do not have permissions to use the API",
      );
    });
  });

  // =========================================================================
  // fetchREDCapRecords
  // =========================================================================

  describe("fetchREDCapRecords", () => {
    it("fetches records with default parameters", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleRecords));

      const result = await fetchREDCapRecords(API_URL, API_TOKEN);

      expect(result).toHaveLength(2);
      expect(result[0].record_id).toBe("1");

      const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      expect(body.get("content")).toBe("record");
      expect(body.get("token")).toBe(API_TOKEN);
    });

    it("includes fields filter when specified", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleRecords));

      await fetchREDCapRecords(API_URL, API_TOKEN, {
        fields: ["record_id", "age"],
      });

      const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      expect(body.get("fields")).toBe("record_id,age");
    });

    it("includes forms filter when specified", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleRecords));

      await fetchREDCapRecords(API_URL, API_TOKEN, {
        forms: ["demographics", "vitals"],
      });

      const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      expect(body.get("forms")).toBe("demographics,vitals");
    });

    it("includes filterLogic when specified", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleRecords));

      await fetchREDCapRecords(API_URL, API_TOKEN, {
        filterLogic: "[age] > 18",
      });

      const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      expect(body.get("filterLogic")).toBe("[age] > 18");
    });

    it("does not include empty fields/forms arrays", async () => {
      mockFetch.mockResolvedValue(mockOkResponse([]));

      await fetchREDCapRecords(API_URL, API_TOKEN, {
        fields: [],
        forms: [],
      });

      const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      expect(body.has("fields")).toBe(false);
      expect(body.has("forms")).toBe(false);
    });

    it("throws on HTTP failure", async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(500));

      await expect(fetchREDCapRecords(API_URL, API_TOKEN)).rejects.toThrow(
        "REDCap API request failed: 500",
      );
    });

    it("throws on REDCap logical error", async () => {
      mockFetch.mockResolvedValue(mockOkResponse({ error: "Invalid token" }));

      await expect(fetchREDCapRecords(API_URL, API_TOKEN)).rejects.toThrow(
        "REDCap error: Invalid token",
      );
    });
  });

  // =========================================================================
  // exportREDCapReport
  // =========================================================================

  describe("exportREDCapReport", () => {
    it("sends correct report_id in form body", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleRecords));

      await exportREDCapReport(API_URL, API_TOKEN, "42");

      const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      expect(body.get("content")).toBe("report");
      expect(body.get("report_id")).toBe("42");
      expect(body.get("token")).toBe(API_TOKEN);
    });

    it("returns parsed records array", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleRecords));

      const result = await exportREDCapReport(API_URL, API_TOKEN, "42");

      expect(result).toHaveLength(2);
    });

    it("throws on HTTP failure", async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(404));

      await expect(
        exportREDCapReport(API_URL, API_TOKEN, "999"),
      ).rejects.toThrow("REDCap API request failed: 404");
    });

    it("throws on REDCap logical error", async () => {
      mockFetch.mockResolvedValue(
        mockOkResponse({ error: "Report does not exist" }),
      );

      await expect(
        exportREDCapReport(API_URL, API_TOKEN, "999"),
      ).rejects.toThrow("REDCap error: Report does not exist");
    });
  });
});
