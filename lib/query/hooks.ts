"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchEvidenceItemsPaginated,
  getUniqueTags as getEvidenceTags,
  type EvidenceListParams,
} from "@/lib/supabase/evidence";
import {
  fetchDatasetsPaginated,
  getUniqueTags as getDatasetTags,
  type DatasetListParams,
} from "@/lib/supabase/datasets";
import {
  fetchProtocolsPaginated,
  type ProtocolListParams,
} from "@/lib/supabase/protocols";

/**
 * Query key factory for cache key consistency.
 * All keys are arrays — React Query uses structural equality.
 */
export const queryKeys = {
  evidence: {
    all: ["evidence"] as const,
    list: (params: EvidenceListParams) => ["evidence", "list", params] as const,
    tags: () => ["evidence", "tags"] as const,
  },
  datasets: {
    all: ["datasets"] as const,
    list: (params: DatasetListParams) => ["datasets", "list", params] as const,
    tags: () => ["datasets", "tags"] as const,
  },
  protocols: {
    all: ["protocols"] as const,
    list: (params: ProtocolListParams) =>
      ["protocols", "list", params] as const,
  },
};

/**
 * Fetch paginated evidence items with server-side search and filtering.
 */
export function useEvidenceList(params: EvidenceListParams) {
  return useQuery({
    queryKey: queryKeys.evidence.list(params),
    queryFn: async () => {
      const result = await fetchEvidenceItemsPaginated(params);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch paginated datasets with server-side search and filtering.
 */
export function useDatasetList(params: DatasetListParams) {
  return useQuery({
    queryKey: queryKeys.datasets.list(params),
    queryFn: async () => {
      const result = await fetchDatasetsPaginated(params);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch paginated protocols with server-side search and filtering.
 */
export function useProtocolList(params: ProtocolListParams) {
  return useQuery({
    queryKey: queryKeys.protocols.list(params),
    queryFn: async () => {
      const result = await fetchProtocolsPaginated(params);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch all unique tags from evidence items.
 */
export function useEvidenceTags() {
  return useQuery({
    queryKey: queryKeys.evidence.tags(),
    queryFn: async () => {
      const result = await getEvidenceTags();
      if (result.error) throw new Error(result.error.message);
      return result.data ?? [];
    },
    staleTime: 60_000,
  });
}

/**
 * Fetch all unique tags from datasets.
 */
export function useDatasetTags() {
  return useQuery({
    queryKey: queryKeys.datasets.tags(),
    queryFn: async () => {
      const result = await getDatasetTags();
      if (result.error) throw new Error(result.error.message);
      return result.data ?? [];
    },
    staleTime: 60_000,
  });
}
