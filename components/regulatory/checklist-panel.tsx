"use client";

import { useState, useCallback, useEffect } from "react";
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
import {
  CONSORT_CHECKLIST,
  getConsortSections,
} from "@/lib/regulatory/consort-checklist";
import {
  STROBE_CHECKLIST,
  getStrobeItemsForStudyType,
  type StrobeStudyType,
} from "@/lib/regulatory/strobe-checklist";
import type {
  ChecklistType,
  ChecklistItemStatus,
  ChecklistItemState,
} from "@/lib/validators/reporting-checklist";

interface ChecklistPanelProps {
  protocolId: string;
  checklistType: ChecklistType;
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
      } catch {
        // No saved data, start fresh
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [protocolId, checklistType]);

  /** Get or create item state. */
  const getItemState = (itemId: string): ChecklistItemState => {
    return (
      items.get(itemId) ?? {
        item_id: itemId,
        status: "not_started",
        notes: "",
        page_reference: "",
      }
    );
  };

  /** Update a single item. */
  const updateItem = (
    itemId: string,
    field: keyof ChecklistItemState,
    value: string,
  ) => {
    setItems((prev) => {
      const next = new Map(prev);
      const current = getItemState(itemId);
      next.set(itemId, { ...current, [field]: value });
      return next;
    });
    setIsDirty(true);
  };

  /** Calculate completion percentage. */
  const calculateCompletion = (): number => {
    const checklistItems = getChecklistItems();
    const total = checklistItems.length;
    if (total === 0) return 0;
    const done = checklistItems.filter((item) => {
      const state = items.get(item.id);
      return state?.status === "complete" || state?.status === "not_applicable";
    }).length;
    return Math.round((done / total) * 100);
  };

  /** Save checklist to API. */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const checklistItems = getChecklistItems();
      const itemsArray: ChecklistItemState[] = checklistItems.map((item) => ({
        item_id: item.id,
        status: getItemState(item.id).status,
        notes: getItemState(item.id).notes,
        page_reference: getItemState(item.id).page_reference,
      }));

      const res = await fetch("/api/reporting-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol_id: protocolId,
          checklist_type: checklistType,
          items: itemsArray,
          completion_pct: calculateCompletion(),
        }),
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

  const checklistItems = getChecklistItems();
  const title = checklistType === "consort" ? "CONSORT 2010" : "STROBE";

  /** Group items by section. */
  const sections: { section: string; items: typeof checklistItems }[] = [];
  const sectionSet = new Set<string>();
  for (const item of checklistItems) {
    if (!sectionSet.has(item.section)) {
      sectionSet.add(item.section);
      sections.push({
        section: item.section,
        items: checklistItems.filter((i) => i.section === item.section),
      });
    }
  }

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
