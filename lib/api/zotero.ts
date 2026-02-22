// =============================================================================
// ZOTERO WEB API V3 CLIENT
// =============================================================================
// External API client for the Zotero Web API v3.
// Follows the same pattern as lib/api/pubmed.ts — BASE_URL, interface types,
// async functions that throw on HTTP errors.
// =============================================================================

const ZOTERO_BASE_URL = "https://api.zotero.org";

/** Maximum number of items per Zotero API request. */
const DEFAULT_LIMIT = 100;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ZoteroItem {
  key: string;
  version: number;
  data: {
    itemType: string;
    title: string;
    creators: Array<{
      creatorType: string;
      firstName?: string;
      lastName?: string;
      name?: string;
    }>;
    date: string;
    DOI?: string;
    url?: string;
    abstractNote?: string;
    publicationTitle?: string;
    tags: Array<{ tag: string }>;
  };
}

export interface ZoteroCollection {
  key: string;
  data: {
    key: string;
    name: string;
    parentCollection: string | false;
  };
}

/** Shape returned by fetchZoteroItems with the library version header. */
interface ZoteroItemsResult {
  items: ZoteroItem[];
  version: number;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Build default headers for Zotero API v3 requests.
 * All requests require `Zotero-API-Key` and `Zotero-API-Version: 3`.
 */
const buildHeaders = (apiKey: string): HeadersInit => ({
  "Zotero-API-Key": apiKey,
  "Zotero-API-Version": "3",
  "Content-Type": "application/json",
});

/**
 * Build a Zotero user-library URL.
 * All paths are relative to `/users/{userId}`.
 */
const buildUrl = (
  userId: string,
  path: string,
  params?: Record<string, string>,
): string => {
  const url = new URL(`${ZOTERO_BASE_URL}/users/${userId}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
  }
  return url.toString();
};

// -----------------------------------------------------------------------------
// API Functions
// -----------------------------------------------------------------------------

/**
 * Fetch all collections in a user's Zotero library.
 * @throws Error on HTTP failure.
 */
export async function fetchZoteroCollections(
  apiKey: string,
  userId: string,
): Promise<ZoteroCollection[]> {
  const url = buildUrl(userId, "/collections");
  const response = await fetch(url, { headers: buildHeaders(apiKey) });
  if (!response.ok) {
    throw new Error(`Zotero collections fetch failed: ${response.status}`);
  }
  return (await response.json()) as ZoteroCollection[];
}

/**
 * Fetch items from a user's Zotero library with optional filtering.
 * Returns both the items and the library `Last-Modified-Version` header
 * which is used for incremental sync.
 * @throws Error on HTTP failure.
 */
export async function fetchZoteroItems(
  apiKey: string,
  userId: string,
  options?: {
    collectionKey?: string;
    since?: number;
    limit?: number;
  },
): Promise<ZoteroItemsResult> {
  const params: Record<string, string> = {
    limit: String(options?.limit ?? DEFAULT_LIMIT),
    itemType: "-attachment || note",
  };

  if (options?.since !== undefined) {
    params.since = String(options.since);
  }

  const path = options?.collectionKey
    ? `/collections/${options.collectionKey}/items`
    : "/items";

  const url = buildUrl(userId, path, params);
  const response = await fetch(url, { headers: buildHeaders(apiKey) });
  if (!response.ok) {
    throw new Error(`Zotero items fetch failed: ${response.status}`);
  }

  const version = Number(response.headers.get("Last-Modified-Version") ?? "0");
  const items = (await response.json()) as ZoteroItem[];

  return { items, version };
}

/**
 * Create a single item in a user's Zotero library.
 * @throws Error on HTTP failure.
 */
export async function createZoteroItem(
  apiKey: string,
  userId: string,
  item: Partial<ZoteroItem["data"]>,
): Promise<ZoteroItem> {
  const url = buildUrl(userId, "/items");
  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify([item]),
  });

  if (!response.ok) {
    throw new Error(`Zotero item creation failed: ${response.status}`);
  }

  const result = await response.json();

  /* Zotero returns { successful: { "0": item }, ... } for batch creates. */
  const created = result?.successful?.["0"];
  if (!created) {
    const failMsg =
      result?.failed?.["0"]?.message ?? "Unknown Zotero creation error";
    throw new Error(`Zotero item creation failed: ${failMsg}`);
  }

  return created as ZoteroItem;
}

// -----------------------------------------------------------------------------
// Mappers
// -----------------------------------------------------------------------------

/**
 * Map a Zotero item to VaxEvidence evidence_items fields.
 * Produces a flat object suitable for insert into the evidence_items table.
 */
export function mapZoteroToEvidence(item: ZoteroItem): {
  type: "academic";
  title: string;
  description: string;
  authors: string | null;
  journal: string | null;
  doi: string | null;
  source_url: string | null;
  publication_date: string | null;
  tags: string[];
  status: "draft";
  external_id: string;
  external_source: "zotero";
} {
  const { data } = item;

  const authors = data.creators
    .map((c) => {
      if (c.name) return c.name;
      return [c.lastName, c.firstName].filter(Boolean).join(", ");
    })
    .join("; ");

  return {
    type: "academic",
    title: data.title || "Untitled",
    description: data.abstractNote ?? "",
    authors: authors || null,
    journal: data.publicationTitle ?? null,
    doi: data.DOI ?? null,
    source_url: data.url ?? null,
    publication_date: data.date || null,
    tags: data.tags.map((t) => t.tag),
    status: "draft",
    external_id: item.key,
    external_source: "zotero",
  };
}

/**
 * Map a VaxEvidence evidence item back to a partial Zotero item for push.
 * Handles author string parsing (semicolon-separated, each comma-separated
 * "Last, First").
 */
export function mapEvidenceToZotero(
  evidence: Record<string, unknown>,
): Partial<ZoteroItem["data"]> {
  const creators: ZoteroItem["data"]["creators"] = [];

  if (typeof evidence.authors === "string" && evidence.authors) {
    const authorParts = (evidence.authors as string).split(";");
    for (const part of authorParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const [lastName, firstName] = trimmed.split(",").map((s) => s.trim());
      if (firstName) {
        creators.push({ creatorType: "author", firstName, lastName });
      } else {
        creators.push({ creatorType: "author", name: lastName });
      }
    }
  }

  const tags: Array<{ tag: string }> = [];
  if (Array.isArray(evidence.tags)) {
    for (const t of evidence.tags) {
      if (typeof t === "string") tags.push({ tag: t });
    }
  }

  return {
    itemType: "journalArticle",
    title: (evidence.title as string) ?? "",
    creators,
    date: (evidence.publication_date as string) ?? "",
    DOI: (evidence.doi as string) ?? undefined,
    url: (evidence.source_url as string) ?? undefined,
    abstractNote: (evidence.description as string) ?? "",
    publicationTitle: (evidence.journal as string) ?? undefined,
    tags,
  };
}
