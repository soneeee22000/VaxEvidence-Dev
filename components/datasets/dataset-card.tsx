import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { Dataset } from "@/lib/validators/dataset";
import {
  formatFileSize,
  getDatasetTypeLabel,
  getDatasetTypeColor,
} from "@/lib/validators/dataset";
import {
  Database,
  FileSpreadsheet,
  FileText,
  FileJson,
  Calendar,
  HardDrive,
  Grid3x3,
  Download,
  ExternalLink,
} from "lucide-react";

interface DatasetCardProps {
  dataset: Dataset;
  onDownload?: (dataset: Dataset) => void;
}

const FILE_TYPE_ICONS: Record<string, typeof FileText> = {
  csv: FileText,
  xlsx: FileSpreadsheet,
  json: FileJson,
};

export function DatasetCard({ dataset, onDownload }: DatasetCardProps) {
  const FileIcon = FILE_TYPE_ICONS[dataset.file_type] ?? Database;
  const typeColor = getDatasetTypeColor(dataset.dataset_type);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
            <Badge
              variant="outline"
              className={`capitalize ${
                typeColor === "blue"
                  ? "border-blue-500/50 text-blue-600 dark:text-blue-400"
                  : typeColor === "purple"
                    ? "border-purple-500/50 text-purple-600 dark:text-purple-400"
                    : typeColor === "orange"
                      ? "border-orange-500/50 text-orange-600 dark:text-orange-400"
                      : typeColor === "green"
                        ? "border-green-500/50 text-green-600 dark:text-green-400"
                        : ""
              }`}
            >
              {getDatasetTypeLabel(dataset.dataset_type)}
            </Badge>
          </div>
          <Badge
            variant={
              dataset.status === "validated"
                ? "default"
                : dataset.status === "draft"
                  ? "secondary"
                  : "outline"
            }
            className="text-xs"
          >
            {dataset.status}
          </Badge>
        </div>
        <h3 className="font-semibold leading-tight line-clamp-2">
          {dataset.name}
        </h3>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {dataset.description}
        </p>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            <span>{formatFileSize(dataset.file_size)}</span>
          </div>
          {dataset.row_count && (
            <div className="flex items-center gap-1">
              <Grid3x3 className="h-3 w-3" />
              <span>
                {dataset.row_count.toLocaleString()} rows ×{" "}
                {dataset.column_count} cols
              </span>
            </div>
          )}
          {dataset.date_range_start && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(dataset.date_range_start).toLocaleDateString()}
                {dataset.date_range_end &&
                  ` - ${new Date(dataset.date_range_end).toLocaleDateString()}`}
              </span>
            </div>
          )}
        </div>

        {dataset.tags && dataset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dataset.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {dataset.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{dataset.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/app/datasets/${dataset.id}`}>
            <ExternalLink className="mr-2 h-3 w-3" />
            View
          </Link>
        </Button>
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={() => onDownload(dataset)}>
            <Download className="mr-2 h-3 w-3" />
            Download
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
