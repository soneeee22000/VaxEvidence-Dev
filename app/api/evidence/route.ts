import { NextRequest, NextResponse } from "next/server";

import {
  createServerSupabaseClient,
  getServerUser,
} from "@/lib/supabase/server";
import {
  parseQueryParams,
  buildSupabaseRange,
  buildPaginationMeta,
} from "@/lib/types/pagination";

export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const params = parseQueryParams(url.searchParams);
    const search = url.searchParams.get("search") ?? undefined;
    const types = url.searchParams.getAll("type");
    const statuses = url.searchParams.getAll("status");
    const tags = url.searchParams.getAll("tags");
    const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
    const dateTo = url.searchParams.get("dateTo") ?? undefined;

    const { from, to } = buildSupabaseRange(params.page, params.pageSize);
    const sortBy = params.sortBy ?? "updated_at";
    const ascending = (params.sortDirection ?? "desc") === "asc";

    const supabase = await createServerSupabaseClient();
    let query = supabase.from("evidence_items").select("*", { count: "exact" });

    if (search) {
      query = query.textSearch("search_vector", search, { type: "websearch" });
    }

    if (types.length > 0) {
      query = query.in("type", types);
    }

    if (statuses.length > 0) {
      query = query.in("status", statuses);
    }

    if (tags.length > 0) {
      query = query.contains("tags", tags);
    }

    if (dateFrom) {
      query = query.gte("publication_date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("publication_date", dateTo);
    }

    query = query.order(sortBy, { ascending }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const pagination = buildPaginationMeta(
      count ?? 0,
      params.page,
      params.pageSize,
    );

    return NextResponse.json({ data: data ?? [], pagination });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("evidence_items")
      .insert({ ...payload, user_id: user.id })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
