"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  protocolVersionCreateSchema,
  type ProtocolVersionCreateValues,
} from "@/lib/validators/protocol-version";
import { Loader2, Save } from "lucide-react";

interface VersionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProtocolVersionCreateValues) => Promise<void>;
  nextVersionNumber: number;
}

/**
 * Dialog for creating a new protocol version snapshot.
 * Collects an optional change summary from the user.
 */
export function VersionCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  nextVersionNumber,
}: VersionCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProtocolVersionCreateValues>({
    resolver: zodResolver(protocolVersionCreateSchema),
    defaultValues: {
      change_summary: "",
    },
  });

  const handleSubmit = async (values: ProtocolVersionCreateValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Version {nextVersionNumber}</DialogTitle>
          <DialogDescription>
            Create an immutable snapshot of the current protocol state. This
            cannot be modified after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="change_summary">Change Summary (optional)</Label>
              <Textarea
                id="change_summary"
                placeholder="Describe what changed in this version..."
                {...form.register("change_summary")}
                rows={3}
              />
              {form.formState.errors.change_summary && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.change_summary.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Version
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
