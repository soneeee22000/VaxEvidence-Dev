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
import {
  fetchActivityLogPaginated,
  type ActivityListParams,
} from "@/lib/supabase/activity";
import type { ScreeningDecisionWithEvidence } from "@/lib/validators/screening";
import type { RobAssessmentRecord } from "@/lib/validators/risk-of-bias";
import type { MetaAnalysisEntryRecord } from "@/lib/validators/meta-analysis";

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
  activity: {
    all: ["activity"] as const,
    list: (params: ActivityListParams) => ["activity", "list", params] as const,
  },
  screening: {
    all: ["screening"] as const,
    byProtocol: (protocolId: string) =>
      ["screening", "protocol", protocolId] as const,
    counts: (protocolId: string) =>
      ["screening", "counts", protocolId] as const,
  },
  riskOfBias: {
    all: ["riskOfBias"] as const,
    byProtocol: (protocolId: string) =>
      ["riskOfBias", "protocol", protocolId] as const,
  },
  metaAnalysis: {
    all: ["metaAnalysis"] as const,
    byProtocol: (protocolId: string) =>
      ["metaAnalysis", "protocol", protocolId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    byUser: (userId: string) => ["notifications", "user", userId] as const,
    unreadCount: (userId: string) =>
      ["notifications", "unread", userId] as const,
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

/**
 * Fetch paginated activity log entries.
 */
export function useActivityList(params: ActivityListParams) {
  return useQuery({
    queryKey: queryKeys.activity.list(params),
    queryFn: async () => {
      const result = await fetchActivityLogPaginated(params);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch all screening decisions for a protocol.
 */
export function useScreeningDecisions(protocolId: string) {
  return useQuery({
    queryKey: queryKeys.screening.byProtocol(protocolId),
    queryFn: async () => {
      const res = await fetch(`/api/screening?protocol_id=${protocolId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return (json.data ?? []) as ScreeningDecisionWithEvidence[];
    },
    enabled: !!protocolId,
  });
}

/**
 * Fetch all risk-of-bias assessments for a protocol.
 */
export function useRiskOfBiasAssessments(protocolId: string) {
  return useQuery({
    queryKey: queryKeys.riskOfBias.byProtocol(protocolId),
    queryFn: async () => {
      const res = await fetch(`/api/risk-of-bias?protocol_id=${protocolId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return (json.data ?? []) as RobAssessmentRecord[];
    },
    enabled: !!protocolId,
  });
}

/**
 * Fetch all meta-analysis entries for a protocol.
 */
export function useMetaAnalysisEntries(protocolId: string) {
  return useQuery({
    queryKey: queryKeys.metaAnalysis.byProtocol(protocolId),
    queryFn: async () => {
      const res = await fetch(`/api/meta-analysis?protocol_id=${protocolId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return (json.data ?? []) as MetaAnalysisEntryRecord[];
    },
    enabled: !!protocolId,
  });
}
