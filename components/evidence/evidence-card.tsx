import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EvidenceItem } from "@/lib/validators/evidence";
import { FileText, Building2, Database, StickyNote } from "lucide-react";

interface EvidenceCardProps {
  evidence: EvidenceItem;
}

const typeIcons = {
  academic: FileText,
  regulatory: Building2,
  dataset: Database,
  note: StickyNote,
};

const typeColors = {
  academic: "bg-primary/10 text-primary border-primary/20",
  regulatory: "bg-secondary text-secondary-foreground border-border",
  dataset:
    "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  note: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const statusColors = {
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  published:
    "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  archived:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
};

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const Icon = typeIcons[evidence.type];
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  return (
    <Card className="h-full flex flex-col border-muted/70 hover:border-muted transition-colors">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={typeColors[evidence.type]} variant="outline">
            <Icon className="mr-1 h-3 w-3" />
            {evidence.type}
          </Badge>
          {evidence.status !== "published" && (
            <Badge className={statusColors[evidence.status]} variant="outline">
              {evidence.status}
            </Badge>
          )}
        </div>
        <div>
          <CardTitle className="text-lg line-clamp-2">
            {evidence.title}
          </CardTitle>
          <CardDescription className="mt-2">
            {evidence.type === "academic" && evidence.authors && (
              <span className="text-sm">{evidence.authors}</span>
            )}
            {evidence.type === "regulatory" && evidence.regulatory_body && (
              <span className="text-sm">{evidence.regulatory_body}</span>
            )}
            {(evidence.type === "dataset" || evidence.type === "note") && (
              <span className="text-sm">
                {formatDate(evidence.publication_date || evidence.created_at)}
              </span>
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {evidence.description}
        </p>
        {evidence.tags && evidence.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {evidence.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
            {evidence.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{evidence.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">
          {formatDate(evidence.publication_date) ||
            formatDate(evidence.updated_at)}
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href={`/app/evidence/${evidence.id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
