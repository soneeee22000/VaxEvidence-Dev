// =============================================================================
// DEV-ONLY PROTOCOL STORAGE
// =============================================================================
// Uses localStorage for development. In production, replace with Supabase.
// =============================================================================

export type ProtocolStatus = "draft" | "in_review" | "final"

export interface Protocol {
  id: string
  title: string
  study_question: string
  population: string
  comparator: string
  outcomes: string
  design: string
  status: ProtocolStatus
  user_id: string
  created_at: string
  updated_at: string
}

export type ProtocolFormData = Omit<Protocol, "id" | "created_at" | "updated_at">

const STORAGE_KEY = "vaxevidence_protocols"

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return `protocol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get all protocols from localStorage
 */
export function getProtocols(): Protocol[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored) as Protocol[]
  } catch {
    return []
  }
}

/**
 * Get a single protocol by ID
 */
export function getProtocolById(id: string): Protocol | null {
  const protocols = getProtocols()
  return protocols.find((p) => p.id === id) ?? null
}

/**
 * Create a new protocol
 */
export function createProtocol(data: ProtocolFormData): Protocol {
  const protocols = getProtocols()
  const now = new Date().toISOString()
  
  const newProtocol: Protocol = {
    ...data,
    id: generateId(),
    created_at: now,
    updated_at: now,
  }
  
  protocols.push(newProtocol)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(protocols))
  
  return newProtocol
}

/**
 * Update an existing protocol
 */
export function updateProtocol(id: string, data: Partial<ProtocolFormData>): Protocol | null {
  const protocols = getProtocols()
  const index = protocols.findIndex((p) => p.id === id)
  
  if (index === -1) return null
  
  const updated: Protocol = {
    ...protocols[index],
    ...data,
    updated_at: new Date().toISOString(),
  }
  
  protocols[index] = updated
  localStorage.setItem(STORAGE_KEY, JSON.stringify(protocols))
  
  return updated
}

/**
 * Delete a protocol
 */
export function deleteProtocol(id: string): boolean {
  const protocols = getProtocols()
  const filtered = protocols.filter((p) => p.id !== id)
  
  if (filtered.length === protocols.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

/**
 * Seed with sample data (for demo purposes)
 */
export function seedSampleProtocols(userId: string): void {
  const existing = getProtocols()
  if (existing.length > 0) return // Don't seed if data exists
  
  const now = new Date().toISOString()
  const samples: Protocol[] = [
    {
      id: generateId(),
      title: "COVID-19 Vaccine Effectiveness Study 2026",
      study_question: "What is the real-world effectiveness of updated COVID-19 vaccines against symptomatic infection in adults aged 18-65?",
      population: "Adults aged 18-65, no prior COVID-19 infection in past 6 months",
      comparator: "Unvaccinated individuals matched by age and comorbidities",
      outcomes: "Primary: Symptomatic COVID-19 infection. Secondary: Hospitalization, severe disease",
      design: "Test-negative case-control study",
      status: "in_review",
      user_id: userId,
      created_at: now,
      updated_at: now,
    },
    {
      id: generateId(),
      title: "Influenza Vaccine Safety Monitoring",
      study_question: "Are there any safety signals associated with the 2025-2026 seasonal influenza vaccine?",
      population: "All individuals receiving flu vaccine at participating sites",
      comparator: "Historical safety data from previous seasons",
      outcomes: "Adverse events within 42 days of vaccination",
      design: "Prospective cohort with active surveillance",
      status: "draft",
      user_id: userId,
      created_at: now,
      updated_at: now,
    },
  ]
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(samples))
}
