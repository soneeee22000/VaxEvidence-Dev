import type { SupabaseClient } from "@supabase/supabase-js"

const OPTIONAL_IMPORT_FIELDS = ["external_id", "external_source", "imported_at"]

const shouldRetryWithoutOptionalFields = (message: string | null) => {
  if (!message) return false
  const normalized = message.toLowerCase()
  return OPTIONAL_IMPORT_FIELDS.some((field) => {
    const containsQuotedColumn = normalized.includes(`column "${field}"`)
    const containsFieldName = normalized.includes(field.toLowerCase())
    return containsQuotedColumn || containsFieldName
  })
}

export const insertEvidenceWithFallback = async (
  supabaseAdmin: SupabaseClient,
  payload: Record<string, any>
) => {
  const attemptInsert = async (data: Record<string, any>) => {
    return supabaseAdmin.from("evidence_items").insert(data).select("*").single()
  }

  const initial = await attemptInsert(payload)
  if (!initial.error) return initial

  if (shouldRetryWithoutOptionalFields(initial.error.message ?? null)) {
    const trimmed = { ...payload }
    for (const field of OPTIONAL_IMPORT_FIELDS) {
      delete trimmed[field]
    }
    return attemptInsert(trimmed)
  }

  return initial
}
