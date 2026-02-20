import { describe, it, expect } from "vitest";
import {
  buildPicoPrompt,
  buildSynthesisPrompt,
  buildGapAnalysisPrompt,
  buildSearchQueryPrompt,
  buildRankingPrompt,
  buildQualityScorePrompt,
  VACCINE_RESEARCH_SYSTEM_PROMPT,
  MAX_EVIDENCE_IN_PROMPT,
  MAX_ABSTRACT_LENGTH,
  MAX_ARTICLE_ABSTRACT_LENGTH,
} from "@/lib/ai/prompt-builders";
import type { EvidenceItem } from "@/lib/validators/evidence";
import type { PubMedArticle } from "@/lib/api/pubmed";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const baseProtocol = {
  title: "COVID-19 mRNA Vaccine Effectiveness in Elderly",
  study_question: "What is the effectiveness of BNT162b2 in adults aged 65+?",
  population: "Adults aged 65 and older in the United States",
  intervention: "BNT162b2 (Pfizer-BioNTech) two-dose primary series",
  comparator: "Unvaccinated age-matched controls",
  outcomes: "Symptomatic COVID-19 infection, hospitalization, death",
  design: "Test-negative case-control study",
};

const baseEvidence: EvidenceItem = {
  id: "ev-1",
  user_id: "u-1",
  type: "academic",
  title: "BNT162b2 Effectiveness in Older Adults",
  description: "A retrospective cohort study assessing vaccine effectiveness.",
  authors: "Smith J, Doe A",
  journal: "NEJM",
  doi: "10.1000/test",
  regulatory_body: null,
  document_type: null,
  source_url: null,
  publication_date: "2024-01-15",
  tags: ["COVID-19", "elderly", "vaccine effectiveness"],
  status: "published",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const baseArticle: PubMedArticle = {
  pmid: "12345678",
  title: "mRNA Vaccine Effectiveness Study",
  authors: ["Smith J", "Doe A"],
  journal: "NEJM",
  pubDate: "2024",
  doi: "10.1000/test",
  sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/12345678/",
  abstract: "This study assessed the effectiveness of mRNA vaccines.",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VACCINE_RESEARCH_SYSTEM_PROMPT", () => {
  it("mentions vaccine research and PICO", () => {
    expect(VACCINE_RESEARCH_SYSTEM_PROMPT).toContain("vaccine");
    expect(VACCINE_RESEARCH_SYSTEM_PROMPT).toContain("PICO");
  });

  it("references regulatory standards", () => {
    expect(VACCINE_RESEARCH_SYSTEM_PROMPT).toContain("FDA");
    expect(VACCINE_RESEARCH_SYSTEM_PROMPT).toContain("EMA");
  });
});

describe("buildPicoPrompt", () => {
  it("includes the research question in the prompt", () => {
    const question =
      "What is the effectiveness of mRNA COVID-19 vaccines in elderly?";
    const prompt = buildPicoPrompt(question);
    expect(prompt).toContain(question);
  });

  it("references PICO framework", () => {
    const prompt = buildPicoPrompt("test question about vaccines");
    expect(prompt).toContain("PICO");
    expect(prompt).toContain("Population");
    expect(prompt).toContain("Intervention");
    expect(prompt).toContain("Comparator");
    expect(prompt).toContain("Outcomes");
  });

  it("requests specific vaccine research context", () => {
    const prompt = buildPicoPrompt("test");
    expect(prompt).toContain("vaccine");
  });
});

describe("buildSynthesisPrompt", () => {
  it("includes protocol title and research question", () => {
    const prompt = buildSynthesisPrompt(baseProtocol, [baseEvidence]);
    expect(prompt).toContain(baseProtocol.title);
    expect(prompt).toContain(baseProtocol.study_question);
  });

  it("includes all PICO fields", () => {
    const prompt = buildSynthesisPrompt(baseProtocol, [baseEvidence]);
    expect(prompt).toContain(baseProtocol.population);
    expect(prompt).toContain(baseProtocol.intervention);
    expect(prompt).toContain(baseProtocol.comparator);
    expect(prompt).toContain(baseProtocol.outcomes);
  });

  it("caps evidence at MAX_EVIDENCE_IN_PROMPT items", () => {
    const manyEvidence = Array.from({ length: 30 }, (_, i) => ({
      ...baseEvidence,
      id: `ev-${i}`,
      title: `Study ${i}`,
    }));
    const prompt = buildSynthesisPrompt(baseProtocol, manyEvidence);

    // Should reference total count
    expect(prompt).toContain("30 items");
    // Should only include first MAX_EVIDENCE_IN_PROMPT studies
    expect(prompt).toContain(`[${MAX_EVIDENCE_IN_PROMPT}]`);
    expect(prompt).not.toContain(`[${MAX_EVIDENCE_IN_PROMPT + 1}]`);
  });

  it("truncates long abstracts", () => {
    const longAbstract = "A".repeat(1000);
    const evidence = {
      ...baseEvidence,
      description: longAbstract,
    };
    const prompt = buildSynthesisPrompt(baseProtocol, [evidence]);
    // The abstract portion should be truncated to MAX_ABSTRACT_LENGTH
    const abstractInPrompt = prompt.match(/Abstract: (A+)/)?.[1] ?? "";
    expect(abstractInPrompt.length).toBe(MAX_ABSTRACT_LENGTH);
  });

  it("handles empty evidence array", () => {
    const prompt = buildSynthesisPrompt(baseProtocol, []);
    expect(prompt).toContain("0 items");
  });

  it("handles missing intervention gracefully", () => {
    const noIntervention = { ...baseProtocol, intervention: "" };
    const prompt = buildSynthesisPrompt(noIntervention, []);
    expect(prompt).toContain("Not specified");
  });
});

describe("buildGapAnalysisPrompt", () => {
  it("includes all PICO fields", () => {
    const prompt = buildGapAnalysisPrompt(baseProtocol, [baseEvidence]);
    expect(prompt).toContain(baseProtocol.population);
    expect(prompt).toContain(baseProtocol.outcomes);
  });

  it("includes evidence types and tags", () => {
    const prompt = buildGapAnalysisPrompt(baseProtocol, [baseEvidence]);
    expect(prompt).toContain("academic");
    expect(prompt).toContain("COVID-19");
  });

  it("includes evidence count", () => {
    const prompt = buildGapAnalysisPrompt(baseProtocol, [
      baseEvidence,
      { ...baseEvidence, id: "ev-2", title: "Study 2" },
    ]);
    expect(prompt).toContain("2 items");
  });
});

describe("buildSearchQueryPrompt", () => {
  it("includes PICO elements", () => {
    const prompt = buildSearchQueryPrompt(baseProtocol);
    expect(prompt).toContain(baseProtocol.population);
    expect(prompt).toContain(baseProtocol.intervention);
  });

  it("requests multiple query types", () => {
    const prompt = buildSearchQueryPrompt(baseProtocol);
    expect(prompt).toContain("Broad");
    expect(prompt).toContain("Specific");
    expect(prompt).toContain("safety");
  });

  it("requests PubMed syntax", () => {
    const prompt = buildSearchQueryPrompt(baseProtocol);
    expect(prompt).toContain("MeSH");
    expect(prompt).toContain("Boolean");
  });
});

describe("buildRankingPrompt", () => {
  it("includes PICO context and article details", () => {
    const prompt = buildRankingPrompt(baseProtocol, [baseArticle]);
    expect(prompt).toContain(baseProtocol.population);
    expect(prompt).toContain(baseArticle.pmid);
    expect(prompt).toContain(baseArticle.title);
  });

  it("includes article count", () => {
    const articles = [
      baseArticle,
      { ...baseArticle, pmid: "99999999", title: "Another Study" },
    ];
    const prompt = buildRankingPrompt(baseProtocol, articles);
    expect(prompt).toContain("2");
  });

  it("truncates long abstracts in articles", () => {
    const longAbstract = "B".repeat(800);
    const article = { ...baseArticle, abstract: longAbstract };
    const prompt = buildRankingPrompt(baseProtocol, [article]);
    const abstractInPrompt = prompt.match(/Abstract: (B+)/)?.[1] ?? "";
    expect(abstractInPrompt.length).toBe(MAX_ARTICLE_ABSTRACT_LENGTH);
  });

  it("handles missing abstract", () => {
    const noAbstract = { ...baseArticle, abstract: undefined };
    const prompt = buildRankingPrompt(baseProtocol, [noAbstract]);
    expect(prompt).toContain("No abstract available");
  });
});

describe("buildQualityScorePrompt", () => {
  it("includes evidence type and title", () => {
    const prompt = buildQualityScorePrompt(baseEvidence);
    expect(prompt).toContain("academic");
    expect(prompt).toContain(baseEvidence.title);
  });

  it("includes authors and journal", () => {
    const prompt = buildQualityScorePrompt(baseEvidence);
    expect(prompt).toContain("Smith J, Doe A");
    expect(prompt).toContain("NEJM");
  });

  it("references CEBM framework", () => {
    const prompt = buildQualityScorePrompt(baseEvidence);
    expect(prompt).toContain("CEBM");
  });

  it("handles null authors and journal", () => {
    const noAuthors = {
      ...baseEvidence,
      authors: null,
      journal: null,
    };
    const prompt = buildQualityScorePrompt(noAuthors);
    expect(prompt).toContain("Unknown");
  });

  it("includes tags", () => {
    const prompt = buildQualityScorePrompt(baseEvidence);
    expect(prompt).toContain("COVID-19");
    expect(prompt).toContain("elderly");
  });
});
