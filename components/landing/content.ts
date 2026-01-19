import {
  BarChart3,
  Clock,
  Database,
  FileText,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

export const featureItems = [
  {
    icon: FileText,
    title: "Protocol Generation",
    description: "AI-powered study protocols following PICO frameworks tailored for vaccine research",
  },
  {
    icon: Database,
    title: "Multi-Database Integration",
    description: "Connect European EHR databases, US claims data, and vaccine registries in one platform",
  },
  {
    icon: Shield,
    title: "Regulatory Compliance",
    description: "FDA RWE framework and EMA DARWIN EU compatible exports built-in",
  },
  {
    icon: TrendingUp,
    title: "Vaccine-Specific Endpoints",
    description: "Pre-configured for seroconversion, breakthrough infections, and effectiveness metrics",
  },
  {
    icon: Users,
    title: "Collaboration Tools",
    description: "Built for cross-functional teams: epidemiologists, medical affairs, regulatory",
  },
  {
    icon: BarChart3,
    title: "Automated Reporting",
    description: "One-click PRISMA flowcharts, STROBE checklists, and publication-ready tables",
  },
]

export const crisisCards = [
  {
    value: "6+ months",
    title: "Study Protocol Development",
    description: "Manual literature reviews, database queries, and protocol writing",
    tone: "danger",
  },
  {
    value: "15+ hours",
    title: "Per Systematic Review",
    description: "Screening hundreds of papers manually with high error rates",
    tone: "warning",
  },
  {
    value: "$50K+",
    title: "Cost Per Study",
    description: "Senior epidemiologist time, database access, regulatory compliance",
    tone: "accent",
  },
]

export const workflowSteps = [
  { step: "01", title: "Define Study", desc: "Enter vaccine type, population, and research question" },
  { step: "02", title: "AI Analysis", desc: "Automated literature search and data extraction" },
  { step: "03", title: "Review & Refine", desc: "Collaborate with team on AI-generated protocol" },
  { step: "04", title: "Export & Submit", desc: "Regulatory-ready documents in FDA/EMA format" },
]

export const heroHighlights = [
  { icon: Shield, label: "FDA/EMA Compliant" },
  { icon: Clock, label: "No Credit Card" },
  { icon: Zap, label: "14-Day Trial" },
]
