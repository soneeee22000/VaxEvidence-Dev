const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

export interface PubMedArticle {
  pmid: string
  title: string
  authors: string[]
  journal: string
  pubDate: string
  doi?: string
  sourceUrl: string
  abstract?: string
}

const getApiKey = () => process.env.NCBI_API_KEY

const buildUrl = (path: string, params: Record<string, string>) => {
  const url = new URL(`${PUBMED_BASE_URL}/${path}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  const apiKey = getApiKey()
  if (apiKey) {
    url.searchParams.set("api_key", apiKey)
  }
  return url.toString()
}

const normalizeAbstract = (xml: string) => {
  const matches = Array.from(xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g))
  if (matches.length === 0) return ""
  const text = matches
    .map((match) => match[1] ?? "")
    .join("\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text
}

const extractDoi = (summary: any) => {
  const articleIds = Array.isArray(summary?.articleids) ? summary.articleids : []
  const doi = articleIds.find((item: any) => item?.idtype === "doi")?.value
  if (doi) return doi
  if (typeof summary?.elocationid === "string") {
    const doiFromElocation = summary.elocationid.split(" ")[0]
    if (doiFromElocation?.startsWith("10.")) return doiFromElocation
  }
  return undefined
}

export const searchPubMed = async (query: string, maxResults = 20) => {
  const url = buildUrl("esearch.fcgi", {
    db: "pubmed",
    term: query,
    retmax: String(maxResults),
    retmode: "json",
  })
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`PubMed search failed: ${response.status}`)
  }
  const data = await response.json()
  return (data?.esearchresult?.idlist as string[]) ?? []
}

export const fetchPubMedSummaries = async (pmids: string[]): Promise<PubMedArticle[]> => {
  if (pmids.length === 0) return []
  const url = buildUrl("esummary.fcgi", {
    db: "pubmed",
    id: pmids.join(","),
    retmode: "json",
  })
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`PubMed summary failed: ${response.status}`)
  }
  const data = await response.json()
  return pmids.map((pmid) => {
    const summary = data?.result?.[pmid] ?? {}
    return {
      pmid,
      title: summary?.title ?? "Untitled",
      authors: (summary?.authors ?? []).map((author: any) => author?.name).filter(Boolean),
      journal: summary?.fulljournalname ?? "",
      pubDate: summary?.pubdate ?? "",
      doi: extractDoi(summary),
      sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    }
  })
}

export const fetchPubMedAbstract = async (pmid: string) => {
  const url = buildUrl("efetch.fcgi", {
    db: "pubmed",
    id: pmid,
    retmode: "xml",
  })
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`PubMed abstract failed: ${response.status}`)
  }
  const xml = await response.text()
  return normalizeAbstract(xml)
}

export const fetchPubMedArticle = async (pmid: string): Promise<PubMedArticle> => {
  const [summary] = await fetchPubMedSummaries([pmid])
  const abstract = await fetchPubMedAbstract(pmid)
  return {
    ...summary,
    abstract: abstract || undefined,
  }
}
