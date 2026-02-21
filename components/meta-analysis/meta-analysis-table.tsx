"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MetaAnalysisEntryRecord } from "@/lib/validators/meta-analysis";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface MetaAnalysisTableProps {
  entries: MetaAnalysisEntryRecord[];
  onAdd: (entry: {
    study_label: string;
    effect_size: number;
    ci_lower: number;
    ci_upper: number;
    weight: number | null;
    subgroup: string | null;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/** Editable table for meta-analysis data entry. */
export function MetaAnalysisTable({
  entries,
  onAdd,
  onDelete,
}: MetaAnalysisTableProps) {
  const [newRow, setNewRow] = useState({
    study_label: "",
    effect_size: "",
    ci_lower: "",
    ci_upper: "",
    weight: "",
    subgroup: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (
      !newRow.study_label ||
      !newRow.effect_size ||
      !newRow.ci_lower ||
      !newRow.ci_upper
    )
      return;

    setIsAdding(true);
    try {
      await onAdd({
        study_label: newRow.study_label,
        effect_size: parseFloat(newRow.effect_size),
        ci_lower: parseFloat(newRow.ci_lower),
        ci_upper: parseFloat(newRow.ci_upper),
        weight: newRow.weight ? parseFloat(newRow.weight) : null,
        subgroup: newRow.subgroup || null,
      });
      setNewRow({
        study_label: "",
        effect_size: "",
        ci_lower: "",
        ci_upper: "",
        weight: "",
        subgroup: "",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-2 font-medium">Study</th>
            <th className="px-2 py-2 font-medium text-right">Effect Size</th>
            <th className="px-2 py-2 font-medium text-right">CI Lower</th>
            <th className="px-2 py-2 font-medium text-right">CI Upper</th>
            <th className="px-2 py-2 font-medium text-right">Weight</th>
            <th className="px-2 py-2 font-medium text-left">Subgroup</th>
            <th className="px-2 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b last:border-0">
              <td className="py-2 pr-2">{entry.study_label}</td>
              <td className="px-2 py-2 text-right tabular-nums">
                {entry.effect_size.toFixed(2)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {entry.ci_lower.toFixed(2)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {entry.ci_upper.toFixed(2)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {entry.weight?.toFixed(1) ?? "-"}
              </td>
              <td className="px-2 py-2 text-muted-foreground">
                {entry.subgroup ?? "-"}
              </td>
              <td className="px-2 py-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                >
                  {deletingId === entry.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </td>
            </tr>
          ))}

          {/* New row input */}
          <tr className="border-t">
            <td className="py-2 pr-2">
              <Input
                value={newRow.study_label}
                onChange={(e) =>
                  setNewRow((r) => ({ ...r, study_label: e.target.value }))
                }
                placeholder="Study label"
                className="h-8 text-sm"
              />
            </td>
            <td className="px-2 py-2">
              <Input
                type="number"
                step="0.01"
                value={newRow.effect_size}
                onChange={(e) =>
                  setNewRow((r) => ({ ...r, effect_size: e.target.value }))
                }
                placeholder="0.00"
                className="h-8 text-sm text-right w-[80px]"
              />
            </td>
            <td className="px-2 py-2">
              <Input
                type="number"
                step="0.01"
                value={newRow.ci_lower}
                onChange={(e) =>
                  setNewRow((r) => ({ ...r, ci_lower: e.target.value }))
                }
                placeholder="0.00"
                className="h-8 text-sm text-right w-[80px]"
              />
            </td>
            <td className="px-2 py-2">
              <Input
                type="number"
                step="0.01"
                value={newRow.ci_upper}
                onChange={(e) =>
                  setNewRow((r) => ({ ...r, ci_upper: e.target.value }))
                }
                placeholder="0.00"
                className="h-8 text-sm text-right w-[80px]"
              />
            </td>
            <td className="px-2 py-2">
              <Input
                type="number"
                step="0.1"
                value={newRow.weight}
                onChange={(e) =>
                  setNewRow((r) => ({ ...r, weight: e.target.value }))
                }
                placeholder="-"
                className="h-8 text-sm text-right w-[70px]"
              />
            </td>
            <td className="px-2 py-2">
              <Input
                value={newRow.subgroup}
                onChange={(e) =>
                  setNewRow((r) => ({ ...r, subgroup: e.target.value }))
                }
                placeholder="-"
                className="h-8 text-sm w-[100px]"
              />
            </td>
            <td className="px-2 py-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleAdd}
                disabled={
                  isAdding ||
                  !newRow.study_label ||
                  !newRow.effect_size ||
                  !newRow.ci_lower ||
                  !newRow.ci_upper
                }
              >
                {isAdding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
