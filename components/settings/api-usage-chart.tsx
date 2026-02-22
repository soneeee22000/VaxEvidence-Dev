"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, BarChart3 } from "lucide-react";

// =============================================================================
// API USAGE CHART
// =============================================================================
// Renders a bar chart of daily API request counts for a given API key,
// fetched from /api/workspaces/[id]/api-keys/[keyId]/usage.
// =============================================================================

/** Shape of a single daily data point from the usage API. */
interface DailyUsage {
  date: string;
  count: number;
  avg_response_ms: number;
}

/** API response shape from the usage endpoint. */
interface UsageResponse {
  data: {
    total_requests: number;
    daily: DailyUsage[];
  };
}

interface ApiUsageChartProps {
  /** The workspace ID that owns the API key. */
  workspaceId: string;
  /** The API key ID to fetch usage for. */
  keyId: string;
}

/**
 * Custom tooltip component for the recharts BarChart.
 * Renders date, request count, and average response time.
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: DailyUsage }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      <p className="text-xs text-muted-foreground">
        Requests:{" "}
        <span className="font-semibold text-foreground">{data.count}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Avg response:{" "}
        <span className="font-semibold text-foreground">
          {data.avg_response_ms}ms
        </span>
      </p>
    </div>
  );
}

export function ApiUsageChart({ workspaceId, keyId }: ApiUsageChartProps) {
  const [dailyData, setDailyData] = useState<DailyUsage[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/api-keys/${keyId}/usage?days=7`,
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? "Failed to load usage data",
          );
        }

        const { data } = (await res.json()) as UsageResponse;
        setDailyData(data.daily);
        setTotalRequests(data.total_requests);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load usage");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsage();
  }, [workspaceId, keyId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">API Usage (Last 7 Days)</CardTitle>
            <CardDescription className="text-xs">
              {isLoading
                ? "Loading..."
                : `${totalRequests} total request${totalRequests !== 1 ? "s" : ""}`}
            </CardDescription>
          </div>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="flex items-center justify-center h-48">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && dailyData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              No API requests recorded in the last 7 days
            </p>
          </div>
        )}

        {/* Chart */}
        {!isLoading && !error && dailyData.length > 0 && (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: string) => {
                    const d = new Date(value);
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
