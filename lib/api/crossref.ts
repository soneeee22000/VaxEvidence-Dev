const CROSSREF_BASE_URL = "https://api.crossref.org/works"

export interface CrossrefWork {
  doi: string
  title: string
  authors: string[]
  journal: string
  publishedDate: string | null
  url: string | null
  abstract?: string
}

const normalizeText = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

const normalizeDate = (dateParts: number[] | undefined): string | null => {
  if (!dateParts || dateParts.length === 0) return null
  const [year, month, day] = dateParts
  if (!year) return null
  const normalizedMonth = String(month ?? 1).padStart(2, "0")
  const normalizedDay = String(day ?? 1).padStart(2, "0")
  return `${year}-${normalizedMonth}-${normalizedDay}`
}

const getPublishedDate = (message: any) => {
  const dateSources = [
    message?.published?.["date-parts"]?.[0],
    message?.published_print?.["date-parts"]?.[0],
    message?.published_online?.["date-parts"]?.[0],
    message?.issued?.["date-parts"]?.[0],
  ]
  for (const dateParts of dateSources) {
    const normalized = normalizeDate(dateParts)
    if (normalized) return normalized
  }
  return null
}

const formatAuthors = (authors: any[] | undefined) => {
  if (!Array.isArray(authors)) return []
  return authors
    .map((author) => {
      const given = author?.given ? String(author.given).trim() : ""
      const family = author?.family ? String(author.family).trim() : ""
      return [given, family].filter(Boolean).join(" ").trim()
    })
    .filter(Boolean)
}

export const fetchCrossrefWork = async (doi: string): Promise<CrossrefWork> => {
  const url = `${CROSSREF_BASE_URL}/${encodeURIComponent(doi)}`
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  })
  if (!response.ok) {
    throw new Error(`Crossref fetch failed: ${response.status}`)
  }

  const data = await response.json()
  const message = data?.message ?? {}

  const title = Array.isArray(message?.title) ? message.title[0] : message?.title
  const abstract = message?.abstract ? normalizeText(message.abstract) : undefined

  return {
    doi: message?.DOI ?? doi,
    title: title ? String(title).trim() : "Untitled",
    authors: formatAuthors(message?.author),
    journal: Array.isArray(message?.["container-title"])
      ? message["container-title"][0] ?? ""
      : message?.["container-title"] ?? "",
    publishedDate: getPublishedDate(message),
    url: message?.URL ?? null,
    abstract,
  }
}
