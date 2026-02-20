import { QueryClient } from "@tanstack/react-query";

/**
 * Create a QueryClient with project-wide defaults.
 * - staleTime 30s: data considered fresh for 30 seconds
 * - gcTime 5min: unused cache entries garbage-collected after 5 minutes
 * - retry 1: single retry on failure
 * - refetchOnWindowFocus off: researchers may tab-switch frequently
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 300_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
