import { suggestedTags } from "@/lib/validators/evidence"

const normalize = (value: string) => value.toLowerCase()

const matcherPairs: Array<{ tag: string; patterns: string[] }> = [
  { tag: "Phase 1", patterns: ["phase 1", "phase i"] },
  { tag: "Phase 2", patterns: ["phase 2", "phase ii"] },
  { tag: "Phase 3", patterns: ["phase 3", "phase iii"] },
  { tag: "Phase 4", patterns: ["phase 4", "phase iv"] },
  { tag: "RCT", patterns: ["randomized", "randomised", "rct"] },
  { tag: "meta-analysis", patterns: ["meta-analysis", "meta analysis"] },
  { tag: "systematic review", patterns: ["systematic review", "systematic-review"] },
  { tag: "observational study", patterns: ["observational", "observational study"] },
  { tag: "case-control", patterns: ["case-control", "case control"] },
  { tag: "cohort study", patterns: ["cohort study", "cohort"] },
  { tag: "safety", patterns: ["safety", "adverse event", "adverse events"] },
  { tag: "efficacy", patterns: ["efficacy", "effective", "effectiveness"] },
  { tag: "immunogenicity", patterns: ["immunogenicity", "immune response"] },
  { tag: "vaccine effectiveness", patterns: ["vaccine effectiveness"] },
  { tag: "clinical trial", patterns: ["clinical trial", "trial"] },
]

const buildSuggestedTagMap = () => {
  return suggestedTags.map((tag) => ({
    tag,
    pattern: normalize(tag),
  }))
}

const suggestedTagPatterns = buildSuggestedTagMap()

export const autoTagEvidence = (inputs: string[]): string[] => {
  const combined = normalize(inputs.filter(Boolean).join(" "))
  if (!combined) return []

  const matches = new Set<string>()

  for (const matcher of matcherPairs) {
    if (matcher.patterns.some((pattern) => combined.includes(pattern))) {
      matches.add(matcher.tag)
    }
  }

  for (const suggested of suggestedTagPatterns) {
    if (combined.includes(suggested.pattern)) {
      matches.add(suggested.tag)
    }
  }

  return Array.from(matches)
}
