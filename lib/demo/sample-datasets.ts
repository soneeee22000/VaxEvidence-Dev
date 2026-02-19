/**
 * Sample demo datasets for demonstration purposes.
 * These can be loaded into the application to showcase features.
 */

export interface SampleDataset {
  id: string
  name: string
  description: string
  fileName: string
  filePath: string
  datasetType: 'clinical_trial' | 'surveillance' | 'safety' | 'efficacy' | 'other'
  tags: string[]
  rowCount: number
  columnCount: number
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'demo-vaccine-clinical-trial',
    name: 'Vaccine Clinical Trial Sample Data',
    description: 'Sample Phase 3 clinical trial data for mRNA-VE001 vaccine study. Includes participant demographics, dosing information, adverse events, and efficacy endpoints. This fictional dataset demonstrates typical vaccine trial data structure.',
    fileName: 'vaccine-clinical-trial-sample.csv',
    filePath: '/demo/vaccine-clinical-trial-sample.csv',
    datasetType: 'clinical_trial',
    tags: ['Phase 3', 'mRNA', 'Efficacy', 'Safety', 'Sample Data'],
    rowCount: 50,
    columnCount: 13,
  },
]

/**
 * Fetch a sample dataset file from the public directory
 */
export async function fetchSampleDatasetFile(filePath: string): Promise<File | null> {
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      console.error(`Failed to fetch sample dataset: ${response.statusText}`)
      return null
    }

    const blob = await response.blob()
    const fileName = filePath.split('/').pop() || 'sample-data.csv'
    return new File([blob], fileName, { type: 'text/csv' })
  } catch (error) {
    console.error('Error fetching sample dataset:', error)
    return null
  }
}
