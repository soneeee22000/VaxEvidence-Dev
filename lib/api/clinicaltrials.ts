const CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

export interface ClinicalTrialStudy {
  nctId: string
  title: string
  status: string
  phase: string
  sponsor: string
  conditions: string[]
  interventions: string[]
  summary: string
  startDate: string | null
  completionDate: string | null
  sourceUrl: string
}

const normalizeDate = (dateStruct: any) => {
  if (!dateStruct) return null
  const date = dateStruct?.date ?? dateStruct?.startDate ?? null
  if (!date) return null
  try {
    return new Date(date).toISOString().slice(0, 10)
  } catch {
    return null
  }
}

const getPhase = (phases: string[] | undefined) => {
  if (!Array.isArray(phases) || phases.length === 0) return ""
  return phases.join(", ")
}

const getInterventions = (interventions: any[] | undefined) => {
  if (!Array.isArray(interventions)) return []
  return interventions
    .map((item) => item?.name ?? item?.interventionName)
    .filter(Boolean)
    .map((name) => String(name))
}

export const searchClinicalTrials = async (
  query: string,
  maxResults = 20
): Promise<ClinicalTrialStudy[]> => {
  const url = new URL(CLINICAL_TRIALS_BASE_URL)
  url.searchParams.set("query.term", query)
  url.searchParams.set("pageSize", String(maxResults))

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`ClinicalTrials search failed: ${response.status}`)
  }

  const data = await response.json()
  const studies = Array.isArray(data?.studies) ? data.studies : []

  return studies.map((study: any) => {
    const protocol = study?.protocolSection ?? {}
    const identification = protocol?.identificationModule ?? {}
    const status = protocol?.statusModule ?? {}
    const conditions = protocol?.conditionsModule ?? {}
    const interventions = protocol?.armsInterventionsModule ?? {}
    const design = protocol?.designModule ?? {}
    const sponsor = protocol?.sponsorCollaboratorsModule ?? {}
    const description = protocol?.descriptionModule ?? {}

    const nctId = identification?.nctId ?? identification?.orgStudyId ?? ""
    const title =
      identification?.briefTitle ??
      identification?.officialTitle ??
      "Untitled trial"

    const sponsorName = sponsor?.leadSponsor?.name ?? sponsor?.leadSponsor?.agency ?? ""

    const sourceUrl = nctId
      ? `https://clinicaltrials.gov/study/${nctId}`
      : "https://clinicaltrials.gov"

    return {
      nctId,
      title,
      status: status?.overallStatus ?? "",
      phase: getPhase(design?.phases),
      sponsor: sponsorName,
      conditions: Array.isArray(conditions?.conditions) ? conditions.conditions : [],
      interventions: getInterventions(interventions?.interventions),
      summary: description?.briefSummary ?? "",
      startDate: normalizeDate(status?.startDateStruct ?? status?.startDate),
      completionDate: normalizeDate(status?.completionDateStruct ?? status?.completionDate),
      sourceUrl,
    }
  })
}
