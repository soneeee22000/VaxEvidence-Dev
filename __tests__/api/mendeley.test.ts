import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  fetchMendeleyFolders,
  fetchMendeleyDocuments,
  createMendeleyDocument,
  mapMendeleyToEvidence,
  mapEvidenceToMendeley,
  type MendeleyDocument,
  type MendeleyFolder,
} from "@/lib/api/mendeley";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACCESS_TOKEN = "mendeley_bearer_token_123";

const sampleDoc: MendeleyDocument = {
  id: "doc-abc-123",
  title: "Vaccine Safety Monitoring",
  type: "journal",
  authors: [
    { first_name: "Alice", last_name: "Chen" },
    { first_name: "Bob", last_name: "Williams" },
  ],
  year: 2024,
  source: "Lancet Infectious Diseases",
  identifiers: { doi: "10.1016/example.2024", pmid: "12345678" },
  abstract: "Comprehensive monitoring of vaccine adverse events.",
  tags: ["pharmacovigilance", "safety"],
  created: "2024-01-15T10:00:00Z",
  last_modified: "2024-03-20T14:30:00Z",
};

const sampleFolder: MendeleyFolder = {
  id: "folder-xyz",
  name: "Phase III Trials",
  parent_id: undefined,
};

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

describe("mendeley", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // fetchMendeleyFolders
  // =========================================================================

  describe("fetchMendeleyFolders", () => {
    it("calls the correct Mendeley API URL with Bearer token", async () => {
      mockFetch.mockResolvedValue(mockOkResponse([sampleFolder]));

      await fetchMendeleyFolders(ACCESS_TOKEN);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("api.mendeley.com/folders");
      expect(options.headers.Authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
      expect(options.headers.Accept).toBe(
        "application/vnd.mendeley-folder.1+json",
      );
    });

    it("returns parsed folders array", async () => {
      mockFetch.mockResolvedValue(mockOkResponse([sampleFolder]));

      const result = await fetchMendeleyFolders(ACCESS_TOKEN);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Phase III Trials");
    });

    it("throws on HTTP failure", async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(401));

      await expect(fetchMendeleyFolders(ACCESS_TOKEN)).rejects.toThrow(
        "Mendeley folders fetch failed: 401",
      );
    });
  });

  // =========================================================================
  // fetchMendeleyDocuments
  // =========================================================================

  describe("fetchMendeleyDocuments", () => {
    it("fetches documents with default parameters", async () => {
      mockFetch.mockResolvedValue(mockOkResponse([sampleDoc]));

      const result = await fetchMendeleyDocuments(ACCESS_TOKEN);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Vaccine Safety Monitoring");

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("api.mendeley.com/documents");
      expect(url).toContain("limit=100");
      expect(url).toContain("view=all");
      expect(options.headers.Authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
    });

    it("includes folder_id when folderId option is specified", async () => {
      mockFetch.mockResolvedValue(mockOkResponse([]));

      await fetchMendeleyDocuments(ACCESS_TOKEN, {
        folderId: "folder-xyz",
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("folder_id=folder-xyz");
    });

    it("includes modified_since when modifiedSince option is specified", async () => {
      mockFetch.mockResolvedValue(mockOkResponse([]));

      await fetchMendeleyDocuments(ACCESS_TOKEN, {
        modifiedSince: "2024-01-01T00:00:00Z",
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("modified_since=");
    });

    it("uses custom limit when specified", async () => {
      mockFetch.mockResolvedValue(mockOkResponse([]));

      await fetchMendeleyDocuments(ACCESS_TOKEN, { limit: 50 });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("limit=50");
    });

    it("throws on HTTP failure", async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(403));

      await expect(fetchMendeleyDocuments(ACCESS_TOKEN)).rejects.toThrow(
        "Mendeley documents fetch failed: 403",
      );
    });
  });

  // =========================================================================
  // createMendeleyDocument
  // =========================================================================

  describe("createMendeleyDocument", () => {
    it("sends POST request with document data", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleDoc));

      const docData = { title: "New Study", type: "journal" };
      await createMendeleyDocument(ACCESS_TOKEN, docData);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("api.mendeley.com/documents");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual(docData);
    });

    it("returns the created document", async () => {
      mockFetch.mockResolvedValue(mockOkResponse(sampleDoc));

      const result = await createMendeleyDocument(ACCESS_TOKEN, {
        title: "Test",
      });

      expect(result.id).toBe("doc-abc-123");
      expect(result.title).toBe("Vaccine Safety Monitoring");
    });

    it("throws on HTTP failure", async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(400));

      await expect(
        createMendeleyDocument(ACCESS_TOKEN, { title: "Bad" }),
      ).rejects.toThrow("Mendeley document creation failed: 400");
    });
  });

  // =========================================================================
  // mapMendeleyToEvidence
  // =========================================================================

  describe("mapMendeleyToEvidence", () => {
    it("maps all fields correctly from a Mendeley document", () => {
      const result = mapMendeleyToEvidence(sampleDoc);

      expect(result.type).toBe("academic");
      expect(result.title).toBe("Vaccine Safety Monitoring");
      expect(result.description).toBe(
        "Comprehensive monitoring of vaccine adverse events.",
      );
      expect(result.authors).toBe("Chen, Alice; Williams, Bob");
      expect(result.journal).toBe("Lancet Infectious Diseases");
      expect(result.doi).toBe("10.1016/example.2024");
      expect(result.source_url).toBeNull();
      expect(result.publication_date).toBe("2024");
      expect(result.tags).toEqual(["pharmacovigilance", "safety"]);
      expect(result.status).toBe("draft");
      expect(result.external_id).toBe("doc-abc-123");
      expect(result.external_source).toBe("mendeley");
    });

    it("returns null for missing optional fields", () => {
      const minimalDoc: MendeleyDocument = {
        id: "min-1",
        title: "",
        type: "journal",
        authors: [],
        year: 0,
        created: "2024-01-01T00:00:00Z",
        last_modified: "2024-01-01T00:00:00Z",
      };

      const result = mapMendeleyToEvidence(minimalDoc);

      expect(result.title).toBe("Untitled");
      expect(result.authors).toBeNull();
      expect(result.journal).toBeNull();
      expect(result.doi).toBeNull();
      expect(result.publication_date).toBeNull();
      expect(result.tags).toEqual([]);
    });

    it("handles document with year=0 as no publication date", () => {
      const doc: MendeleyDocument = {
        ...sampleDoc,
        year: 0,
      };

      const result = mapMendeleyToEvidence(doc);

      expect(result.publication_date).toBeNull();
    });
  });

  // =========================================================================
  // mapEvidenceToMendeley
  // =========================================================================

  describe("mapEvidenceToMendeley", () => {
    it("maps evidence fields to Mendeley document format", () => {
      const evidence = {
        title: "My Study",
        authors: "Chen, Alice; Williams, Bob",
        description: "Abstract text",
        doi: "10.1016/test",
        journal: "Test Journal",
        publication_date: "2024-06-15",
        tags: ["tag1", "tag2"],
      };

      const result = mapEvidenceToMendeley(evidence);

      expect(result.type).toBe("journal");
      expect(result.title).toBe("My Study");
      expect(result.authors).toEqual([
        { first_name: "Alice", last_name: "Chen" },
        { first_name: "Bob", last_name: "Williams" },
      ]);
      expect(result.year).toBe(2024);
      expect(result.source).toBe("Test Journal");
      expect(result.abstract).toBe("Abstract text");
      expect(result.identifiers).toEqual({ doi: "10.1016/test" });
      expect(result.tags).toEqual(["tag1", "tag2"]);
    });

    it("handles single-name authors (no comma separator)", () => {
      const evidence = {
        title: "Study",
        authors: "WHO; UNESCO",
        tags: [],
      };

      const result = mapEvidenceToMendeley(evidence);

      expect(result.authors).toEqual([
        { first_name: "", last_name: "WHO" },
        { first_name: "", last_name: "UNESCO" },
      ]);
    });

    it("handles empty authors string", () => {
      const evidence = {
        title: "No Authors",
        authors: "",
        tags: [],
      };

      const result = mapEvidenceToMendeley(evidence);

      expect(result.authors).toEqual([]);
    });

    it("returns undefined identifiers when no DOI", () => {
      const evidence = {
        title: "Study",
        tags: [],
      };

      const result = mapEvidenceToMendeley(evidence);

      expect(result.identifiers).toBeUndefined();
    });

    it("returns undefined year for invalid publication date", () => {
      const evidence = {
        title: "Study",
        publication_date: "not-a-date",
        tags: [],
      };

      const result = mapEvidenceToMendeley(evidence);

      expect(result.year).toBeUndefined();
    });
  });
});
