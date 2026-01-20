"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  getProtocolById,
  updateProtocol,
  deleteProtocol,
  type Protocol,
  type ProtocolStatus,
} from "@/lib/storage/protocols"
import { protocolSchema, type ProtocolFormValues } from "@/lib/validators/protocol"
import {
  getLinkedEvidence,
  fetchEvidenceItems,
  linkEvidenceToProtocol,
  unlinkEvidence,
} from "@/lib/supabase/evidence"
import type { EvidenceItem } from "@/lib/validators/evidence"
import { Plus, X, ExternalLink, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProtocolDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const protocolId = params?.id
  const { toast } = useToast()

  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Evidence linking state
  const [linkedEvidence, setLinkedEvidence] = useState<any[]>([])
  const [availableEvidence, setAvailableEvidence] = useState<EvidenceItem[]>([])
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [evidenceSearchQuery, setEvidenceSearchQuery] = useState("")
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<Set<string>>(new Set())

  const form = useForm<ProtocolFormValues>({
    resolver: zodResolver(protocolSchema),
    defaultValues: {
      title: "",
      study_question: "",
      population: "",
      comparator: "",
      outcomes: "",
      design: "",
      status: "draft",
    },
    mode: "onTouched",
  })

  useEffect(() => {
    if (!protocolId || typeof protocolId !== "string") {
      setError("Missing protocol ID.")
      setIsLoading(false)
      return
    }

    const data = getProtocolById(protocolId)
    
    if (!data) {
      setError("Protocol not found.")
      setIsLoading(false)
      return
    }
    
    setProtocol(data)
    form.reset({
      title: data.title,
      study_question: data.study_question,
      population: data.population,
      comparator: data.comparator,
      outcomes: data.outcomes,
      design: data.design,
      status: data.status,
    })
    setIsLoading(false)

    // Load linked evidence
    loadLinkedEvidence()
  }, [protocolId, form])

  const loadLinkedEvidence = async () => {
    if (!protocolId || typeof protocolId !== "string") return

    try {
      const { data, error } = await getLinkedEvidence(protocolId)
      if (!error && data) {
        setLinkedEvidence(data)
      }
    } catch (error) {
      console.error("Error loading linked evidence:", error)
    }
  }

  const loadAvailableEvidence = async () => {
    try {
      const { data, error } = await fetchEvidenceItems()
      if (!error && data) {
        setAvailableEvidence(data)
      }
    } catch (error) {
      console.error("Error loading evidence:", error)
    }
  }

  const handleLinkEvidence = async () => {
    if (!protocolId || typeof protocolId !== "string" || selectedEvidenceIds.size === 0) return

    try {
      for (const evidenceId of selectedEvidenceIds) {
        await linkEvidenceToProtocol(protocolId, evidenceId)
      }

      toast({
        title: "Success",
        description: `Linked ${selectedEvidenceIds.size} evidence item(s)`,
      })

      setSelectedEvidenceIds(new Set())
      setIsLinkDialogOpen(false)
      loadLinkedEvidence()
    } catch (error) {
      console.error("Error linking evidence:", error)
      toast({
        title: "Error",
        description: "Failed to link evidence",
        variant: "destructive",
      })
    }
  }

  const handleUnlinkEvidence = async (linkId: string) => {
    try {
      const { error } = await unlinkEvidence(linkId)
      if (error) {
        toast({
          title: "Error",
          description: "Failed to unlink evidence",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Evidence unlinked successfully",
      })
      loadLinkedEvidence()
    } catch (error) {
      console.error("Error unlinking evidence:", error)
    }
  }

  const toggleEvidenceSelection = (evidenceId: string) => {
    const newSelection = new Set(selectedEvidenceIds)
    if (newSelection.has(evidenceId)) {
      newSelection.delete(evidenceId)
    } else {
      newSelection.add(evidenceId)
    }
    setSelectedEvidenceIds(newSelection)
  }

  const filteredAvailableEvidence = availableEvidence.filter((item) => {
    if (!evidenceSearchQuery) return true
    const query = evidenceSearchQuery.toLowerCase()
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  })

  const handleSave = (values: ProtocolFormValues) => {
    if (!protocolId || typeof protocolId !== "string") return
    setError(null)
    setIsSaving(true)

    try {
      const updated = updateProtocol(protocolId, {
        ...values,
        status: values.status as ProtocolStatus,
      })

      if (updated) {
        setProtocol(updated)
        form.reset({
          title: updated.title,
          study_question: updated.study_question,
          population: updated.population,
          comparator: updated.comparator,
          outcomes: updated.outcomes,
          design: updated.design,
          status: updated.status,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save protocol")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (!protocolId || typeof protocolId !== "string") return
    if (!window.confirm("Delete this protocol? This cannot be undone.")) return
    
    setIsDeleting(true)
    const deleted = deleteProtocol(protocolId)
    
    if (deleted) {
      router.push("/app")
    } else {
      setError("Failed to delete protocol")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading protocol...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  if (!protocol) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Protocol unavailable</CardTitle>
              <CardDescription>
                {error ?? "We couldn't load that protocol."}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="ghost">
                <Link href="/app">Back to dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Protocol details</CardTitle>
            <CardDescription>
              Last updated {new Date(protocol.updated_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              <CardContent className="space-y-6">
                {error && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protocol title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="study_question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study question</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="population"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Population</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="comparator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comparator</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="outcomes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outcomes</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="design"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study design</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="in_review">In review</SelectItem>
                            <SelectItem value="final">Final</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap justify-between gap-3">
                <Button asChild variant="ghost">
                  <Link href="/app">Back to dashboard</Link>
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleDelete} 
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Linked Evidence Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Linked Evidence</CardTitle>
                <CardDescription>
                  Evidence items supporting this protocol ({linkedEvidence.length})
                </CardDescription>
              </div>
              <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={loadAvailableEvidence}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Evidence
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Link Evidence to Protocol</DialogTitle>
                    <DialogDescription>
                      Select evidence items to link to this protocol
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search evidence..."
                        value={evidenceSearchQuery}
                        onChange={(e) => setEvidenceSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {filteredAvailableEvidence.map((item) => {
                        const isLinked = linkedEvidence.some(
                          (link: any) => link.evidence_id === item.id
                        )
                        const isSelected = selectedEvidenceIds.has(item.id)

                        return (
                          <div
                            key={item.id}
                            className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                              isLinked
                                ? "opacity-50 cursor-not-allowed"
                                : isSelected
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-muted-foreground/50"
                            }`}
                            onClick={() => !isLinked && toggleEvidenceSelection(item.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {item.type}
                                  </Badge>
                                  {isLinked && (
                                    <Badge variant="secondary" className="text-xs">
                                      Already linked
                                    </Badge>
                                  )}
                                </div>
                                <p className="font-medium text-sm line-clamp-1">
                                  {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {item.description}
                                </p>
                              </div>
                              {isSelected && !isLinked && (
                                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                  <svg
                                    className="h-3 w-3 text-primary-foreground"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {filteredAvailableEvidence.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          No evidence found
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsLinkDialogOpen(false)
                        setSelectedEvidenceIds(new Set())
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleLinkEvidence}
                      disabled={selectedEvidenceIds.size === 0}
                    >
                      Link {selectedEvidenceIds.size > 0 && `(${selectedEvidenceIds.size})`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {linkedEvidence.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No evidence linked yet. Click "Add Evidence" to link supporting evidence.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedEvidence.map((link: any) => (
                  <div
                    key={link.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {link.evidence_items.type}
                        </Badge>
                        {link.evidence_items.status === "published" && (
                          <Badge variant="secondary" className="text-xs">
                            Published
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium mb-1">{link.evidence_items.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {link.evidence_items.description}
                      </p>
                      {link.note && (
                        <div className="mt-2 rounded-md bg-muted/50 p-2">
                          <p className="text-xs text-muted-foreground">
                            <strong>Note:</strong> {link.note}
                          </p>
                        </div>
                      )}
                      {link.evidence_items.tags && link.evidence_items.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {link.evidence_items.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {link.evidence_items.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{link.evidence_items.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/app/evidence/${link.evidence_id}`}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkEvidence(link.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
