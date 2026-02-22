"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivityFeed } from "@/components/collaboration/activity-feed";
import { ActivityExportMenu } from "@/components/export/activity-export-menu";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useActivityList } from "@/lib/query/hooks";
import { buildPaginationMeta, DEFAULT_PAGE_SIZE } from "@/lib/types/pagination";

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading } = useActivityList({ page, pageSize });

  const activities = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pagination = buildPaginationMeta(totalCount, page, pageSize);

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>
                  Recent activity across all protocols, evidence, and datasets
                </CardDescription>
              </div>
              <ActivityExportMenu />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Loading activities...
              </div>
            ) : (
              <ActivityFeed activities={activities} showFilters={true} />
            )}
            <PaginationControls
              pagination={pagination}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
