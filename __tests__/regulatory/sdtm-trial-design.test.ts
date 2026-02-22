import { describe, it, expect } from "vitest";
import {
  generateTSRows,
  generateTARows,
  generateTERows,
  generateTIRows,
  generateTVRows,
  generateTrialDesignData,
  type SDTMProtocolData,
} from "@/lib/regulatory/sdtm-trial-design";

const FULL_PROTOCOL: SDTMProtocolData = {
  id: "proto-001",
  title: "BNT162b2 Phase III Efficacy Trial",
  study_question: "Does BNT162b2 prevent COVID-19 infection in adults?",
  population:
    "1. Adults aged 18-85\n2. No prior COVID-19 infection\n3. No immunosuppression",
  intervention: "BNT162b2 30mcg IM",
  comparator: "Saline placebo",
  outcomes: "PCR-confirmed symptomatic COVID-19",
  design: "Randomized Controlled Trial",
  status: "draft",
};

const MINIMAL_PROTOCOL: SDTMProtocolData = {
  id: "proto-002",
  title: "Minimal Protocol",
};

// ---------------------------------------------------------------------------
// generateTSRows — Trial Summary
// ---------------------------------------------------------------------------
describe("generateTSRows", () => {
  it("returns exactly 12 parameter rows", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    expect(rows).toHaveLength(12);
  });

  it("all rows have STUDYID set to protocol id", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    for (const row of rows) {
      expect(row.STUDYID).toBe("proto-001");
      expect(row.DOMAIN).toBe("TS");
    }
  });

  it("rows have sequential TSSEQ starting at 1", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    rows.forEach((row, i) => {
      expect(row.TSSEQ).toBe(i + 1);
    });
  });

  it("includes TITLE parameter with protocol title", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    const title = rows.find((r) => r.TSPARMCD === "TITLE");
    expect(title).toBeDefined();
    expect(title!.TSVAL).toBe("BNT162b2 Phase III Efficacy Trial");
  });

  it("includes OBJPRIM parameter with study question", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    const obj = rows.find((r) => r.TSPARMCD === "OBJPRIM");
    expect(obj).toBeDefined();
    expect(obj!.TSVAL).toBe(
      "Does BNT162b2 prevent COVID-19 infection in adults?",
    );
  });

  it("includes TRT parameter with intervention", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    const trt = rows.find((r) => r.TSPARMCD === "TRT");
    expect(trt!.TSVAL).toBe("BNT162b2 30mcg IM");
  });

  it("includes COMPTRT parameter with comparator", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    const ctrl = rows.find((r) => r.TSPARMCD === "COMPTRT");
    expect(ctrl!.TSVAL).toBe("Saline placebo");
  });

  it("includes OUTMSPRI parameter with outcomes", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    const out = rows.find((r) => r.TSPARMCD === "OUTMSPRI");
    expect(out!.TSVAL).toBe("PCR-confirmed symptomatic COVID-19");
  });

  it("PCLAS is always VACCINE", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    const pclas = rows.find((r) => r.TSPARMCD === "PCLAS");
    expect(pclas!.TSVAL).toBe("VACCINE");
  });

  it("uses [Not specified] for missing optional fields", () => {
    const rows = generateTSRows(MINIMAL_PROTOCOL);
    const obj = rows.find((r) => r.TSPARMCD === "OBJPRIM");
    expect(obj!.TSVAL).toBe("[Not specified]");
    const trt = rows.find((r) => r.TSPARMCD === "TRT");
    expect(trt!.TSVAL).toBe("[Not specified]");
  });

  it("uses [TBD] for date fields", () => {
    const rows = generateTSRows(FULL_PROTOCOL);
    const start = rows.find((r) => r.TSPARMCD === "SSTDTC");
    expect(start!.TSVAL).toBe("[TBD]");
    const end = rows.find((r) => r.TSPARMCD === "SENDTC");
    expect(end!.TSVAL).toBe("[TBD]");
    const phase = rows.find((r) => r.TSPARMCD === "TPHASE");
    expect(phase!.TSVAL).toBe("[TBD]");
  });

  it("TTYPE defaults to Interventional when no design", () => {
    const rows = generateTSRows(MINIMAL_PROTOCOL);
    const ttype = rows.find((r) => r.TSPARMCD === "TTYPE");
    expect(ttype!.TSVAL).toBe("Interventional");
  });
});

// ---------------------------------------------------------------------------
// generateTARows — Trial Arms
// ---------------------------------------------------------------------------
describe("generateTARows", () => {
  it("returns exactly 2 arm rows", () => {
    const rows = generateTARows(FULL_PROTOCOL);
    expect(rows).toHaveLength(2);
  });

  it("first row is the treatment arm (TRT)", () => {
    const rows = generateTARows(FULL_PROTOCOL);
    expect(rows[0].ARMCD).toBe("TRT");
    expect(rows[0].ARM).toBe("BNT162b2 30mcg IM");
    expect(rows[0].DOMAIN).toBe("TA");
    expect(rows[0].STUDYID).toBe("proto-001");
  });

  it("second row is the control arm (CTRL)", () => {
    const rows = generateTARows(FULL_PROTOCOL);
    expect(rows[1].ARMCD).toBe("CTRL");
    expect(rows[1].ARM).toBe("Saline placebo");
  });

  it("uses [Not specified] when intervention/comparator missing", () => {
    const rows = generateTARows(MINIMAL_PROTOCOL);
    expect(rows[0].ARM).toBe("[Not specified]");
    expect(rows[1].ARM).toBe("[Not specified]");
  });

  it("both arms have TAETORD=1", () => {
    const rows = generateTARows(FULL_PROTOCOL);
    expect(rows[0].TAETORD).toBe(1);
    expect(rows[1].TAETORD).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// generateTERows — Trial Elements
// ---------------------------------------------------------------------------
describe("generateTERows", () => {
  it("returns exactly 3 element rows", () => {
    const rows = generateTERows(FULL_PROTOCOL);
    expect(rows).toHaveLength(3);
  });

  it("includes Screening, Treatment, and Follow-up", () => {
    const rows = generateTERows(FULL_PROTOCOL);
    const codes = rows.map((r) => r.ETCD);
    expect(codes).toEqual(["SCRN", "TRT", "FU"]);
  });

  it("all rows have correct DOMAIN and STUDYID", () => {
    const rows = generateTERows(FULL_PROTOCOL);
    for (const row of rows) {
      expect(row.DOMAIN).toBe("TE");
      expect(row.STUDYID).toBe("proto-001");
    }
  });

  it("Treatment element has TESTRL start rule", () => {
    const rows = generateTERows(FULL_PROTOCOL);
    const trt = rows.find((r) => r.ETCD === "TRT");
    expect(trt!.TESTRL).toBe("P1D");
  });

  it("Screening element has no TESTRL", () => {
    const rows = generateTERows(FULL_PROTOCOL);
    const scrn = rows.find((r) => r.ETCD === "SCRN");
    expect(scrn!.TESTRL).toBeUndefined();
  });

  it("Follow-up element has no TESTRL", () => {
    const rows = generateTERows(FULL_PROTOCOL);
    const fu = rows.find((r) => r.ETCD === "FU");
    expect(fu!.TESTRL).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generateTIRows — Trial Inclusion/Exclusion
// ---------------------------------------------------------------------------
describe("generateTIRows", () => {
  it("parses numbered criteria from population", () => {
    const rows = generateTIRows(FULL_PROTOCOL);
    // "1. Adults aged 18-85\n2. No prior COVID-19 infection\n3. No immunosuppression"
    expect(rows).toHaveLength(3);
    expect(rows[0].IETEST).toBe("Adults aged 18-85");
    expect(rows[1].IETEST).toBe("No prior COVID-19 infection");
    expect(rows[2].IETEST).toBe("No immunosuppression");
  });

  it("generates sequential IETESTCD codes (IN01, IN02, ...)", () => {
    const rows = generateTIRows(FULL_PROTOCOL);
    expect(rows[0].IETESTCD).toBe("IN01");
    expect(rows[1].IETESTCD).toBe("IN02");
    expect(rows[2].IETESTCD).toBe("IN03");
  });

  it("all rows have IECAT=INCLUSION", () => {
    const rows = generateTIRows(FULL_PROTOCOL);
    for (const row of rows) {
      expect(row.IECAT).toBe("INCLUSION");
      expect(row.DOMAIN).toBe("TI");
    }
  });

  it("returns placeholder when population is missing", () => {
    const rows = generateTIRows(MINIMAL_PROTOCOL);
    expect(rows).toHaveLength(1);
    expect(rows[0].IETESTCD).toBe("IN01");
    expect(rows[0].IETEST).toBe("[Not specified]");
  });

  it("returns placeholder when population is empty string", () => {
    const rows = generateTIRows({ ...MINIMAL_PROTOCOL, population: "" });
    expect(rows).toHaveLength(1);
    expect(rows[0].IETEST).toBe("[Not specified]");
  });

  it("returns placeholder when population is whitespace only", () => {
    const rows = generateTIRows({ ...MINIMAL_PROTOCOL, population: "   " });
    expect(rows).toHaveLength(1);
    expect(rows[0].IETEST).toBe("[Not specified]");
  });

  it("parses newline-separated criteria", () => {
    const protocol = {
      ...MINIMAL_PROTOCOL,
      population: "Adults 18+\nNo chronic disease\nInformed consent",
    };
    const rows = generateTIRows(protocol);
    expect(rows).toHaveLength(3);
    expect(rows[0].IETEST).toBe("Adults 18+");
    expect(rows[1].IETEST).toBe("No chronic disease");
    expect(rows[2].IETEST).toBe("Informed consent");
  });

  it("parses semicolon-separated criteria", () => {
    const protocol = {
      ...MINIMAL_PROTOCOL,
      population: "Adults 18+; No chronic disease; Informed consent",
    };
    const rows = generateTIRows(protocol);
    expect(rows).toHaveLength(3);
  });

  it("returns single criterion when no delimiters found", () => {
    const protocol = {
      ...MINIMAL_PROTOCOL,
      population: "All healthy adults aged 18-65",
    };
    const rows = generateTIRows(protocol);
    expect(rows).toHaveLength(1);
    expect(rows[0].IETEST).toBe("All healthy adults aged 18-65");
  });
});

// ---------------------------------------------------------------------------
// generateTVRows — Trial Visits
// ---------------------------------------------------------------------------
describe("generateTVRows", () => {
  it("returns exactly 8 visit rows", () => {
    const rows = generateTVRows(FULL_PROTOCOL);
    expect(rows).toHaveLength(8);
  });

  it("all rows have correct DOMAIN and STUDYID", () => {
    const rows = generateTVRows(FULL_PROTOCOL);
    for (const row of rows) {
      expect(row.DOMAIN).toBe("TV");
      expect(row.STUDYID).toBe("proto-001");
    }
  });

  it("visit numbers are sequential 1-8", () => {
    const rows = generateTVRows(FULL_PROTOCOL);
    rows.forEach((row, i) => {
      expect(row.VISITNUM).toBe(i + 1);
    });
  });

  it("first visit is Screening at day -14", () => {
    const rows = generateTVRows(FULL_PROTOCOL);
    expect(rows[0].VISIT).toBe("Screening");
    expect(rows[0].VISITDY).toBe(-14);
  });

  it("second visit is Baseline/Day 1 at day 1", () => {
    const rows = generateTVRows(FULL_PROTOCOL);
    expect(rows[1].VISIT).toBe("Baseline/Day 1");
    expect(rows[1].VISITDY).toBe(1);
  });

  it("last visit is End of Study at day 365", () => {
    const rows = generateTVRows(FULL_PROTOCOL);
    const last = rows[rows.length - 1];
    expect(last.VISIT).toBe("End of Study");
    expect(last.VISITDY).toBe(365);
  });

  it("visit days are in ascending order", () => {
    const rows = generateTVRows(FULL_PROTOCOL);
    const days = rows.map((r) => r.VISITDY as number);
    for (let i = 1; i < days.length; i++) {
      expect(days[i]).toBeGreaterThan(days[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// generateTrialDesignData — Master function
// ---------------------------------------------------------------------------
describe("generateTrialDesignData", () => {
  it("returns a Map with 5 domain keys", () => {
    const data = generateTrialDesignData(FULL_PROTOCOL);
    expect(data).toBeInstanceOf(Map);
    expect(data.size).toBe(5);
  });

  it("contains keys for all trial design domains", () => {
    const data = generateTrialDesignData(FULL_PROTOCOL);
    expect(data.has("TS")).toBe(true);
    expect(data.has("TA")).toBe(true);
    expect(data.has("TE")).toBe(true);
    expect(data.has("TI")).toBe(true);
    expect(data.has("TV")).toBe(true);
  });

  it("TS domain has 12 rows", () => {
    const data = generateTrialDesignData(FULL_PROTOCOL);
    expect(data.get("TS")).toHaveLength(12);
  });

  it("TA domain has 2 rows", () => {
    const data = generateTrialDesignData(FULL_PROTOCOL);
    expect(data.get("TA")).toHaveLength(2);
  });

  it("TE domain has 3 rows", () => {
    const data = generateTrialDesignData(FULL_PROTOCOL);
    expect(data.get("TE")).toHaveLength(3);
  });

  it("TI domain row count matches parsed criteria", () => {
    const data = generateTrialDesignData(FULL_PROTOCOL);
    expect(data.get("TI")).toHaveLength(3);
  });

  it("TV domain has 8 rows", () => {
    const data = generateTrialDesignData(FULL_PROTOCOL);
    expect(data.get("TV")).toHaveLength(8);
  });

  it("works with minimal protocol", () => {
    const data = generateTrialDesignData(MINIMAL_PROTOCOL);
    expect(data.size).toBe(5);
    // TI should have 1 placeholder row
    expect(data.get("TI")).toHaveLength(1);
  });
});
