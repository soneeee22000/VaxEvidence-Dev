import { describe, it, expect } from "vitest";
import {
  ssoConfigCreateSchema,
  ssoConfigUpdateSchema,
  ssoProviderTypes,
  ssoDefaultRoles,
} from "@/lib/validators/sso";

describe("ssoConfigCreateSchema", () => {
  const validPayload = {
    display_name: "Acme Corp SSO",
    domain: "acme.com",
    metadata_url: "https://idp.acme.com/saml/metadata",
  };

  it("accepts a fully populated valid payload", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      metadata_xml: "<xml>metadata</xml>",
      attribute_mapping: { email: "urn:oid:1.2.3", name: "urn:oid:2.3.4" },
      auto_provision: false,
      default_role: "admin",
      enforce_sso: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a minimal payload with only display_name and domain", () => {
    const result = ssoConfigCreateSchema.safeParse({
      display_name: "Minimal SSO",
      domain: "example.org",
    });
    expect(result.success).toBe(true);
  });

  it("applies default auto_provision to true", () => {
    const result = ssoConfigCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.auto_provision).toBe(true);
    }
  });

  it("applies default default_role to viewer", () => {
    const result = ssoConfigCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.default_role).toBe("viewer");
    }
  });

  it("applies default enforce_sso to false", () => {
    const result = ssoConfigCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enforce_sso).toBe(false);
    }
  });

  it("accepts all valid default_role values", () => {
    for (const role of ssoDefaultRoles) {
      const result = ssoConfigCreateSchema.safeParse({
        ...validPayload,
        default_role: role,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid default_role value", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      default_role: "superuser",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing display_name", () => {
    const { display_name, ...rest } = validPayload;
    const result = ssoConfigCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty display_name", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      display_name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.message.includes("required"),
      );
      expect(issue).toBeDefined();
    }
  });

  it("rejects display_name exceeding 100 characters", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      display_name: "N".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts display_name at exactly 100 characters", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      display_name: "N".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing domain", () => {
    const { domain, ...rest } = validPayload;
    const result = ssoConfigCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty domain", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      domain: "",
    });
    expect(result.success).toBe(false);
  });

  // Domain regex validation tests
  it("accepts valid multi-part domain", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      domain: "sub.domain.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects domain with protocol prefix", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      domain: "https://acme.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects domain with trailing slash", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      domain: "acme.com/",
    });
    expect(result.success).toBe(false);
  });

  it("rejects domain with path", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      domain: "acme.com/path",
    });
    expect(result.success).toBe(false);
  });

  it("rejects single-label domain without TLD", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      domain: "localhost",
    });
    expect(result.success).toBe(false);
  });

  it("rejects domain starting with hyphen", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      domain: "-acme.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid metadata_url", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      metadata_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts attribute_mapping as record of strings", () => {
    const result = ssoConfigCreateSchema.safeParse({
      ...validPayload,
      attribute_mapping: { email: "email_attr", first_name: "fname_attr" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects null input", () => {
    const result = ssoConfigCreateSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects completely empty input", () => {
    const result = ssoConfigCreateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("ssoConfigUpdateSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = ssoConfigUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts updating only display_name", () => {
    const result = ssoConfigUpdateSchema.safeParse({
      display_name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts updating only domain", () => {
    const result = ssoConfigUpdateSchema.safeParse({
      domain: "new-domain.org",
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable metadata_url", () => {
    const result = ssoConfigUpdateSchema.safeParse({
      metadata_url: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable metadata_xml", () => {
    const result = ssoConfigUpdateSchema.safeParse({
      metadata_xml: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable attribute_mapping", () => {
    const result = ssoConfigUpdateSchema.safeParse({
      attribute_mapping: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts is_active boolean in update", () => {
    const result = ssoConfigUpdateSchema.safeParse({
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty display_name in update", () => {
    const result = ssoConfigUpdateSchema.safeParse({
      display_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid domain in update", () => {
    const result = ssoConfigUpdateSchema.safeParse({
      domain: "https://invalid.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid metadata_url in update", () => {
    const result = ssoConfigUpdateSchema.safeParse({
      metadata_url: "not-valid",
    });
    expect(result.success).toBe(false);
  });
});

describe("ssoProviderTypes constant", () => {
  it("exports exactly 1 provider type", () => {
    expect(ssoProviderTypes).toHaveLength(1);
  });

  it("contains saml", () => {
    expect(ssoProviderTypes).toContain("saml");
  });
});

describe("ssoDefaultRoles constant", () => {
  it("exports exactly 4 role values", () => {
    expect(ssoDefaultRoles).toHaveLength(4);
  });

  it("contains admin, lead, reviewer, and viewer", () => {
    expect(ssoDefaultRoles).toContain("admin");
    expect(ssoDefaultRoles).toContain("lead");
    expect(ssoDefaultRoles).toContain("reviewer");
    expect(ssoDefaultRoles).toContain("viewer");
  });
});
