import { getSupabaseAdmin, getServerUser } from "@/lib/supabase/server";

/**
 * Verify that the authenticated user owns the given protocol.
 * Returns the user on success, or an error object on failure.
 */
export async function verifyProtocolOwnership(
  protocolId: string,
): Promise<
  | { user: { id: string }; error: null }
  | { user: null; error: { message: string; status: number } }
> {
  const user = await getServerUser();
  if (!user) {
    return { user: null, error: { message: "Unauthorized", status: 401 } };
  }

  const admin = getSupabaseAdmin();
  const { data: protocol } = await admin
    .from("protocols")
    .select("user_id")
    .eq("id", protocolId)
    .single();

  if (!protocol) {
    return {
      user: null,
      error: { message: "Protocol not found", status: 404 },
    };
  }

  if (protocol.user_id !== user.id) {
    return { user: null, error: { message: "Forbidden", status: 403 } };
  }

  return { user, error: null };
}
