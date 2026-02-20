import { createClient } from "@/lib/supabase/browser";

import type {
  ReviewDecisionValues,
  ReviewStatus,
  ReviewWithDetails,
} from "@/lib/validators/review";

type SupabaseResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

function getClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

const notConfigured = <T>(
  message = "Supabase is not configured.",
): { data: T | null; error: { message: string } } => {
  return { data: null, error: { message } };
};

const safeCall = async <T>(
  fn: () => Promise<{ data: T | null; error: any }>,
): SupabaseResult<T> => {
  try {
    const { data, error } = await fn();
    return {
      data: (data ?? null) as T | null,
      error: error ? { message: error.message ?? String(error) } : null,
    };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
};

const userEmail = (_userId: string) => "Unknown user";

const toWithDetails = (rows: any[] | null): ReviewWithDetails[] => {
  const list = rows ?? [];
  return list.map((row) => ({
    ...row,
    reviewer: { id: row.reviewer_id, email: userEmail(row.reviewer_id) },
    requester: { id: row.requester_id, email: userEmail(row.requester_id) },
    protocol: {
      id: row.protocol_id,
      title: row.protocol_title ?? "Protocol",
      status: row.protocol_status ?? "unknown",
    },
  }));
};

export const fetchPendingReviewCount = async (
  userId: string,
): SupabaseResult<number> => {
  const client = getClient();
  if (!client) return notConfigured<number>();

  const { data, error } = await safeCall(async () => {
    const res = await client
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("reviewer_id", userId)
      .eq("status", "pending");

    return { data: (res.count ?? 0) as any, error: res.error };
  });

  return { data, error };
};

export const fetchReviews = async (
  protocolId: string,
): SupabaseResult<ReviewWithDetails[]> => {
  const client = getClient();
  if (!client) return notConfigured<ReviewWithDetails[]>();

  const { data, error } = await safeCall(() =>
    client
      .from("reviews")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("requested_at", { ascending: false }),
  );

  if (error) return { data: null, error };
  return { data: toWithDetails((data as any[]) ?? []), error: null };
};

export const requestReview = async (payload: {
  protocol_id: string;
  reviewer_id: string;
  requester_id: string;
  message?: string;
}): SupabaseResult<ReviewWithDetails> => {
  const client = getClient();
  if (!client) return notConfigured<ReviewWithDetails>();

  const now = new Date().toISOString();
  const { data, error } = await safeCall(() =>
    client
      .from("reviews")
      .insert({
        protocol_id: payload.protocol_id,
        reviewer_id: payload.reviewer_id,
        requester_id: payload.requester_id,
        status: "pending",
        decision: null,
        decision_at: null,
        requested_at: now,
        updated_at: now,
        message: payload.message ?? null,
      })
      .select("*")
      .single(),
  );

  if (error || !data) return { data: null, error };
  const [withDetails] = toWithDetails([data]);
  return { data: withDetails ?? null, error: null };
};

export const submitReviewDecision = async (
  reviewId: string,
  payload: ReviewDecisionValues,
): SupabaseResult<ReviewWithDetails> => {
  const client = getClient();
  if (!client) return notConfigured<ReviewWithDetails>();

  const now = new Date().toISOString();
  const { data, error } = await safeCall(() =>
    client
      .from("reviews")
      .update({
        status: payload.status as ReviewStatus,
        decision: payload.decision,
        decision_at: now,
        updated_at: now,
      })
      .eq("id", reviewId)
      .select("*")
      .single(),
  );

  if (error || !data) return { data: null, error };
  const [withDetails] = toWithDetails([data]);
  return { data: withDetails ?? null, error: null };
};

export const cancelReview = async (reviewId: string): SupabaseResult<null> => {
  const client = getClient();
  if (!client) return notConfigured<null>();
  return safeCall(() => client.from("reviews").delete().eq("id", reviewId));
};
