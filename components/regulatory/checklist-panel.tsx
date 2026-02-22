"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ChecklistItemRow } from "./checklist-item";
import { ChecklistProgress } from "./checklist-progress";
import { CONSORT_CHECKLIST } from "@/lib/regulatory/consort-checklist";
import {
  getStrobeItemsForStudyType,
  type StrobeStudyType,
} from "@/lib/regulatory/strobe-checklist";
import type {
  ChecklistType,
  ChecklistItemState,
} from "@/lib/validators/reporting-checklist";

interface ChecklistPanelProps {
  protocolId: string;
  checklistType: ChecklistType;
}

/** Default item state factory. */
function defaultItemState(itemId: string): ChecklistItemState {
  return {
    item_id: itemId,
    status: "not_started",
    notes: "",
    page_reference: "",
  };
}

/**
 * CONSORT or STROBE checklist panel with save functionality.
 */
export function ChecklistPanel({
  protocolId,
  checklistType,
}: ChecklistPanelProps) {
  const [strobeType, setStrobeType] = useState<StrobeStudyType>("cohort");
  const [items, setItems] = useState<Map<string, ChecklistItemState>>(
    new Map(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  /** Get the checklist items based on type. */
  const getChecklistItems = useCallback(() => {
    if (checklistType === "consort") {
      return CONSORT_CHECKLIST.map((item) => ({
        id: item.id,
        section: item.section,
        description: item.description,
        picoMapping: item.picoMapping,
      }));
    }
    return getStrobeItemsForStudyType(strobeType).map((item) => ({
      id: item.id,
      section: item.section,
      description: item.description,
      picoMapping: item.picoMapping,
    }));
  }, [checklistType, strobeType]);

  /** Load saved checklist from API. */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/reporting-checklist?protocol_id=${protocolId}&checklist_type=${checklistType}`,
        );
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const saved = json.data[0];
          const map = new Map<string, ChecklistItemState>();
          for (const item of saved.items || []) {
            map.set(item.item_id, item);
          }
          setItems(map);
        }
      } catch (err) {
        console.error("Failed to load checklist:", err);
        toast.error("Failed to load saved checklist data.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [protocolId, checklistType]);

  /** Update a single item (reads from `prev` to avoid stale closures). */
  const updateItem = (
    itemId: string,
    field: keyof ChecklistItemState,
    value: string,
  ) => {
    setItems((prev) => {
      const next = new Map(prev);
      const current = prev.get(itemId) ?? defaultItemState(itemId);
      next.set(itemId, { ...current, [field]: value });
      return next;
    });
    setIsDirty(true);
  };

  /** Memoized checklist items. */
  const checklistItems = useMemo(
    () => getChecklistItems(),
    [getChecklistItems],
  );

  /** Memoized sections grouping (single O(n) pass). */
  const sections = useMemo(() => {
    const map = new Map<string, Array<(typeof checklistItems)[number]>>();
    for (const item of checklistItems) {
      if (!map.has(item.section)) map.set(item.section, []);
      map.get(item.section)!.push(item);
    }
    return [...map.entries()].map(([section, sectionItems]) => ({
      section,
      items: sectionItems,
    }));
  }, [checklistItems]);

  /** Calculate completion percentage. */
  const completionPct = useMemo(() => {
    const total = checklistItems.length;
    if (total === 0) return 0;
    const done = checklistItems.filter((item) => {
      const state = items.get(item.id);
      return state?.status === "complete" || state?.status === "not_applicable";
    }).length;
    return Math.round((done / total) * 100);
  }, [checklistItems, items]);

  /** Get item state for rendering (reads from current items). */
  const getItemState = (itemId: string): ChecklistItemState => {
    return items.get(itemId) ?? defaultItemState(itemId);
  };

  /** Save checklist to API. */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const itemsArray: ChecklistItemState[] = checklistItems.map((item) => {
        const state = getItemState(item.id);
        return {
          item_id: item.id,
          status: state.status,
          notes: state.notes,
          page_reference: state.page_reference,
        };
      });

      const body: Record<string, unknown> = {
        protocol_id: protocolId,
        checklist_type: checklistType,
        items: itemsArray,
        completion_pct: completionPct,
      };

      if (checklistType === "strobe") {
        body.strobe_study_type = strobeType;
      }

      const res = await fetch("/api/reporting-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }

      toast.success("Checklist saved");
      setIsDirty(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save checklist",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const title = checklistType === "consort" ? "CONSORT 2010" : "STROBE";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title} Checklist</CardTitle>
              <CardDescription>
                {checklistType === "consort"
                  ? "25-item checklist for reporting randomized controlled trials"
                  : "22-item checklist for reporting observational studies"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {checklistType === "strobe" && (
                <Select
                  value={strobeType}
                  onValueChange={(v) => setStrobeType(v as StrobeStudyType)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cohort">Cohort</SelectItem>
                    <SelectItem value="case-control">Case-Control</SelectItem>
                    <SelectItem value="cross-sectional">
                      Cross-Sectional
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChecklistProgress
            items={checklistItems.map((item) => ({
              status: getItemState(item.id).status,
            }))}
            total={checklistItems.length}
          />
        </CardContent>
      </Card>

      {sections.map((group) => (
        <Card key={group.section}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-zinc-400">
              {group.section}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {group.items.map((item) => {
              const state = getItemState(item.id);
              return (
                <ChecklistItemRow
                  key={item.id}
                  itemId={item.id}
                  section={item.section}
                  description={item.description}
                  status={state.status}
                  notes={state.notes ?? ""}
                  pageReference={state.page_reference ?? ""}
                  picoMapping={item.picoMapping}
                  onStatusChange={(s) => updateItem(item.id, "status", s)}
                  onNotesChange={(n) => updateItem(item.id, "notes", n)}
                  onPageReferenceChange={(p) =>
                    updateItem(item.id, "page_reference", p)
                  }
                />
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
