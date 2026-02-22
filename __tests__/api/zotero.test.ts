import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  fetchZoteroCollections,
  fetchZoteroItems,
  createZoteroItem,
  mapZoteroToEvidence,
  mapEvidenceToZotero,
  type ZoteroItem,
  type ZoteroCollection,
} from "@/lib/api/zotero";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_TOKEN = "zot_test_token_123";
const USER_ID = "12345678";

const sampleZoteroItem: ZoteroItem = {
  key: "ABCD1234",
  version: 42,
  data: {
    itemType: "journalArticle",
    title: "Vaccine Efficacy Study",
    creators: [
      { creatorType: "author", firstName: "Jane", lastName: "Smith" },
      { creatorType: "author", firstName: "John", lastName: "Doe" },
    ],
    date: "2024-06-15",
    DOI: "10.1234/example.2024",
    url: "https://example.com/article",
    abstractNote:
      "This study investigates vaccine efficacy in a randomized trial.",
    publicationTitle: "Journal of Immunology",
    tags: [{ tag: "vaccine" }, { tag: "RCT" }],
  },
};

const sampleCollection: ZoteroCollection = {
  key: "COL12345",
  data: {
    key: "COL12345",
    name: "COVID-19 Studies",
    parentCollection: false,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockOkResponse(body: unknown, headers?: Record<string, string>) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    headers: new Map(Object.entries(headers ?? {})),
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

describe("zotero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // fetchZoteroCollections
  // =========================================================================

  describe("fetchZoteroCollections", () => {
    it("calls the correct Zotero API URL with proper headers", async () => {
      mockFetch.mockResolvedValue(mockOkResponse([sampleCollection]));

      await fetchZoteroCollections(TEST_TOKEN, USER_ID);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain(`/users/${USER_ID}/collections`);
      expect(options.headers["Zotero-API-Key"]).toBe(TEST_TOKEN);
      expect(options.headers["Zotero-API-Version"]).toBe("3");
    });

    it("returns parsed collections array", async () => {
      mockFetch.mockResolvedValue(mockOkResponse([sampleCollection]));

      const result = await fetchZoteroCollections(TEST_TOKEN, USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].data.name).toBe("COVID-19 Studies");
    });

    it("throws on HTTP failure", async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(403));

      await expect(fetchZoteroCollections(TEST_TOKEN, USER_ID)).rejects.toThrow(
        "Zotero collections fetch failed: 403",
      );
    });
  });

  // =========================================================================
  // fetchZoteroItems
  // =========================================================================

  describe("fetchZoteroItems", () => {
    it("fetches items from user library root", async () => {
      const response = mockOkResponse([sampleZoteroItem], {
        "Last-Modified-Version": "42",
      });
      // Override headers.get for the specific header access pattern
      (response.headers as any).get = (name: string) => {
        if (name === "Last-Modified-Version") return "42";
        return null;
      };
      mockFetch.mockResolvedValue(response);

      const result = await fetchZoteroItems(TEST_TOKEN, USER_ID);

      expect(result.items).toHaveLength(1);
      expect(result.version).toBe(42);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain(`/users/${USER_ID}/items`);
      expect(url).not.toContain("/collections/");
    });

    it("fetches items from a specific collection", async () => {
      const response = mockOkResponse([], {
        "Last-Modified-Version": "10",
      });
      (response.headers as any).get = (name: string) => {
        if (name === "Last-Modified-Version") return "10";
        return null;
      };
      mockFetch.mockResolvedValue(response);

      await fetchZoteroItems(TEST_TOKEN, USER_ID, {
        collectionKey: "COL12345",
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain(`/collections/COL12345/items`);
    });

    it("includes since parameter for incremental sync", async () => {
      const response = mockOkResponse([], {
        "Last-Modified-Version": "50",
      });
      (response.headers as any).get = (name: string) => {
        if (name === "Last-Modified-Version") return "50";
        return null;
      };
      mockFetch.mockResolvedValue(response);

      await fetchZoteroItems(TEST_TOKEN, USER_ID, { since: 30 });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("since=30");
    });

    it("uses custom limit when specified", async () => {
      const response = mockOkResponse([], {
        "Last-Modified-Version": "1",
      });
      (response.headers as any).get = (name: string) => {
        if (name === "Last-Modified-Version") return "1";
        return null;
      };
      mockFetch.mockResolvedValue(response);

      await fetchZoteroItems(TEST_TOKEN, USER_ID, { limit: 25 });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("limit=25");
    });

    it("defaults to limit=100", async () => {
      const response = mockOkResponse([], {
        "Last-Modified-Version": "0",
      });
      (response.headers as any).get = (name: string) => {
        if (name === "Last-Modified-Version") return "0";
        return null;
      };
      mockFetch.mockResolvedValue(response);

      await fetchZoteroItems(TEST_TOKEN, USER_ID);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("limit=100");
    });

    it("throws on HTTP failure", async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(401));

      await expect(fetchZoteroItems(TEST_TOKEN, USER_ID)).rejects.toThrow(
        "Zotero items fetch failed: 401",
      );
    });
  });

  // =========================================================================
  // createZoteroItem
  // =========================================================================

  describe("createZoteroItem", () => {
    it("sends POST request with item wrapped in array", async () => {
      mockFetch.mockResolvedValue(
        mockOkResponse({
          successful: { "0": sampleZoteroItem },
          failed: {},
        }),
      );

      const itemData = { title: "New Study", itemType: "journalArticle" };
      await createZoteroItem(TEST_TOKEN, USER_ID, itemData);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain(`/users/${USER_ID}/items`);
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual([itemData]);
    });

    it("returns the created item from successful key", async () => {
      mockFetch.mockResolvedValue(
        mockOkResponse({
          successful: { "0": sampleZoteroItem },
          failed: {},
        }),
      );

      const result = await createZoteroItem(TEST_TOKEN, USER_ID, {
        title: "Test",
      });

      expect(result.key).toBe("ABCD1234");
      expect(result.data.title).toBe("Vaccine Efficacy Study");
    });

    it("throws when Zotero returns item in failed key", async () => {
      mockFetch.mockResolvedValue(
        mockOkResponse({
          successful: {},
          failed: { "0": { message: "Invalid item type" } },
        }),
      );

      await expect(
        createZoteroItem(TEST_TOKEN, USER_ID, { title: "Bad" }),
      ).rejects.toThrow("Zotero item creation failed: Invalid item type");
    });

    it("throws generic error when no successful or failed info", async () => {
      mockFetch.mockResolvedValue(
        mockOkResponse({ successful: {}, failed: {} }),
      );

      await expect(
        createZoteroItem(TEST_TOKEN, USER_ID, { title: "Unknown" }),
      ).rejects.toThrow("Unknown Zotero creation error");
    });

    it("throws on HTTP failure", async () => {
      mockFetch.mockResolvedValue(mockErrorResponse(500));

      await expect(
        createZoteroItem(TEST_TOKEN, USER_ID, { title: "Test" }),
      ).rejects.toThrow("Zotero item creation failed: 500");
    });
  });

  // =========================================================================
  // mapZoteroToEvidence
  // =========================================================================

  describe("mapZoteroToEvidence", () => {
    it("maps all fields correctly from a Zotero item", () => {
      const result = mapZoteroToEvidence(sampleZoteroItem);

      expect(result.type).toBe("academic");
      expect(result.title).toBe("Vaccine Efficacy Study");
      expect(result.description).toBe(
        "This study investigates vaccine efficacy in a randomized trial.",
      );
      expect(result.authors).toBe("Smith, Jane; Doe, John");
      expect(result.journal).toBe("Journal of Immunology");
      expect(result.doi).toBe("10.1234/example.2024");
      expect(result.source_url).toBe("https://example.com/article");
      expect(result.publication_date).toBe("2024-06-15");
      expect(result.tags).toEqual(["vaccine", "RCT"]);
      expect(result.status).toBe("draft");
      expect(result.external_id).toBe("ABCD1234");
      expect(result.external_source).toBe("zotero");
    });

    it("handles creators with only name field (organizations)", () => {
      const item: ZoteroItem = {
        ...sampleZoteroItem,
        data: {
          ...sampleZoteroItem.data,
          creators: [{ creatorType: "author", name: "WHO" }],
        },
      };

      const result = mapZoteroToEvidence(item);

      expect(result.authors).toBe("WHO");
    });

    it("returns null for missing optional fields", () => {
      const item: ZoteroItem = {
        key: "EMPTY1",
        version: 1,
        data: {
          itemType: "journalArticle",
          title: "",
          creators: [],
          date: "",
          tags: [],
        },
      };

      const result = mapZoteroToEvidence(item);

      expect(result.title).toBe("Untitled");
      expect(result.authors).toBeNull();
      expect(result.journal).toBeNull();
      expect(result.doi).toBeNull();
      expect(result.source_url).toBeNull();
      expect(result.publication_date).toBeNull();
      expect(result.tags).toEqual([]);
    });
  });

  // =========================================================================
  // mapEvidenceToZotero
  // =========================================================================

  describe("mapEvidenceToZotero", () => {
    it("maps evidence fields to Zotero item format", () => {
      const evidence = {
        title: "My Study",
        authors: "Smith, Jane; Doe, John",
        description: "Abstract text here",
        doi: "10.1234/test",
        source_url: "https://example.com",
        journal: "Test Journal",
        publication_date: "2024-01-01",
        tags: ["tag1", "tag2"],
      };

      const result = mapEvidenceToZotero(evidence);

      expect(result.itemType).toBe("journalArticle");
      expect(result.title).toBe("My Study");
      expect(result.creators).toEqual([
        { creatorType: "author", firstName: "Jane", lastName: "Smith" },
        { creatorType: "author", firstName: "John", lastName: "Doe" },
      ]);
      expect(result.DOI).toBe("10.1234/test");
      expect(result.abstractNote).toBe("Abstract text here");
      expect(result.publicationTitle).toBe("Test Journal");
      expect(result.tags).toEqual([{ tag: "tag1" }, { tag: "tag2" }]);
    });

    it("handles single-name authors (no comma separator)", () => {
      const evidence = {
        title: "Study",
        authors: "WHO; CDC",
        tags: [],
      };

      const result = mapEvidenceToZotero(evidence);

      expect(result.creators).toEqual([
        { creatorType: "author", name: "WHO" },
        { creatorType: "author", name: "CDC" },
      ]);
    });

    it("handles empty authors string", () => {
      const evidence = {
        title: "No Authors",
        authors: "",
        tags: [],
      };

      const result = mapEvidenceToZotero(evidence);

      expect(result.creators).toEqual([]);
    });

    it("handles missing tags", () => {
      const evidence = {
        title: "Study",
        authors: null,
      };

      const result = mapEvidenceToZotero(evidence);

      expect(result.tags).toEqual([]);
    });
  });
});
