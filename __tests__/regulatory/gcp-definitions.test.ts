import { describe, it, expect } from "vitest";
import {
  GCP_PRINCIPLES,
  GCP_PRINCIPLE_COUNT,
} from "@/lib/regulatory/gcp-principles";
import {
  GCP_PROTOCOL_SECTIONS,
  GCP_PROTOCOL_SECTION_COUNT,
} from "@/lib/regulatory/gcp-protocol-sections";
import {
  GCP_ESSENTIAL_DOCUMENTS,
  GCP_ESSENTIAL_DOCUMENT_COUNT,
  getDocumentsByPhase,
  getTrackedDocuments,
} from "@/lib/regulatory/gcp-essential-documents";

describe("GCP_PRINCIPLES", () => {
  it("has exactly 13 principles", () => {
    expect(GCP_PRINCIPLES.length).toBe(13);
    expect(GCP_PRINCIPLE_COUNT).toBe(13);
  });

  it("principles are numbered 1–13", () => {
    for (let i = 0; i < GCP_PRINCIPLES.length; i++) {
      expect(GCP_PRINCIPLES[i].number).toBe(i + 1);
    }
  });

  it("every principle has required fields", () => {
    for (const p of GCP_PRINCIPLES) {
      expect(p.number).toBeGreaterThanOrEqual(1);
      expect(p.number).toBeLessThanOrEqual(13);
      expect(p.title).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(Array.isArray(p.complianceMapping)).toBe(true);
    }
  });

  it("has unique principle numbers", () => {
    const numbers = GCP_PRINCIPLES.map((p) => p.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("some principles map to VaxEvidence data sources", () => {
    const withMapping = GCP_PRINCIPLES.filter(
      (p) => p.complianceMapping.length > 0,
    );
    expect(withMapping.length).toBeGreaterThanOrEqual(5);
  });
});

describe("GCP_PROTOCOL_SECTIONS", () => {
  it("has 20 sections (6.1–6.16 with sub-sections)", () => {
    expect(GCP_PROTOCOL_SECTIONS.length).toBe(20);
    expect(GCP_PROTOCOL_SECTION_COUNT).toBe(20);
  });

  it("every section has required fields", () => {
    for (const s of GCP_PROTOCOL_SECTIONS) {
      expect(s.sectionNumber).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(Array.isArray(s.picoMapping)).toBe(true);
    }
  });

  it("has unique section numbers", () => {
    const numbers = GCP_PROTOCOL_SECTIONS.map((s) => s.sectionNumber);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("starts with section 6.1", () => {
    expect(GCP_PROTOCOL_SECTIONS[0].sectionNumber).toBe("6.1");
  });

  it("ends with section 6.16", () => {
    const last = GCP_PROTOCOL_SECTIONS[GCP_PROTOCOL_SECTIONS.length - 1];
    expect(last.sectionNumber).toBe("6.16");
  });

  it("includes sub-sections 6.4.1–6.4.4", () => {
    const subSections = GCP_PROTOCOL_SECTIONS.filter((s) =>
      s.sectionNumber.startsWith("6.4."),
    );
    expect(subSections.length).toBe(4);
  });

  it("key sections have PICO mappings", () => {
    const objectivesSection = GCP_PROTOCOL_SECTIONS.find(
      (s) => s.sectionNumber === "6.3",
    );
    expect(objectivesSection?.picoMapping).toContain("protocol.study_question");

    const populationSection = GCP_PROTOCOL_SECTIONS.find(
      (s) => s.sectionNumber === "6.5",
    );
    expect(populationSection?.picoMapping).toContain("protocol.population");

    const treatmentSection = GCP_PROTOCOL_SECTIONS.find(
      (s) => s.sectionNumber === "6.6",
    );
    expect(treatmentSection?.picoMapping).toContain("protocol.intervention");
  });
});

describe("GCP_ESSENTIAL_DOCUMENTS", () => {
  it("has documents across all three phases", () => {
    expect(GCP_ESSENTIAL_DOCUMENTS.length).toBeGreaterThanOrEqual(28);
    expect(GCP_ESSENTIAL_DOCUMENT_COUNT).toBe(GCP_ESSENTIAL_DOCUMENTS.length);
  });

  it("every document has required fields", () => {
    for (const doc of GCP_ESSENTIAL_DOCUMENTS) {
      expect(doc.id).toBeTruthy();
      expect(doc.title).toBeTruthy();
      expect(doc.purpose).toBeTruthy();
      expect(["before", "during", "after"]).toContain(doc.phase);
      expect(typeof doc.trackedByVaxEvidence).toBe("boolean");
    }
  });

  it("has unique document IDs", () => {
    const ids = GCP_ESSENTIAL_DOCUMENTS.map((doc) => doc.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("document IDs follow 8.x.x pattern", () => {
    for (const doc of GCP_ESSENTIAL_DOCUMENTS) {
      expect(doc.id).toMatch(/^8\.\d+\.\d+$/);
    }
  });
});

describe("getDocumentsByPhase", () => {
  it("returns before-phase documents", () => {
    const before = getDocumentsByPhase("before");
    expect(before.length).toBeGreaterThan(0);
    expect(before.every((d) => d.phase === "before")).toBe(true);
  });

  it("returns during-phase documents", () => {
    const during = getDocumentsByPhase("during");
    expect(during.length).toBeGreaterThan(0);
    expect(during.every((d) => d.phase === "during")).toBe(true);
  });

  it("returns after-phase documents", () => {
    const after = getDocumentsByPhase("after");
    expect(after.length).toBeGreaterThan(0);
    expect(after.every((d) => d.phase === "after")).toBe(true);
  });

  it("all phases sum to total document count", () => {
    const before = getDocumentsByPhase("before");
    const during = getDocumentsByPhase("during");
    const after = getDocumentsByPhase("after");
    expect(before.length + during.length + after.length).toBe(
      GCP_ESSENTIAL_DOCUMENT_COUNT,
    );
  });
});

describe("getTrackedDocuments", () => {
  it("returns only documents tracked by VaxEvidence", () => {
    const tracked = getTrackedDocuments();
    expect(tracked.length).toBeGreaterThan(0);
    expect(tracked.every((d) => d.trackedByVaxEvidence === true)).toBe(true);
  });

  it("tracked documents have vaxEvidenceSource", () => {
    const tracked = getTrackedDocuments();
    for (const doc of tracked) {
      expect(doc.vaxEvidenceSource).toBeTruthy();
    }
  });
});
