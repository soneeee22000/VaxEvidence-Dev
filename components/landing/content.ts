import {
  BarChart3,
  BookOpen,
  Brain,
  FileText,
  Shield,
  Users,
} from "lucide-react";

export const featureItems = [
  {
    icon: FileText,
    title: "Protocol Builder",
    description:
      "Create PICO-based study protocols with structured fields for population, intervention, comparator, and outcomes.",
  },
  {
    icon: BookOpen,
    title: "Evidence Library",
    description:
      "Import from PubMed, ClinicalTrials.gov, and CrossRef. Organize with tags, filters, and full-text search.",
  },
  {
    icon: Shield,
    title: "Regulatory Export",
    description:
      "FDA IND packages, eCTD Module 5, CDISC/SDTM templates, CONSORT/STROBE checklists — one click.",
  },
  {
    icon: Brain,
    title: "AI Research Assistant",
    description:
      "Generate PICO frameworks, synthesize evidence, and get AI-powered recommendations for your study design.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Real-time co-editing with presence indicators, comments with @mentions, and version history tracking.",
  },
  {
    icon: BarChart3,
    title: "Systematic Review",
    description:
      "PRISMA-compliant screening pipeline, risk-of-bias assessment, meta-analysis with forest plots.",
  },
];

export const crisisCards = [
  {
    value: "6+ months",
    title: "Study Protocol Development",
    description:
      "Manual literature reviews, database queries, and protocol writing consume valuable research time.",
  },
  {
    value: "15+ hours",
    title: "Per Systematic Review",
    description:
      "Screening hundreds of papers manually is slow and prone to human error.",
  },
  {
    value: "$50K+",
    title: "Cost Per Study",
    description:
      "Senior epidemiologist time, database access, and regulatory compliance add up fast.",
  },
];

export const workflowSteps = [
  {
    step: "01",
    title: "Define Study",
    desc: "Enter your research question using PICO framework fields.",
  },
  {
    step: "02",
    title: "Gather Evidence",
    desc: "Search PubMed and clinical trial registries from one interface.",
  },
  {
    step: "03",
    title: "Review & Collaborate",
    desc: "Screen evidence, assess risk of bias, and co-edit with your team.",
  },
  {
    step: "04",
    title: "Export & Submit",
    desc: "Generate FDA IND, eCTD, or SDTM packages ready for submission.",
  },
];
