"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { createEvidence } from "@/lib/supabase/evidence";
import type { EvidenceType, EvidenceStatus } from "@/lib/validators/evidence";
import {
  evidenceTypes,
  evidenceStatuses,
  suggestedTags,
} from "@/lib/validators/evidence";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function NewEvidencePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [type, setType] = useState<EvidenceType>("academic");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<EvidenceStatus>("draft");
  const [authors, setAuthors] = useState("");
  const [journal, setJournal] = useState("");
  const [doi, setDoi] = useState("");
  const [regulatoryBody, setRegulatoryBody] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (tag: string) => {
    if (!tag.trim() || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    // Type-specific validation
    if (type === "academic" && !authors.trim()) {
      toast.error("Authors are required for academic papers");
      return;
    }

    if (type === "regulatory" && !regulatoryBody.trim()) {
      toast.error("Regulatory body is required for regulatory documents");
      return;
    }

    if (type === "dataset" && !sourceUrl.trim()) {
      toast.error("Source URL is required for datasets");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        user_id: user!.id,
        type,
        title: title.trim(),
        description: description.trim(),
        status,
        tags,
        publication_date: publicationDate || null,
        source_url: sourceUrl || null,
      };

      // Add type-specific fields
      if (type === "academic") {
        payload.authors = authors.trim();
        payload.journal = journal.trim() || null;
        payload.doi = doi.trim() || null;
      } else if (type === "regulatory") {
        payload.regulatory_body = regulatoryBody.trim();
        payload.document_type = documentType.trim() || null;
      }

      const { data, error } = await createEvidence(payload);

      if (error || !data) {
        toast.error("Failed to create evidence");
        return;
      }

      toast.success("Evidence created successfully");
      router.push(`/app/evidence/${data.id}`);
    } catch (error) {
      console.error("Error creating evidence:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/evidence">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Evidence Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Evidence</CardTitle>
              <CardDescription>
                Add a new evidence item to your library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Evidence Type *</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) => setType(v as EvidenceType)}
                  className="grid grid-cols-2 gap-4 mt-3"
                >
                  {evidenceTypes.map((evidenceType) => (
                    <Label
                      key={evidenceType}
                      htmlFor={evidenceType}
                      className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent"
                    >
                      <RadioGroupItem value={evidenceType} id={evidenceType} />
                      <span className="capitalize">{evidenceType}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as EvidenceStatus)}
                >
                  <SelectTrigger id="status" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {evidenceStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter evidence title..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed description..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="publication_date">Publication Date</Label>
                <Input
                  id="publication_date"
                  type="date"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Type-Specific Fields */}
          {type === "academic" && (
            <Card>
              <CardHeader>
                <CardTitle>Academic Paper Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="authors">Authors *</Label>
                  <Input
                    id="authors"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    placeholder="e.g., Smith J, Doe A, et al."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="journal">Journal</Label>
                  <Input
                    id="journal"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    placeholder="e.g., New England Journal of Medicine"
                  />
                </div>

                <div>
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    placeholder="e.g., 10.1056/NEJMoa2035389"
                  />
                </div>

                <div>
                  <Label htmlFor="source_url_academic">Source URL</Label>
                  <Input
                    id="source_url_academic"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {type === "regulatory" && (
            <Card>
              <CardHeader>
                <CardTitle>Regulatory Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="regulatory_body">Regulatory Body *</Label>
                  <Input
                    id="regulatory_body"
                    value={regulatoryBody}
                    onChange={(e) => setRegulatoryBody(e.target.value)}
                    placeholder="e.g., FDA, CDC, WHO, EMA"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="document_type">Document Type</Label>
                  <Input
                    id="document_type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    placeholder="e.g., Guidance Document, EUA Briefing"
                  />
                </div>

                <div>
                  <Label htmlFor="source_url_regulatory">Source URL</Label>
                  <Input
                    id="source_url_regulatory"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {type === "dataset" && (
            <Card>
              <CardHeader>
                <CardTitle>Dataset Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="source_url_dataset">Source URL *</Label>
                  <Input
                    id="source_url_dataset"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to make this evidence easier to find
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddTag(tagInput)}
                >
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div>
                <Label className="text-sm text-muted-foreground">
                  Suggested tags:
                </Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {suggestedTags.slice(0, 12).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleAddTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/app/evidence">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Creating..." : "Create Evidence"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
