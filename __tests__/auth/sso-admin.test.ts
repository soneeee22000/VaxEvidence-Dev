import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { createSSOProvider, deleteSSOProvider } from "@/lib/auth/sso-admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SUPABASE_URL = "https://test-project.supabase.co";
const SERVICE_KEY = "service-role-key-123";

function setEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
}

function clearEnv() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sso-admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setEnv();
  });

  afterEach(() => {
    clearEnv();
  });

  // =========================================================================
  // createSSOProvider
  // =========================================================================

  describe("createSSOProvider", () => {
    it("sends correct POST request to Supabase Auth SSO endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "provider-abc" }),
      });

      await createSSOProvider({
        domain: "example.com",
        metadataUrl: "https://idp.example.com/metadata",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(`${SUPABASE_URL}/auth/v1/admin/sso/providers`);
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers.Authorization).toBe(`Bearer ${SERVICE_KEY}`);
      expect(options.headers.apikey).toBe(SERVICE_KEY);

      const body = JSON.parse(options.body);
      expect(body.type).toBe("saml");
      expect(body.domains).toEqual(["example.com"]);
      expect(body.metadata_url).toBe("https://idp.example.com/metadata");
    });

    it("returns provider ID on success", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "provider-xyz" }),
      });

      const result = await createSSOProvider({
        domain: "corp.example.com",
        metadataUrl: "https://idp.corp.example.com/saml/metadata",
      });

      expect(result.providerId).toBe("provider-xyz");
      expect(result.error).toBeNull();
    });

    it("uses metadata_xml when metadataUrl is not provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "provider-xml" }),
      });

      await createSSOProvider({
        domain: "example.com",
        metadataXml: "<EntityDescriptor>...</EntityDescriptor>",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.metadata_xml).toBe(
        "<EntityDescriptor>...</EntityDescriptor>",
      );
      expect(body.metadata_url).toBeUndefined();
    });

    it("includes attribute mapping when provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "provider-map" }),
      });

      await createSSOProvider({
        domain: "example.com",
        metadataUrl: "https://idp.example.com/metadata",
        attributeMapping: {
          email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/email",
          name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
        },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.attribute_mapping.keys.email).toBe(
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/email",
      );
    });

    it("returns SSO not available error for 404 response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not found"),
      });

      const result = await createSSOProvider({
        domain: "example.com",
        metadataUrl: "https://idp.example.com/metadata",
      });

      expect(result.providerId).toBeNull();
      expect(result.error).toContain("SSO is not available");
      expect(result.error).toContain("Supabase Enterprise");
    });

    it("returns SSO not available error for 422 response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve("Unprocessable"),
      });

      const result = await createSSOProvider({
        domain: "example.com",
        metadataUrl: "https://idp.example.com/metadata",
      });

      expect(result.providerId).toBeNull();
      expect(result.error).toContain("SSO is not available");
    });

    it("returns generic error for other non-2xx responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      const result = await createSSOProvider({
        domain: "example.com",
        metadataUrl: "https://idp.example.com/metadata",
      });

      expect(result.providerId).toBeNull();
      expect(result.error).toContain("Failed to create SSO provider");
      expect(result.error).toContain("Internal Server Error");
    });

    it("returns error when environment variables are missing", async () => {
      clearEnv();

      const result = await createSSOProvider({
        domain: "example.com",
        metadataUrl: "https://idp.example.com/metadata",
      });

      expect(result.providerId).toBeNull();
      expect(result.error).toBe("Missing Supabase environment variables");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("falls back to SUPABASE_URL when NEXT_PUBLIC is not set", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.SUPABASE_URL = "https://fallback.supabase.co";

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "provider-fb" }),
      });

      await createSSOProvider({
        domain: "example.com",
        metadataUrl: "https://idp.example.com/metadata",
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("fallback.supabase.co");
    });

    it("catches and returns network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network unreachable"));

      const result = await createSSOProvider({
        domain: "example.com",
        metadataUrl: "https://idp.example.com/metadata",
      });

      expect(result.providerId).toBeNull();
      expect(result.error).toBe("Network unreachable");
    });
  });

  // =========================================================================
  // deleteSSOProvider
  // =========================================================================

  describe("deleteSSOProvider", () => {
    it("sends DELETE request to the correct provider URL", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await deleteSSOProvider("provider-abc");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(
        `${SUPABASE_URL}/auth/v1/admin/sso/providers/provider-abc`,
      );
      expect(options.method).toBe("DELETE");
      expect(options.headers.Authorization).toBe(`Bearer ${SERVICE_KEY}`);
      expect(options.headers.apikey).toBe(SERVICE_KEY);
    });

    it("returns null error on successful deletion", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await deleteSSOProvider("provider-abc");

      expect(result.error).toBeNull();
    });

    it("returns error on non-2xx response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Provider not found"),
      });

      const result = await deleteSSOProvider("provider-missing");

      expect(result.error).toContain("Failed to delete SSO provider");
      expect(result.error).toContain("Provider not found");
    });

    it("returns error when environment variables are missing", async () => {
      clearEnv();

      const result = await deleteSSOProvider("provider-abc");

      expect(result.error).toBe("Missing Supabase environment variables");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("catches and returns network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Connection refused"));

      const result = await deleteSSOProvider("provider-abc");

      expect(result.error).toBe("Connection refused");
    });
  });
});
