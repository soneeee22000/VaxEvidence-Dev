// =============================================================================
// MENDELEY API CLIENT
// =============================================================================
// External API client for the Mendeley REST API.
// Follows the same pattern as lib/api/pubmed.ts — BASE_URL, interface types,
// async functions that throw on HTTP errors.
// Uses Bearer token authentication.
// =============================================================================

const MENDELEY_BASE_URL = "https://api.mendeley.com";

/** Default page size for Mendeley API requests. */
const DEFAULT_LIMIT = 100;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface MendeleyDocument {
  id: string;
  title: string;
  type: string;
  authors: Array<{ first_name: string; last_name: string }>;
  year: number;
  source?: string;
  identifiers?: { doi?: string; pmid?: string };
  abstract?: string;
  tags?: string[];
  created: string;
  last_modified: string;
}

export interface MendeleyFolder {
  id: string;
  name: string;
  parent_id?: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Build default headers for Mendeley API requests.
 * All requests require `Authorization: Bearer {token}`.
 */
const buildHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: "application/vnd.mendeley-document.1+json",
  "Content-Type": "application/vnd.mendeley-document.1+json",
});

/**
 * Build a Mendeley API URL with optional query parameters.
 */
const buildUrl = (path: string, params?: Record<string, string>): string => {
  const url = new URL(`${MENDELEY_BASE_URL}${path}`);
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
 * Fetch all folders in the user's Mendeley library.
 * @throws Error on HTTP failure.
 */
export async function fetchMendeleyFolders(
  accessToken: string,
): Promise<MendeleyFolder[]> {
  const url = buildUrl("/folders");
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.mendeley-folder.1+json",
    },
  });
  if (!response.ok) {
    throw new Error(`Mendeley folders fetch failed: ${response.status}`);
  }
  return (await response.json()) as MendeleyFolder[];
}

/**
 * Fetch documents from the user's Mendeley library with optional filtering.
 * @throws Error on HTTP failure.
 */
export async function fetchMendeleyDocuments(
  accessToken: string,
  options?: {
    folderId?: string;
    modifiedSince?: string;
    limit?: number;
  },
): Promise<MendeleyDocument[]> {
  const params: Record<string, string> = {
    limit: String(options?.limit ?? DEFAULT_LIMIT),
    view: "all",
  };

  if (options?.folderId) {
    params.folder_id = options.folderId;
  }

  if (options?.modifiedSince) {
    params.modified_since = options.modifiedSince;
  }

  const url = buildUrl("/documents", params);
  const response = await fetch(url, { headers: buildHeaders(accessToken) });
  if (!response.ok) {
    throw new Error(`Mendeley documents fetch failed: ${response.status}`);
  }
  return (await response.json()) as MendeleyDocument[];
}

/**
 * Create a single document in the user's Mendeley library.
 * @throws Error on HTTP failure.
 */
export async function createMendeleyDocument(
  accessToken: string,
  doc: Partial<MendeleyDocument>,
): Promise<MendeleyDocument> {
  const url = buildUrl("/documents");
  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(accessToken),
    body: JSON.stringify(doc),
  });
  if (!response.ok) {
    throw new Error(`Mendeley document creation failed: ${response.status}`);
  }
  return (await response.json()) as MendeleyDocument;
}

// -----------------------------------------------------------------------------
// Mappers
// -----------------------------------------------------------------------------

/**
 * Map a Mendeley document to VaxEvidence evidence_items fields.
 * Produces a flat object suitable for insert into the evidence_items table.
 */
export function mapMendeleyToEvidence(doc: MendeleyDocument): {
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
  external_source: "mendeley";
} {
  const authors = doc.authors
    .map((a) => [a.last_name, a.first_name].filter(Boolean).join(", "))
    .join("; ");

  return {
    type: "academic",
    title: doc.title || "Untitled",
    description: doc.abstract ?? "",
    authors: authors || null,
    journal: doc.source ?? null,
    doi: doc.identifiers?.doi ?? null,
    source_url: null,
    publication_date: doc.year ? `${doc.year}` : null,
    tags: doc.tags ?? [],
    status: "draft",
    external_id: doc.id,
    external_source: "mendeley",
  };
}

/**
 * Map a VaxEvidence evidence item back to a partial Mendeley document for push.
 * Handles author string parsing (semicolon-separated, each comma-separated
 * "Last, First").
 */
export function mapEvidenceToMendeley(
  evidence: Record<string, unknown>,
): Partial<MendeleyDocument> {
  const authors: MendeleyDocument["authors"] = [];

  if (typeof evidence.authors === "string" && evidence.authors) {
    const authorParts = (evidence.authors as string).split(";");
    for (const part of authorParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const [lastName, firstName] = trimmed.split(",").map((s) => s.trim());
      authors.push({
        first_name: firstName ?? "",
        last_name: lastName ?? "",
      });
    }
  }

  const year = evidence.publication_date
    ? new Date(evidence.publication_date as string).getFullYear()
    : undefined;

  const identifiers: MendeleyDocument["identifiers"] = {};
  if (evidence.doi) identifiers.doi = evidence.doi as string;

  return {
    title: (evidence.title as string) ?? "",
    type: "journal",
    authors,
    year: year && !isNaN(year) ? year : undefined,
    source: (evidence.journal as string) ?? undefined,
    abstract: (evidence.description as string) ?? undefined,
    identifiers: Object.keys(identifiers).length > 0 ? identifiers : undefined,
    tags: Array.isArray(evidence.tags)
      ? (evidence.tags as string[])
      : undefined,
  };
}
