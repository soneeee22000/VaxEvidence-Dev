import { describe, it, expect } from "vitest";
import {
  SDTM_DOMAINS,
  SDTM_DOMAIN_COUNT,
  getSDTMDomain,
  getTrialDesignDomains,
  getClinicalDomains,
} from "@/lib/regulatory/sdtm-domains";

// ---------------------------------------------------------------------------
// SDTM_DOMAINS constant
// ---------------------------------------------------------------------------
describe("SDTM_DOMAINS", () => {
  it("contains exactly 10 domains", () => {
    expect(SDTM_DOMAINS).toHaveLength(10);
    expect(SDTM_DOMAIN_COUNT).toBe(10);
  });

  it("each domain has required properties", () => {
    for (const domain of SDTM_DOMAINS) {
      expect(domain.code).toBeTruthy();
      expect(domain.code).toHaveLength(2);
      expect(domain.label).toBeTruthy();
      expect(domain.description).toBeTruthy();
      expect(["trial-design", "clinical"]).toContain(domain.category);
      expect(Array.isArray(domain.variables)).toBe(true);
      expect(domain.variables.length).toBeGreaterThan(0);
      expect(typeof domain.autoPopulate).toBe("boolean");
    }
  });

  it("has unique domain codes", () => {
    const codes = SDTM_DOMAINS.map((d) => d.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("has 5 trial-design domains and 5 clinical domains", () => {
    const trialDesign = SDTM_DOMAINS.filter(
      (d) => d.category === "trial-design",
    );
    const clinical = SDTM_DOMAINS.filter((d) => d.category === "clinical");
    expect(trialDesign).toHaveLength(5);
    expect(clinical).toHaveLength(5);
  });

  it("trial-design domains: TS, TA, TE, TI, TV", () => {
    const codes = SDTM_DOMAINS.filter((d) => d.category === "trial-design").map(
      (d) => d.code,
    );
    expect(codes).toEqual(["TS", "TA", "TE", "TI", "TV"]);
  });

  it("clinical domains: DM, AE, EX, IS, LB", () => {
    const codes = SDTM_DOMAINS.filter((d) => d.category === "clinical").map(
      (d) => d.code,
    );
    expect(codes).toEqual(["DM", "AE", "EX", "IS", "LB"]);
  });

  it("all trial-design domains have autoPopulate=true", () => {
    const trialDesign = SDTM_DOMAINS.filter(
      (d) => d.category === "trial-design",
    );
    for (const domain of trialDesign) {
      expect(domain.autoPopulate).toBe(true);
    }
  });

  it("all clinical domains have autoPopulate=false", () => {
    const clinical = SDTM_DOMAINS.filter((d) => d.category === "clinical");
    for (const domain of clinical) {
      expect(domain.autoPopulate).toBe(false);
    }
  });

  it("each domain has STUDYID and DOMAIN variables", () => {
    for (const domain of SDTM_DOMAINS) {
      const varNames = domain.variables.map((v) => v.name);
      expect(varNames).toContain("STUDYID");
      expect(varNames).toContain("DOMAIN");
    }
  });

  it("each variable has required properties", () => {
    for (const domain of SDTM_DOMAINS) {
      for (const variable of domain.variables) {
        expect(variable.name).toBeTruthy();
        expect(variable.label).toBeTruthy();
        expect(["Char", "Num"]).toContain(variable.type);
        expect([
          "Identifier",
          "Topic",
          "Synonym Qualifier",
          "Record Qualifier",
          "Timing",
          "Rule",
        ]).toContain(variable.role);
        expect(typeof variable.required).toBe("boolean");
        expect(variable.description).toBeTruthy();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// getSDTMDomain
// ---------------------------------------------------------------------------
describe("getSDTMDomain", () => {
  it("returns TS domain by code", () => {
    const domain = getSDTMDomain("TS");
    expect(domain).toBeDefined();
    expect(domain!.label).toBe("Trial Summary");
  });

  it("returns DM domain by code", () => {
    const domain = getSDTMDomain("DM");
    expect(domain).toBeDefined();
    expect(domain!.label).toBe("Demographics");
    expect(domain!.category).toBe("clinical");
  });

  it("returns IS domain (vaccine-specific)", () => {
    const domain = getSDTMDomain("IS");
    expect(domain).toBeDefined();
    expect(domain!.label).toBe("Immunogenicity Specimen Assessments");
  });

  it("is case-insensitive (lowercased input)", () => {
    const domain = getSDTMDomain("ts");
    expect(domain).toBeDefined();
    expect(domain!.code).toBe("TS");
  });

  it("is case-insensitive (mixed case input)", () => {
    const domain = getSDTMDomain("Dm");
    expect(domain).toBeDefined();
    expect(domain!.code).toBe("DM");
  });

  it("returns undefined for unknown code", () => {
    const domain = getSDTMDomain("XX");
    expect(domain).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    const domain = getSDTMDomain("");
    expect(domain).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getTrialDesignDomains
// ---------------------------------------------------------------------------
describe("getTrialDesignDomains", () => {
  it("returns exactly 5 domains", () => {
    const domains = getTrialDesignDomains();
    expect(domains).toHaveLength(5);
  });

  it("all are trial-design category", () => {
    const domains = getTrialDesignDomains();
    for (const domain of domains) {
      expect(domain.category).toBe("trial-design");
    }
  });

  it("all have autoPopulate=true", () => {
    const domains = getTrialDesignDomains();
    for (const domain of domains) {
      expect(domain.autoPopulate).toBe(true);
    }
  });

  it("returns correct domain codes", () => {
    const codes = getTrialDesignDomains().map((d) => d.code);
    expect(codes).toEqual(["TS", "TA", "TE", "TI", "TV"]);
  });
});

// ---------------------------------------------------------------------------
// getClinicalDomains
// ---------------------------------------------------------------------------
describe("getClinicalDomains", () => {
  it("returns exactly 5 domains", () => {
    const domains = getClinicalDomains();
    expect(domains).toHaveLength(5);
  });

  it("all are clinical category", () => {
    const domains = getClinicalDomains();
    for (const domain of domains) {
      expect(domain.category).toBe("clinical");
    }
  });

  it("all have autoPopulate=false", () => {
    const domains = getClinicalDomains();
    for (const domain of domains) {
      expect(domain.autoPopulate).toBe(false);
    }
  });

  it("returns correct domain codes", () => {
    const codes = getClinicalDomains().map((d) => d.code);
    expect(codes).toEqual(["DM", "AE", "EX", "IS", "LB"]);
  });
});
