"use client";

/**
 * Wraps a form field with a colored ring + floating email pill when
 * another user is focused on that field.
 */

import { useCallback } from "react";
import { usePresence } from "@/lib/collaboration/presence-context";
import {
  COLLABORATOR_RING_CLASSES,
  getUserColorIndex,
} from "@/lib/collaboration/constants";

interface FieldPresenceIndicatorProps {
  /** The protocol field name (e.g. "population", "title"). */
  fieldName: string;
  children: React.ReactNode;
}

export function FieldPresenceIndicator({
  fieldName,
  children,
}: FieldPresenceIndicatorProps) {
  const { activeFieldUsers, setActiveField } = usePresence();
  const fieldUsers = activeFieldUsers[fieldName] ?? [];
  const hasOthers = fieldUsers.length > 0;
  const firstUser = fieldUsers[0];
  const ringClass = firstUser
    ? COLLABORATOR_RING_CLASSES[getUserColorIndex(firstUser.userId)]
    : "";

  const handleFocus = useCallback(() => {
    setActiveField(fieldName);
  }, [fieldName, setActiveField]);

  const handleBlur = useCallback(() => {
    setActiveField(null);
  }, [setActiveField]);

  return (
    <div className="relative" onFocus={handleFocus} onBlur={handleBlur}>
      {/* Colored ring around the field when another user is editing */}
      <div className={hasOthers ? `ring-2 rounded-md ${ringClass}` : ""}>
        {children}
      </div>

      {/* Floating user pill */}
      {hasOthers && firstUser && (
        <div
          className="absolute -top-2.5 right-2 z-10 flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium shadow-sm border"
          style={{ color: firstUser.color }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: firstUser.color }}
          />
          {firstUser.email.split("@")[0]}
          {fieldUsers.length > 1 && (
            <span className="text-muted-foreground">
              +{fieldUsers.length - 1}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
