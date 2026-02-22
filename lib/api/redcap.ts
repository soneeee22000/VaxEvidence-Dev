// =============================================================================
// REDCAP API CLIENT
// =============================================================================
// External API client for REDCap (Research Electronic Data Capture).
// REDCap uses POST for all API calls with form-encoded body including a token.
// Follows the same pattern as lib/api/pubmed.ts — interface types, async
// functions that throw on HTTP errors.
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** A single REDCap record — dynamic key/value pairs based on project fields. */
export interface REDCapRecord {
  [fieldName: string]: string;
}

/** A REDCap project field definition from the data dictionary. */
export interface REDCapField {
  field_name: string;
  form_name: string;
  field_type: string;
  field_label: string;
  field_note: string;
  select_choices_or_calculations: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Build a URL-encoded form body for REDCap API POST requests.
 * REDCap requires `token`, `content`, and `format` as baseline parameters.
 */
const buildFormBody = (
  apiToken: string,
  content: string,
  extra?: Record<string, string>,
): URLSearchParams => {
  const params = new URLSearchParams();
  params.set("token", apiToken);
  params.set("content", content);
  params.set("format", "json");
  params.set("returnFormat", "json");

  if (extra) {
    Object.entries(extra).forEach(([key, value]) => params.set(key, value));
  }

  return params;
};

/**
 * Execute a REDCap API POST request and return parsed JSON.
 * @throws Error on HTTP failure or REDCap-level error.
 */
async function redcapPost<T>(
  apiUrl: string,
  body: URLSearchParams,
): Promise<T> {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`REDCap API request failed: ${response.status}`);
  }

  const data = await response.json();

  /* REDCap returns { error: "..." } on logical errors with a 200 status. */
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(`REDCap error: ${data.error}`);
  }

  return data as T;
}

// -----------------------------------------------------------------------------
// API Functions
// -----------------------------------------------------------------------------

/**
 * Fetch the project data dictionary (field metadata).
 * @throws Error on HTTP failure.
 */
export async function fetchREDCapMetadata(
  apiUrl: string,
  apiToken: string,
): Promise<REDCapField[]> {
  const body = buildFormBody(apiToken, "metadata");
  return redcapPost<REDCapField[]>(apiUrl, body);
}

/**
 * Fetch records from a REDCap project with optional filtering.
 * @throws Error on HTTP failure.
 */
export async function fetchREDCapRecords(
  apiUrl: string,
  apiToken: string,
  options?: {
    fields?: string[];
    forms?: string[];
    filterLogic?: string;
  },
): Promise<REDCapRecord[]> {
  const extra: Record<string, string> = {};

  if (options?.fields && options.fields.length > 0) {
    extra.fields = options.fields.join(",");
  }

  if (options?.forms && options.forms.length > 0) {
    extra.forms = options.forms.join(",");
  }

  if (options?.filterLogic) {
    extra.filterLogic = options.filterLogic;
  }

  const body = buildFormBody(apiToken, "record", extra);
  return redcapPost<REDCapRecord[]>(apiUrl, body);
}

/**
 * Export a pre-defined REDCap report by its report ID.
 * @throws Error on HTTP failure.
 */
export async function exportREDCapReport(
  apiUrl: string,
  apiToken: string,
  reportId: string,
): Promise<REDCapRecord[]> {
  const body = buildFormBody(apiToken, "report", { report_id: reportId });
  return redcapPost<REDCapRecord[]>(apiUrl, body);
}
